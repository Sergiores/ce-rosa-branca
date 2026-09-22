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
-- O passo 5 (trigger de criação de perfil) NÃO está escrito aqui de
-- propósito. Leia o porquê no fim do arquivo antes de mexer nele.


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
-- PASSO 5 — Trigger de criação de perfil: NÃO ESTÁ AQUI, e é de propósito
-- ---------------------------------------------------------------------
-- Falta o ajuste para a conta nascer `visitante` quando vier do cadastro
-- público, em vez de `membro`.
--
-- Não escrevi este passo às cegas porque a função vive em auth.users, que é
-- COMPARTILHADO com a loja em produção. Um `create or replace` com corpo
-- adivinhado sobrescreve o que estiver lá hoje — e uma falha dentro de um
-- trigger `after insert` em auth.users aborta, em silêncio, todo cadastro
-- novo da loja. Já existe registro desse acidente neste banco.
--
-- O caminho seguro: pegue o corpo real na saída do passo 0.3 e edite
-- a partir dele. A regra a acrescentar:
--
--   * continuar só agindo quando o metadata trouxer projeto = 'rosabranca';
--   * ler um segundo campo do metadata (ex.: origem = 'cadastro-publico')
--     e, nesse caso, criar o perfil com role 'visitante';
--   * fora disso, seguir criando como 'membro', como já faz.
--
-- E o de sempre: o papel NUNCA pode vir cru do metadata. Foi exatamente
-- assim que apareceu o furo que permitia alguém se cadastrar como
-- 'diretoria'.
--
-- Enquanto o passo 5 não for feito, os passos 1 a 4 já funcionam: quem é
-- convidado pela diretoria consegue favoritar e marcar leitura. Só o
-- cadastro público é que ainda não existe.


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
