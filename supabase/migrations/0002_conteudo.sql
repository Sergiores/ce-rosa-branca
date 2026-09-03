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
