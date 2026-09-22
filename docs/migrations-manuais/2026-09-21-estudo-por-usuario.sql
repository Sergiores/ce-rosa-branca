-- =====================================================================
-- Estudo por usuário — ordem de publicação, leitura, favoritos, visitante
-- Schema: rosabranca            Banco compartilhado com a loja em produção
-- Escrito em 21/09/2026 para aplicação manual no SQL Editor
-- =====================================================================
--
-- COMO RODAR: um passo de cada vez, conferindo o resultado antes do
-- seguinte. Os passos 3 e 4 PRECISAM ser execuções separadas — o valor
-- novo do enum só pode ser usado depois que a transação dele fechar.
--
-- Tudo aqui é aditivo: cria coluna, cria tabela, acrescenta valor de enum.
-- Nada altera nem apaga objeto existente. Nenhuma linha toca `public`,
-- `auth` ou `storage`, que são da loja ou compartilhados.
--
-- Passos 0 a 4 já foram aplicados em 21/09/2026 (confirmado por consulta).
-- O passo 5 foi escrito depois, em cima do corpo real de
-- rosabranca.fn_novo_usuario obtido pelo passo 0.3 — não é mais um
-- placeholder. Ainda falta rodá-lo.


-- ---------------------------------------------------------------------
-- PASSO 0 — Conferência. Só lê, não muda nada.
-- ---------------------------------------------------------------------
-- Rode e confira as três saídas antes de continuar.

-- 0.1 Nome do tipo enum usado em profiles.role (esperado: rosabranca.papel_usuario)
select a.atttypid::regtype as tipo_do_papel,
       (select string_agg(e.enumlabel, ', ' order by e.enumsortorder)
          from pg_enum e where e.enumtypid = a.atttypid) as valores_hoje
  from pg_attribute a
 where a.attrelid = 'rosabranca.profiles'::regclass
   and a.attname  = 'role';

-- 0.2 Colunas de questoes (confirmar que publicado_em ainda NÃO existe)
select column_name, data_type
  from information_schema.columns
 where table_schema = 'rosabranca' and table_name = 'questoes'
 order by ordinal_position;

-- 0.3 Corpo atual da função que cria o perfil a partir de auth.users.
--     Guarde esta saída: é o ponto mais sensível do banco compartilhado.
select n.nspname as schema, p.proname as funcao, pg_get_functiondef(p.oid) as corpo
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where p.proname ilike '%novo_usuario%'
    or p.proname ilike '%new_user%';


-- ---------------------------------------------------------------------
-- PASSO 1 — Ordem de publicação
-- ---------------------------------------------------------------------
-- Por quê: criado_em marca o seed das 1.019 questões e é IGUAL para todas
-- (as duas publicadas têm 2026-09-05T20:18:54.005391Z). Ordenar por ela dá
-- ordem arbitrária.

alter table rosabranca.questoes
  add column if not exists publicado_em timestamptz;

comment on column rosabranca.questoes.publicado_em is
  'Quando a questao passou a publicada. Diferente de criado_em, que marca o seed inicial das 1.019 questoes e e igual para todas.';

-- Backfill: sem isto as já publicadas ficam NULL e caem em lugar
-- imprevisível na ordenação.
update rosabranca.questoes
   set publicado_em = criado_em
 where status = 'publicado'
   and publicado_em is null;

-- Confere: deve listar as publicadas, todas com data.
select numero, status, publicado_em
  from rosabranca.questoes
 where status = 'publicado'
 order by publicado_em desc, numero;


-- ---------------------------------------------------------------------
-- PASSO 2 — Leitura e favoritos por usuário
-- ---------------------------------------------------------------------
-- Primeiras tabelas do projeto com escopo de PESSOA, não de papel.
-- A policy de auth.uid() é o modelo de segurança inteiro delas: sem ela,
-- um usuário lê os favoritos do outro.

create table if not exists rosabranca.questao_leitura (
  user_id    uuid not null references rosabranca.profiles(id) on delete cascade,
  questao_id uuid not null references rosabranca.questoes(id) on delete cascade,
  lido_em    timestamptz not null default now(),
  primary key (user_id, questao_id)
);

create table if not exists rosabranca.questao_favorita (
  user_id    uuid not null references rosabranca.profiles(id) on delete cascade,
  questao_id uuid not null references rosabranca.questoes(id) on delete cascade,
  criado_em  timestamptz not null default now(),
  primary key (user_id, questao_id)
);

create index if not exists ix_questao_favorita_usuario
  on rosabranca.questao_favorita (user_id, criado_em desc);

alter table rosabranca.questao_leitura  enable row level security;
alter table rosabranca.questao_favorita enable row level security;

drop policy if exists leitura_propria on rosabranca.questao_leitura;
create policy leitura_propria on rosabranca.questao_leitura
  for all to authenticated
  using      (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists favorita_propria on rosabranca.questao_favorita;
create policy favorita_propria on rosabranca.questao_favorita
  for all to authenticated
  using      (user_id = auth.uid())
  with check (user_id = auth.uid());

-- RLS sozinho não basta: sem grant a API falha antes de chegar na policy.
-- `anon` fica de fora de propósito — quem não está logado não marca nada.
grant select, insert, delete on rosabranca.questao_leitura  to authenticated;
grant select, insert, delete on rosabranca.questao_favorita to authenticated;

-- Auditoria genérica, como manda a convenção do projeto.
-- questao_leitura fica de fora: seria uma linha de auditoria por questão
-- aberta por pessoa, e o log não ganha nada com isso.
select rosabranca.aplicar_auditoria('questao_favorita');

-- Confere: as duas tabelas com rls_ligado = true.
select tablename, rowsecurity as rls_ligado
  from pg_tables
 where schemaname = 'rosabranca'
   and tablename in ('questao_leitura', 'questao_favorita');


-- ---------------------------------------------------------------------
-- PASSO 3 — Papel `visitante`  (RODAR SOZINHO)
-- ---------------------------------------------------------------------
-- Execute apenas este bloco e só depois siga para o passo 4. O Postgres
-- não deixa usar um valor de enum na mesma transação em que ele nasce.
-- O bloco descobre o nome do tipo sozinho, em vez de confiar num chute.

do $$
declare
  v_tipo regtype;
begin
  select a.atttypid::regtype into v_tipo
    from pg_attribute a
   where a.attrelid = 'rosabranca.profiles'::regclass
     and a.attname  = 'role';

  if v_tipo is null then
    raise exception 'Nao encontrei a coluna role em rosabranca.profiles';
  end if;

  execute format('alter type %s add value if not exists %L', v_tipo, 'visitante');
end $$;

-- Confere: 'visitante' deve aparecer na lista.
select a.atttypid::regtype as tipo,
       (select string_agg(e.enumlabel, ', ' order by e.enumsortorder)
          from pg_enum e where e.enumtypid = a.atttypid) as valores
  from pg_attribute a
 where a.attrelid = 'rosabranca.profiles'::regclass and a.attname = 'role';


-- ---------------------------------------------------------------------
-- PASSO 4 — Permissões do visitante  (só depois do passo 3 terminar)
-- ---------------------------------------------------------------------
-- Nenhuma tela de gestão. As linhas entram com ver/editar em false para
-- ficar explícito no painel de permissões que ele não vê nada.

-- Sem cast explícito de propósito: o literal sem tipo é convertido para o
-- enum da coluna, seja qual for o nome dele.
insert into rosabranca.permissoes (role, tela_key, ver, editar)
select 'visitante', t.tela_key, false, false
  from (select distinct tela_key from rosabranca.permissoes) t
on conflict (role, tela_key) do nothing;

-- Confere: tudo false.
select tela_key, ver, editar
  from rosabranca.permissoes
 where role::text = 'visitante'
 order by tela_key;


-- ---------------------------------------------------------------------
-- PASSO 5 — Trigger de criação de perfil: agora com o corpo real
-- ---------------------------------------------------------------------
-- Corpo confirmado em 21/09/2026 via passo 0.3. Existem DOIS triggers em
-- auth.users, um para cada app deste banco:
--
--   public.handle_new_user      -> da LOJA, cria em public.profiles com
--                                   role 'lojista'. NÃO TOCAR.
--   rosabranca.fn_novo_usuario   -> o nosso. É este que muda abaixo.
--
-- A mudança é mínima e preserva tudo que já existia: mesmo portão
-- (só age com projeto = 'rosabranca'), mesmo on conflict do nothing,
-- mesma assinatura, security definer e search_path. A única diferença é
-- que o role deixa de ser sempre 'membro' e passa a depender de um
-- segundo campo do metadata.
--
-- O papel continua nunca vindo cru do metadata: só dois valores são
-- possíveis, decididos aqui dentro, nunca lidos direto do que o usuário
-- mandou.

create or replace function rosabranca.fn_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path to 'rosabranca'
as $function$
declare
  v_role rosabranca.papel_usuario;
begin
  -- auth.users e compartilhado entre os projetos deste banco.
  -- Sem este portao, todo usuario do app principal ganharia um perfil aqui.
  -- O convite (acoes-usuarios.ts) precisa enviar projeto: 'rosabranca' no metadata.
  if coalesce(new.raw_user_meta_data->>'projeto', '') <> 'rosabranca' then
    return new;
  end if;

  -- O papel nunca vem cru do metadata do proprio usuario. Só dois casos
  -- são possíveis aqui: convite (nasce membro, e a promoção para o papel
  -- final acontece depois, no servidor, via acoes-usuarios.ts) ou
  -- cadastro público marcado com origem = 'cadastro-publico' (nasce
  -- visitante, sem nenhuma tela de gestão).
  if coalesce(new.raw_user_meta_data->>'origem', '') = 'cadastro-publico' then
    v_role := 'visitante';
  else
    v_role := 'membro';
  end if;

  insert into rosabranca.profiles (id, nome, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', ''),
    new.email,
    v_role
  )
  on conflict (id) do nothing;
  return new;
end $function$;

-- Confere: a troca não deve ter mudado o trigger que dispara a função,
-- só o corpo dela.
select tgname as trigger, tgrelid::regclass as tabela, p.proname as funcao
  from pg_trigger t
  join pg_proc p on p.oid = t.tgfoid
 where p.proname = 'fn_novo_usuario';

-- Teste manual sugerido (fora deste script): convidar um usuário de teste
-- pela tela /gestao/usuarios (nasce 'membro', como sempre) e, quando o
-- cadastro público existir no app, criar uma conta por ele (deve nascer
-- 'visitante'). Nenhum dos dois deve tocar em public.profiles.

-- ---------------------------------------------------------------------
-- Final — avisar a API das tabelas novas
-- ---------------------------------------------------------------------
notify pgrst, 'reload schema';


-- ---------------------------------------------------------------------
-- Desfazer (se precisar voltar atrás)
-- ---------------------------------------------------------------------
-- Passos 1 e 2 são reversíveis:
--
--   drop table if exists rosabranca.questao_favorita;
--   drop table if exists rosabranca.questao_leitura;
--   alter table rosabranca.questoes drop column if exists publicado_em;
--
-- O passo 3 NÃO é: o Postgres não remove valor de enum. Se `visitante`
-- não for usado, ele fica ali sem efeito nenhum.
