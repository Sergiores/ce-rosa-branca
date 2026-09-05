-- ============================================================
-- Casa Espirita Rosa Branca - schema completo
-- Gerado a partir de supabase/migrations/*.sql (execute de uma vez)
-- ============================================================


-- >>>>>>>>>>>>>>>>>>>> supabase/migrations/0001_base.sql

-- ============================================================
-- 0001_base.sql
-- Fundacao: papeis, profiles, permissoes por tela e auditoria.
-- A fronteira de permissao e o RLS do Postgres, nao a interface.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- Papeis ----------
do $$ begin
  create type public.papel_usuario as enum ('diretoria', 'voluntario', 'aluno', 'membro');
exception when duplicate_object then null; end $$;

-- ---------- Perfis ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  nome        text not null default '',
  email       text,
  telefone    text,
  role        public.papel_usuario not null default 'membro',
  ativo       boolean not null default true,
  criado_em   timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- Helper SECURITY DEFINER: politicas em profiles que consultam profiles
-- causariam recursao infinita. Este helper quebra o ciclo.
create or replace function public.meu_papel()
returns public.papel_usuario
language sql
stable
security definer
set search_path = public
as $$
  select p.role from public.profiles p where p.id = auth.uid() and p.ativo;
$$;

create or replace function public.eh_diretoria()
returns boolean
language sql
stable
as $$ select coalesce(public.meu_papel() = 'diretoria', false); $$;

-- Cria o profile automaticamente quando a diretoria convida um usuario.
-- O papel NUNCA vem do metadata do proprio usuario: se o signup publico
-- estiver ligado no projeto, qualquer um se cadastraria como diretoria.
-- Todo novo usuario nasce 'membro'; a tela de convite promove em seguida.
create or replace function public.fn_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', ''),
    new.email,
    'membro'
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists trg_novo_usuario on auth.users;
create trigger trg_novo_usuario
  after insert on auth.users
  for each row execute function public.fn_novo_usuario();

-- ---------- Auditoria ----------
create table if not exists public.auditoria (
  id            bigint generated always as identity primary key,
  tabela        text not null,
  registro_id   text,
  acao          text not null check (acao in ('INSERT','UPDATE','DELETE')),
  autor_id      uuid,
  autor_email   text,
  dados_antes   jsonb,
  dados_depois  jsonb,
  criado_em     timestamptz not null default now()
);
create index if not exists idx_auditoria_tabela on public.auditoria (tabela, criado_em desc);
create index if not exists idx_auditoria_autor  on public.auditoria (autor_id, criado_em desc);

-- Trigger generica. Registrar no banco (e nao na aplicacao) garante que nada
-- escapa: nem alteracao feita direto pelo painel do Supabase.
create or replace function public.fn_auditoria()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_registro text;
  v_antes    jsonb;
  v_depois   jsonb;
  v_email    text;
begin
  if tg_op = 'DELETE' then
    v_antes := to_jsonb(old);
    v_registro := v_antes->>'id';
  elsif tg_op = 'UPDATE' then
    v_antes := to_jsonb(old);
    v_depois := to_jsonb(new);
    v_registro := v_depois->>'id';
  else
    v_depois := to_jsonb(new);
    v_registro := v_depois->>'id';
  end if;

  begin
    v_email := nullif(current_setting('request.jwt.claims', true), '')::jsonb->>'email';
  exception when others then
    v_email := null;
  end;

  insert into public.auditoria (tabela, registro_id, acao, autor_id, autor_email, dados_antes, dados_depois)
  values (tg_table_name, v_registro, tg_op, auth.uid(), coalesce(v_email, session_user), v_antes, v_depois);

  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;

-- Toda migration nova deve chamar isto para a tabela que criar.
create or replace function public.aplicar_auditoria(p_tabela text)
returns void
language plpgsql
as $$
begin
  execute format('drop trigger if exists trg_auditoria on public.%I', p_tabela);
  execute format(
    'create trigger trg_auditoria after insert or update or delete on public.%I
       for each row execute function public.fn_auditoria()', p_tabela);
end $$;

-- ---------- Permissoes por tela (dirige a UI, nao substitui o RLS) ----------
create table if not exists public.permissoes (
  role      public.papel_usuario not null,
  tela_key  text not null,
  ver       boolean not null default false,
  editar    boolean not null default false,
  primary key (role, tela_key)
);

insert into public.permissoes (role, tela_key, ver, editar) values
  ('diretoria','painel',true,true),
  ('diretoria','conteudo',true,true),
  ('diretoria','atas',true,true),
  ('diretoria','usuarios',true,true),
  ('diretoria','permissoes',true,true),
  ('diretoria','membros',true,true),
  ('diretoria','compras',true,true),
  ('diretoria','contas_pagar',true,true),
  ('diretoria','contas_receber',true,true),
  ('diretoria','relatorios',true,true),
  ('diretoria','auditoria',true,false),
  ('diretoria','audiencia',true,false),
  ('voluntario','painel',true,false),
  ('voluntario','conteudo',true,true),
  ('aluno','painel',true,false),
  ('membro','painel',true,false)
on conflict (role, tela_key) do nothing;

-- ---------- RLS ----------
alter table public.profiles   enable row level security;
alter table public.permissoes enable row level security;
alter table public.auditoria  enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.eh_diretoria());

drop policy if exists profiles_update_proprio on public.profiles;
create policy profiles_update_proprio on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid() and role = public.meu_papel());

drop policy if exists profiles_admin on public.profiles;
create policy profiles_admin on public.profiles for all to authenticated
  using (public.eh_diretoria()) with check (public.eh_diretoria());

drop policy if exists permissoes_select on public.permissoes;
create policy permissoes_select on public.permissoes for select to authenticated using (true);

drop policy if exists permissoes_admin on public.permissoes;
create policy permissoes_admin on public.permissoes for all to authenticated
  using (public.eh_diretoria()) with check (public.eh_diretoria());

-- Auditoria e log imutavel: leitura para diretoria, sem update/delete para ninguem.
drop policy if exists auditoria_select on public.auditoria;
create policy auditoria_select on public.auditoria for select to authenticated
  using (public.eh_diretoria());

revoke insert, update, delete on public.auditoria from anon, authenticated;

select public.aplicar_auditoria('profiles');
select public.aplicar_auditoria('permissoes');


-- >>>>>>>>>>>>>>>>>>>> supabase/migrations/0002_conteudo.sql

-- ============================================================
-- 0002_conteudo.sql  -- Conteudo publico do site
-- Regra critica: a policy anonima le SOMENTE registros publicados.
-- ============================================================

do $$ begin
  create type public.status_publicacao as enum ('rascunho', 'publicado');
exception when duplicate_object then null; end $$;

-- ---------- Noticias ----------
create table if not exists public.noticias (
  id                 uuid primary key default gen_random_uuid(),
  titulo             text not null,
  slug               text not null unique,
  resumo             text,
  corpo              text not null default '',
  imagem_url         text,
  status             public.status_publicacao not null default 'rascunho',
  destaque_carrossel boolean not null default false,
  publicado_em       timestamptz,
  autor_id           uuid references public.profiles(id) on delete set null,
  criado_em          timestamptz not null default now(),
  atualizado_em      timestamptz not null default now()
);
create index if not exists idx_noticias_pub on public.noticias (status, publicado_em desc);

-- ---------- Paginas institucionais ----------
create table if not exists public.paginas (
  slug          text primary key,
  titulo        text not null,
  corpo         text not null default '',
  status        public.status_publicacao not null default 'publicado',
  atualizado_em timestamptz not null default now()
);

-- ---------- Eventos ----------
create table if not exists public.eventos (
  id            uuid primary key default gen_random_uuid(),
  titulo        text not null,
  descricao     text,
  inicio        timestamptz not null,
  fim           timestamptz,
  local         text,
  imagem_url    text,
  status        public.status_publicacao not null default 'rascunho',
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists idx_eventos_inicio on public.eventos (inicio);

-- ---------- Projetos ----------
create table if not exists public.projetos (
  id            uuid primary key default gen_random_uuid(),
  titulo        text not null,
  descricao     text,
  imagem_url    text,
  ordem         int not null default 0,
  status        public.status_publicacao not null default 'rascunho',
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- ---------- Mensagem do dia ----------
create table if not exists public.mensagens_do_dia (
  id            uuid primary key default gen_random_uuid(),
  data          date not null,
  texto         text not null,
  autor         text,
  status        public.status_publicacao not null default 'rascunho',
  criado_por    uuid references public.profiles(id) on delete set null,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create unique index if not exists idx_mensagem_data on public.mensagens_do_dia (data);

-- ---------- Estudo do Livro dos Mediuns ----------
-- Texto-semente deve vir de edicao em dominio publico.
create table if not exists public.questoes (
  id        uuid primary key default gen_random_uuid(),
  numero    int not null unique,
  parte     text,
  capitulo  text,
  pergunta  text not null,
  resposta  text not null,
  criado_em timestamptz not null default now()
);

create table if not exists public.pareceres (
  id            uuid primary key default gen_random_uuid(),
  questao_id    uuid not null references public.questoes(id) on delete cascade,
  autor_id      uuid references public.profiles(id) on delete set null,
  autor_nome    text,
  texto         text not null,
  status        public.status_publicacao not null default 'rascunho',
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists idx_pareceres_questao on public.pareceres (questao_id);

-- ---------- RLS ----------
alter table public.noticias         enable row level security;
alter table public.paginas          enable row level security;
alter table public.eventos          enable row level security;
alter table public.projetos         enable row level security;
alter table public.mensagens_do_dia enable row level security;
alter table public.questoes         enable row level security;
alter table public.pareceres        enable row level security;

do $$
declare t text;
begin
  foreach t in array array['noticias','paginas','eventos','projetos','mensagens_do_dia','pareceres']
  loop
    -- leitura publica APENAS do que esta publicado
    execute format('drop policy if exists %I on public.%I', t || '_leitura_publica', t);
    execute format($f$create policy %I on public.%I for select to anon, authenticated
                      using (status = 'publicado')$f$, t || '_leitura_publica', t);

    -- editores (diretoria e voluntarios) enxergam e gerenciam tudo, inclusive rascunhos
    execute format('drop policy if exists %I on public.%I', t || '_editor', t);
    execute format($f$create policy %I on public.%I for all to authenticated
                      using (public.meu_papel() in ('diretoria','voluntario'))
                      with check (public.meu_papel() in ('diretoria','voluntario'))$f$, t || '_editor', t);

    execute format('select public.aplicar_auditoria(%L)', t);
  end loop;
end $$;

drop policy if exists questoes_leitura on public.questoes;
create policy questoes_leitura on public.questoes for select to anon, authenticated using (true);

drop policy if exists questoes_editor on public.questoes;
create policy questoes_editor on public.questoes for all to authenticated
  using (public.meu_papel() in ('diretoria','voluntario'))
  with check (public.meu_papel() in ('diretoria','voluntario'));

select public.aplicar_auditoria('questoes');


-- >>>>>>>>>>>>>>>>>>>> supabase/migrations/0003_metricas.sql

-- ============================================================
-- 0003_metricas.sql  -- Contador de acessos e de visualizacoes
-- O anonimo NAO recebe insert nessas tabelas: a gravacao passa por
-- RPC SECURITY DEFINER. Contador em coluna incrementavel pelo cliente
-- seria manipulavel por qualquer visitante.
-- LGPD: guardamos hash de sessao, nunca o IP bruto.
-- ============================================================

create table if not exists public.acessos_site (
  id          bigint generated always as identity primary key,
  path        text not null,
  dia         date not null default current_date,
  sessao_hash text not null,
  referrer    text,
  criado_em   timestamptz not null default now()
);
create unique index if not exists idx_acesso_unico on public.acessos_site (dia, sessao_hash, path);
create index if not exists idx_acesso_dia on public.acessos_site (dia desc);

do $$ begin
  create type public.entidade_metrica as enum ('noticia', 'mensagem', 'pagina', 'evento', 'projeto');
exception when duplicate_object then null; end $$;

create table if not exists public.visualizacoes (
  id          bigint generated always as identity primary key,
  entidade    public.entidade_metrica not null,
  entidade_id text not null,
  dia         date not null default current_date,
  sessao_hash text not null,
  referrer    text,
  criado_em   timestamptz not null default now()
);
create unique index if not exists idx_view_unica on public.visualizacoes (dia, sessao_hash, entidade, entidade_id);
create index if not exists idx_view_entidade on public.visualizacoes (entidade, entidade_id);

-- ---------- RPCs de gravacao ----------
create or replace function public.registrar_acesso(p_path text, p_sessao_hash text, p_referrer text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_path is null or p_sessao_hash is null then return; end if;
  insert into public.acessos_site (path, sessao_hash, referrer)
  values (left(p_path, 300), left(p_sessao_hash, 64), left(p_referrer, 300))
  on conflict do nothing;
end $$;

create or replace function public.registrar_visualizacao(
  p_entidade public.entidade_metrica,
  p_entidade_id text,
  p_sessao_hash text,
  p_referrer text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_entidade_id is null or p_sessao_hash is null then return; end if;
  insert into public.visualizacoes (entidade, entidade_id, sessao_hash, referrer)
  values (p_entidade, left(p_entidade_id, 64), left(p_sessao_hash, 64), left(p_referrer, 300))
  on conflict do nothing;
end $$;

grant execute on function public.registrar_acesso(text, text, text) to anon, authenticated;
grant execute on function public.registrar_visualizacao(public.entidade_metrica, text, text, text) to anon, authenticated;

-- ---------- Views de leitura (security_invoker: aplica o RLS de quem consulta) ----------
create or replace view public.v_acessos_dia with (security_invoker = true) as
  select dia, count(*)::bigint as acessos, count(distinct sessao_hash)::bigint as visitantes
  from public.acessos_site group by dia order by dia desc;

create or replace view public.v_paginas_populares with (security_invoker = true) as
  select path, count(*)::bigint as acessos
  from public.acessos_site group by path order by acessos desc;

create or replace view public.v_visualizacoes_dia with (security_invoker = true) as
  select dia, entidade, count(*)::bigint as visualizacoes
  from public.visualizacoes group by dia, entidade order by dia desc;

create or replace view public.v_noticias_mais_vistas with (security_invoker = true) as
  select n.id, n.titulo, n.slug, count(v.id)::bigint as visualizacoes
  from public.noticias n
  left join public.visualizacoes v on v.entidade = 'noticia' and v.entidade_id = n.id::text
  group by n.id, n.titulo, n.slug
  order by visualizacoes desc;

-- ---------- RLS ----------
alter table public.acessos_site  enable row level security;
alter table public.visualizacoes enable row level security;

drop policy if exists acessos_select on public.acessos_site;
create policy acessos_select on public.acessos_site for select to authenticated
  using (public.eh_diretoria());

drop policy if exists views_select on public.visualizacoes;
create policy views_select on public.visualizacoes for select to authenticated
  using (public.eh_diretoria());

-- Sem policy de insert: so as RPCs SECURITY DEFINER gravam.
revoke insert, update, delete on public.acessos_site  from anon, authenticated;
revoke insert, update, delete on public.visualizacoes from anon, authenticated;


-- >>>>>>>>>>>>>>>>>>>> supabase/migrations/0004_anexos.sql

-- ============================================================
-- 0004_anexos.sql  -- Anexos em bucket PRIVADO, servidos por signed URL.
-- Notas fiscais e atas nunca podem ser publicas.
-- ============================================================

do $$ begin
  create type public.entidade_anexo as enum ('documento', 'ata', 'noticia', 'evento');
exception when duplicate_object then null; end $$;

create table if not exists public.anexos (
  id           uuid primary key default gen_random_uuid(),
  entidade     public.entidade_anexo not null,
  entidade_id  uuid not null,
  nome_arquivo text not null,
  mime         text not null,
  tamanho      bigint not null check (tamanho > 0 and tamanho <= 20971520), -- 20 MB
  storage_path text not null unique,
  enviado_por  uuid references public.profiles(id) on delete set null,
  criado_em    timestamptz not null default now(),
  constraint mime_permitido check (mime in (
    'application/pdf','image/jpeg','image/png','image/webp',
    'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ))
);
create index if not exists idx_anexos_entidade on public.anexos (entidade, entidade_id);

alter table public.anexos enable row level security;

-- Anexos de documentos e atas: apenas diretoria.
-- Anexos de noticia/evento acompanham conteudo publicado.
drop policy if exists anexos_select on public.anexos;
create policy anexos_select on public.anexos for select to authenticated
  using (
    public.eh_diretoria()
    or (entidade in ('noticia','evento') and public.meu_papel() in ('voluntario'))
  );

drop policy if exists anexos_escrita on public.anexos;
create policy anexos_escrita on public.anexos for all to authenticated
  using (public.eh_diretoria() or (entidade in ('noticia','evento') and public.meu_papel() = 'voluntario'))
  with check (public.eh_diretoria() or (entidade in ('noticia','evento') and public.meu_papel() = 'voluntario'));

select public.aplicar_auditoria('anexos');

-- ---------- Buckets ----------
insert into storage.buckets (id, name, public, file_size_limit)
values ('midia', 'midia', true, 10485760)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public, file_size_limit)
values ('anexos', 'anexos', false, 20971520)
on conflict (id) do update set public = false;

-- midia: leitura publica, escrita para editores
drop policy if exists midia_leitura on storage.objects;
create policy midia_leitura on storage.objects for select to anon, authenticated
  using (bucket_id = 'midia');

drop policy if exists midia_escrita on storage.objects;
create policy midia_escrita on storage.objects for all to authenticated
  using (bucket_id = 'midia' and public.meu_papel() in ('diretoria','voluntario'))
  with check (bucket_id = 'midia' and public.meu_papel() in ('diretoria','voluntario'));

-- anexos: privado. Sem policy para anon; signed URL e emitida no servidor.
drop policy if exists anexos_storage on storage.objects;
create policy anexos_storage on storage.objects for all to authenticated
  using (bucket_id = 'anexos' and public.eh_diretoria())
  with check (bucket_id = 'anexos' and public.eh_diretoria());


-- >>>>>>>>>>>>>>>>>>>> supabase/migrations/0005_atas.sql

-- ============================================================
-- 0005_atas.sql  -- Atas de reuniao
-- ============================================================

do $$ begin
  create type public.tipo_reuniao as enum ('ordinaria', 'extraordinaria', 'assembleia');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.status_ata as enum ('rascunho', 'aprovada');
exception when duplicate_object then null; end $$;

create table if not exists public.atas (
  id                  uuid primary key default gen_random_uuid(),
  numero              int not null,
  ano                 int not null,
  data_reuniao        date not null,
  tipo                public.tipo_reuniao not null default 'ordinaria',
  titulo              text not null,
  pauta               text,
  deliberacoes        text,
  participantes       text,
  status              public.status_ata not null default 'rascunho',
  visivel_voluntarios boolean not null default false,
  aprovada_por        uuid references public.profiles(id) on delete set null,
  aprovada_em         timestamptz,
  autor_id            uuid references public.profiles(id) on delete set null,
  criado_em           timestamptz not null default now(),
  atualizado_em       timestamptz not null default now(),
  unique (numero, ano)
);
create index if not exists idx_atas_data on public.atas (data_reuniao desc);

-- Sugere o proximo numero do ano.
create or replace function public.proximo_numero_ata(p_ano int)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(max(numero), 0) + 1 from public.atas where ano = p_ano;
$$;
grant execute on function public.proximo_numero_ata(int) to authenticated;

-- Ata aprovada e somente leitura: correcao vira nova versao, com historico em auditoria.
create or replace function public.fn_ata_imutavel()
returns trigger
language plpgsql
as $$
begin
  if old.status = 'aprovada' and public.meu_papel() is distinct from 'diretoria' then
    raise exception 'Ata aprovada nao pode ser alterada.';
  end if;
  if old.status = 'aprovada' and new.status = 'aprovada'
     and (new.pauta, new.deliberacoes, new.participantes, new.data_reuniao, new.numero)
         is distinct from (old.pauta, old.deliberacoes, old.participantes, old.data_reuniao, old.numero) then
    raise exception 'Ata aprovada e somente leitura. Reabra para rascunho antes de corrigir.';
  end if;
  return new;
end $$;

drop trigger if exists trg_ata_imutavel on public.atas;
create trigger trg_ata_imutavel before update on public.atas
  for each row execute function public.fn_ata_imutavel();

alter table public.atas enable row level security;

drop policy if exists atas_select on public.atas;
create policy atas_select on public.atas for select to authenticated
  using (public.eh_diretoria() or (visivel_voluntarios and public.meu_papel() = 'voluntario'));

drop policy if exists atas_escrita on public.atas;
create policy atas_escrita on public.atas for all to authenticated
  using (public.eh_diretoria()) with check (public.eh_diretoria());

select public.aplicar_auditoria('atas');


-- >>>>>>>>>>>>>>>>>>>> supabase/migrations/0006_financeiro.sql

-- ============================================================
-- 0006_financeiro.sql
-- Regra central: NAO existe coluna de saldo mutavel.
-- saldo = valor - SUM(baixas), exposto pela view v_titulos_saldo.
-- Baixas sao append-only; estorno e linha negativa, nunca edicao destrutiva.
-- ============================================================

-- ---------- Membros ----------
create table if not exists public.membros (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid references public.profiles(id) on delete set null,
  nome          text not null,
  email         text,
  telefone      text,
  data_ingresso date,
  categoria     text,
  ativo         boolean not null default true,
  observacoes   text,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists idx_membros_nome on public.membros (nome);

create table if not exists public.membro_mensalidade (
  membro_id      uuid primary key references public.membros(id) on delete cascade,
  valor          numeric(14,2) not null check (valor >= 0),
  dia_vencimento int not null default 10 check (dia_vencimento between 1 and 28),
  ativo          boolean not null default true,
  atualizado_em  timestamptz not null default now()
);

-- ---------- Documentos ----------
do $blk$ begin
  create type public.tipo_movimento as enum ('entrada', 'saida');
exception when duplicate_object then null; end $blk$;

do $blk$ begin
  create type public.condicao_pagamento as enum ('avista', 'prazo');
exception when duplicate_object then null; end $blk$;

-- entrada = compra (gera titulo a pagar); saida = venda/receita (gera titulo a receber)
create table if not exists public.documentos (
  id                 uuid primary key default gen_random_uuid(),
  tipo_movimento     public.tipo_movimento not null,
  data_emissao       date not null,
  numero             text not null,
  fornecedor_cliente text not null,
  descricao          text,
  valor_total        numeric(14,2) not null check (valor_total > 0),
  condicao           public.condicao_pagamento not null default 'avista',
  criado_por         uuid references public.profiles(id) on delete set null,
  criado_em          timestamptz not null default now(),
  atualizado_em      timestamptz not null default now(),
  unique (tipo_movimento, numero, fornecedor_cliente)
);
create index if not exists idx_doc_emissao on public.documentos (data_emissao desc);

create table if not exists public.documento_itens (
  id                uuid primary key default gen_random_uuid(),
  documento_id      uuid not null references public.documentos(id) on delete cascade,
  descricao_produto text not null,
  quantidade        numeric(14,3) not null default 1 check (quantidade > 0),
  valor_unitario    numeric(14,2) not null check (valor_unitario >= 0),
  valor_total       numeric(14,2) generated always as (round(quantidade * valor_unitario, 2)) stored
);
create index if not exists idx_item_doc on public.documento_itens (documento_id);

-- ---------- Titulos (duplicatas) ----------
do $blk$ begin
  create type public.tipo_titulo as enum ('pagar', 'receber');
exception when duplicate_object then null; end $blk$;

create table if not exists public.titulos (
  id             uuid primary key default gen_random_uuid(),
  tipo           public.tipo_titulo not null,
  documento_id   uuid references public.documentos(id) on delete cascade,
  membro_id      uuid references public.membros(id) on delete set null,
  competencia    date,                     -- 1o dia do mes de referencia (mensalidades)
  descricao      text not null,
  parcela        int not null default 1,
  total_parcelas int not null default 1,
  vencimento     date not null,
  valor          numeric(14,2) not null check (valor > 0),
  cancelado      boolean not null default false,
  criado_em      timestamptz not null default now()
);
create index if not exists idx_titulo_venc on public.titulos (tipo, vencimento);
-- Idempotencia do lote mensal: reexecutar nao duplica.
create unique index if not exists idx_mensalidade_unica
  on public.titulos (membro_id, competencia) where competencia is not null;
create unique index if not exists idx_parcela_unica
  on public.titulos (documento_id, parcela) where documento_id is not null;

create table if not exists public.baixas (
  id             uuid primary key default gen_random_uuid(),
  titulo_id      uuid not null references public.titulos(id) on delete cascade,
  data           date not null default current_date,
  valor          numeric(14,2) not null check (valor <> 0),  -- negativo = estorno
  forma          text not null default 'dinheiro',
  observacao     text,
  registrado_por uuid references public.profiles(id) on delete set null,
  criado_em      timestamptz not null default now()
);
create index if not exists idx_baixa_titulo on public.baixas (titulo_id);

-- Append-only: correcao e novo lancamento (estorno), nao edicao.
create or replace function public.fn_baixa_append_only()
returns trigger language plpgsql as $fn$
begin
  raise exception 'Baixas sao append-only. Para corrigir, lance um estorno (valor negativo).';
end $fn$;

drop trigger if exists trg_baixa_append_only on public.baixas;
create trigger trg_baixa_append_only before update or delete on public.baixas
  for each row execute function public.fn_baixa_append_only();

-- Nao permite baixar mais do que o saldo devedor.
create or replace function public.fn_valida_baixa()
returns trigger language plpgsql as $fn$
declare v_valor numeric(14,2); v_pago numeric(14,2);
begin
  select t.valor into v_valor from public.titulos t where t.id = new.titulo_id;
  select coalesce(sum(b.valor), 0) into v_pago from public.baixas b where b.titulo_id = new.titulo_id;
  if v_pago + new.valor > v_valor + 0.005 then
    raise exception 'Baixa de % excede o saldo devedor do titulo (valor %, ja baixado %).',
      new.valor, v_valor, v_pago;
  end if;
  return new;
end $fn$;

drop trigger if exists trg_valida_baixa on public.baixas;
create trigger trg_valida_baixa before insert on public.baixas
  for each row execute function public.fn_valida_baixa();

-- ---------- Saldo e status derivados (nunca armazenados) ----------
create or replace view public.v_titulos_saldo with (security_invoker = true) as
select
  t.id, t.tipo, t.documento_id, t.membro_id, t.competencia, t.descricao,
  t.parcela, t.total_parcelas, t.vencimento, t.valor, t.cancelado, t.criado_em,
  coalesce(b.pago, 0)           as valor_pago,
  t.valor - coalesce(b.pago, 0) as saldo,
  case
    when t.cancelado                                             then 'cancelado'
    when coalesce(b.pago, 0) >= t.valor                          then 'pago'
    when t.vencimento < current_date                             then 'vencido'
    when coalesce(b.pago, 0) > 0                                 then 'parcial'
    else 'aberto'
  end                           as status,
  d.fornecedor_cliente,
  d.numero as documento_numero,
  m.nome   as membro_nome
from public.titulos t
left join (
  select titulo_id, sum(valor) as pago from public.baixas group by titulo_id
) b on b.titulo_id = t.id
left join public.documentos d on d.id = t.documento_id
left join public.membros m    on m.id = t.membro_id;

-- ---------- Lancamento de documento com geracao das duplicatas ----------
-- Cabecalho + itens + titulos numa unica transacao: nunca existe nota sem duplicata.
create or replace function public.lancar_documento(
  p_tipo_movimento public.tipo_movimento,
  p_data_emissao   date,
  p_numero         text,
  p_fornecedor     text,
  p_descricao      text,
  p_condicao       public.condicao_pagamento,
  p_itens          jsonb,        -- [{descricao_produto, quantidade, valor_unitario}]
  p_parcelas       jsonb         -- [{vencimento, valor}]
) returns uuid
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_doc_id uuid;
  v_total  numeric(14,2) := 0;
  v_soma   numeric(14,2) := 0;
  v_tipo   public.tipo_titulo;
  v_qtd    int;
  v_item   jsonb;
  v_parc   jsonb;
  v_i      int := 0;
begin
  if not public.eh_diretoria() then
    raise exception 'Apenas a diretoria pode lancar documentos.';
  end if;

  select coalesce(sum((i->>'quantidade')::numeric * (i->>'valor_unitario')::numeric), 0)
    into v_total from jsonb_array_elements(p_itens) i;
  if v_total <= 0 then
    raise exception 'Documento precisa de ao menos um item com valor.';
  end if;

  select coalesce(sum((p->>'valor')::numeric), 0), count(*)
    into v_soma, v_qtd from jsonb_array_elements(p_parcelas) p;
  if abs(v_soma - v_total) > 0.01 then
    raise exception 'Soma das parcelas (%) difere do total do documento (%).', v_soma, v_total;
  end if;

  v_tipo := case when p_tipo_movimento = 'entrada' then 'pagar' else 'receber' end;

  insert into public.documentos (tipo_movimento, data_emissao, numero, fornecedor_cliente,
                                 descricao, valor_total, condicao, criado_por)
  values (p_tipo_movimento, p_data_emissao, p_numero, p_fornecedor,
          p_descricao, round(v_total, 2), p_condicao, auth.uid())
  returning id into v_doc_id;

  for v_item in select * from jsonb_array_elements(p_itens) loop
    insert into public.documento_itens (documento_id, descricao_produto, quantidade, valor_unitario)
    values (v_doc_id, v_item->>'descricao_produto',
            (v_item->>'quantidade')::numeric, (v_item->>'valor_unitario')::numeric);
  end loop;

  for v_parc in select * from jsonb_array_elements(p_parcelas) loop
    v_i := v_i + 1;
    insert into public.titulos (tipo, documento_id, descricao, parcela, total_parcelas, vencimento, valor)
    values (v_tipo, v_doc_id,
            coalesce(nullif(p_descricao, ''), p_fornecedor) || ' - doc ' || p_numero,
            v_i, v_qtd, (v_parc->>'vencimento')::date, (v_parc->>'valor')::numeric);
  end loop;

  return v_doc_id;
end $fn$;

grant execute on function public.lancar_documento(public.tipo_movimento, date, text, text, text,
  public.condicao_pagamento, jsonb, jsonb) to authenticated;

-- ---------- Geracao idempotente das mensalidades ----------
create or replace function public.gerar_mensalidades(p_competencia date)
returns int
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_criados int;
  v_comp date := date_trunc('month', p_competencia)::date;
begin
  if not public.eh_diretoria() then
    raise exception 'Apenas a diretoria pode gerar mensalidades.';
  end if;

  insert into public.titulos (tipo, membro_id, competencia, descricao, vencimento, valor)
  select 'receber', m.id, v_comp,
         'Mensalidade ' || to_char(v_comp, 'MM/YYYY'),
         (v_comp + make_interval(days => mm.dia_vencimento - 1))::date,
         mm.valor
  from public.membros m
  join public.membro_mensalidade mm on mm.membro_id = m.id
  where m.ativo and mm.ativo and mm.valor > 0
  on conflict do nothing;

  get diagnostics v_criados = row_count;
  return v_criados;
end $fn$;

grant execute on function public.gerar_mensalidades(date) to authenticated;

-- ---------- RLS ----------
alter table public.membros            enable row level security;
alter table public.membro_mensalidade enable row level security;
alter table public.documentos         enable row level security;
alter table public.documento_itens    enable row level security;
alter table public.titulos            enable row level security;
alter table public.baixas             enable row level security;

do $blk$
declare t text;
begin
  foreach t in array array['membros','membro_mensalidade','documentos','documento_itens','titulos','baixas']
  loop
    execute format('drop policy if exists %I on public.%I', t || '_diretoria', t);
    execute format('create policy %I on public.%I for all to authenticated
                      using (public.eh_diretoria()) with check (public.eh_diretoria())',
                   t || '_diretoria', t);
    execute format('select public.aplicar_auditoria(%L)', t);
  end loop;
end $blk$;

-- Membro enxerga apenas os proprios titulos a receber.
drop policy if exists titulos_proprio on public.titulos;
create policy titulos_proprio on public.titulos for select to authenticated
  using (
    tipo = 'receber'
    and membro_id in (select id from public.membros where profile_id = auth.uid())
  );

