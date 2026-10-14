-- =====================================================================
-- Permissões por usuário — exceções sobre o papel
-- Schema: rosabranca            Banco compartilhado com a loja em produção
-- Escrito em 13/10/2026 para aplicação manual no SQL Editor
-- =====================================================================
--
-- Hoje a permissão é por PAPEL: `permissoes(role, tela_key, ver, editar)`.
-- Todo mundo da diretoria enxerga as mesmas telas, sem exceção possível.
--
-- Esta tabela guarda só as DIFERENÇAS. Quem não tem linha aqui continua
-- seguindo o papel, exatamente como hoje. Então nada muda para os usuários
-- que já existem — a tabela nasce vazia e o comportamento é o de sempre.
--
-- Aditivo. Nada alterado, nada apagado. Não toca `public`, `auth` ou
-- `storage`.
--
-- ATENÇÃO, e isto é importante para a expectativa:
-- isto é INTERFACE, não é fronteira de segurança. Esconde item de menu e
-- barra a entrada na tela. Quem protege cada linha no banco continua sendo
-- a policy de cada tabela, e ela é por PAPEL. Tirar "Contas a pagar" de um
-- diretor pela tela não o impede de alcançar o dado pela API com a chave
-- anônima, porque para o Postgres ele continua sendo diretoria. Se a
-- intenção for impedir de verdade, as policies precisam mudar também — e
-- isso sai de D:\Projetos\BancodeDados.


-- ---------------------------------------------------------------------
-- PASSO 0 — Conferência. Só lê.
-- ---------------------------------------------------------------------

-- A matriz por papel que serve de base, e as telas que ela conhece.
select role::text, count(*) as telas,
       count(*) filter (where ver) as com_acesso
  from rosabranca.permissoes
 group by role::text
 order by role::text;

-- As funções que as policies vão usar.
select p.proname
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'rosabranca' and p.proname in ('eh_diretoria', 'meu_papel')
 order by p.proname;


-- ---------------------------------------------------------------------
-- PASSO 1 — Tabela de exceções
-- ---------------------------------------------------------------------
-- `tela_key` é texto solto de propósito, igual em `permissoes`: as telas
-- são definidas no código (TelaKey), não no banco. Assim acrescentar uma
-- tela nova no app não exige migration.

create table if not exists rosabranca.permissoes_usuario (
  user_id       uuid not null references rosabranca.profiles(id) on delete cascade,
  tela_key      text not null,
  ver           boolean not null default false,
  editar        boolean not null default false,
  definido_por  uuid references rosabranca.profiles(id) on delete set null,
  atualizado_em timestamptz not null default now(),
  primary key (user_id, tela_key)
);

comment on table rosabranca.permissoes_usuario is
  'Excecoes de permissao de TELA por pessoa, sobre a base do papel em
   `permissoes`. Ausencia de linha = segue o papel. Dirige a interface e
   nada mais: a protecao dos dados e o RLS de cada tabela, que e por papel.';


-- ---------------------------------------------------------------------
-- PASSO 2 — RLS e grants
-- ---------------------------------------------------------------------
-- Duas necessidades diferentes:
--   1. a pessoa precisa LER as proprias excecoes, senao o menu dela nao
--      monta (obterSessao roda como ela mesma);
--   2. so a diretoria ESCREVE, senao qualquer um se promoveria sozinho.
--
-- E o mesmo desenho que `profiles` ja usa:
--   profiles_select: using (id = auth.uid() or eh_diretoria())
--   profiles_admin:  for all using (eh_diretoria())

alter table rosabranca.permissoes_usuario enable row level security;

drop policy if exists permissoes_usuario_leitura on rosabranca.permissoes_usuario;
create policy permissoes_usuario_leitura on rosabranca.permissoes_usuario
  for select to authenticated
  using (user_id = auth.uid() or rosabranca.eh_diretoria());

drop policy if exists permissoes_usuario_admin on rosabranca.permissoes_usuario;
create policy permissoes_usuario_admin on rosabranca.permissoes_usuario
  for all to authenticated
  using      (rosabranca.eh_diretoria())
  with check (rosabranca.eh_diretoria());

grant select, insert, update, delete on rosabranca.permissoes_usuario to authenticated;

-- Auditoria entra: "quem liberou o financeiro para fulano, e quando" é
-- exatamente o tipo de pergunta que a casa pode precisar responder.
select rosabranca.aplicar_auditoria('permissoes_usuario');


-- Confere: RLS ligado, duas policies, trigger de auditoria.
select c.relname as tabela,
       c.relrowsecurity as rls_ligado,
       (select count(*) from pg_policy p where p.polrelid = c.oid) as policies,
       (select count(*) from pg_trigger t
         where t.tgrelid = c.oid and t.tgname = 'trg_auditoria') as auditoria
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'rosabranca' and c.relname = 'permissoes_usuario';


-- ---------------------------------------------------------------------
-- Final — avisar a API da tabela nova
-- ---------------------------------------------------------------------
notify pgrst, 'reload schema';


-- ---------------------------------------------------------------------
-- Desfazer
-- ---------------------------------------------------------------------
-- Seguro a qualquer momento: sem linhas aqui, todo mundo volta a seguir o
-- papel, que é o comportamento de hoje.
--
--   drop table if exists rosabranca.permissoes_usuario;
