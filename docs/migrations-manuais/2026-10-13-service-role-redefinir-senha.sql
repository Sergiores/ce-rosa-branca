-- =====================================================================
-- Permissão mínima da service role para a redefinição de senha
-- Schema: rosabranca            Banco compartilhado com a loja em produção
-- Escrito em 13/10/2026 para aplicação manual no SQL Editor
-- =====================================================================
--
-- O SINTOMA: a tela "Redefinir senha" respondeu "Esta conta não pertence a
-- este sistema", mesmo para um usuário que existe.
--
-- A CAUSA, conferida com uma leitura direta:
--
--   profiles   status 403 | 42501 — permission denied for schema rosabranca
--   auditoria  status 403 | 42501 — permission denied for schema rosabranca
--
-- A service role passa por cima do RLS, mas ainda precisa de permissão para
-- entrar no schema e tocar nas tabelas. Na consolidação, o `rosabranca` foi
-- liberado para `anon` e `authenticated`, não para ela. O convite nunca
-- esbarrou nisso porque usa a API de autenticação, não as tabelas.
--
-- O QUE ESTE ARQUIVO FAZ: dá à service role exatamente o que a redefinição
-- de senha usa, e nada além:
--
--   - entrar no schema rosabranca
--   - LER profiles (conferir que o alvo é conta deste sistema)
--   - INSERIR em auditoria (registrar a troca antes de fazê-la)
--
-- POR QUE NÃO "grant all": a service role já alcança tudo da loja. Liberar
-- o rosabranca inteiro para ela aumentaria o estrago de um vazamento da
-- chave sem nenhum ganho para esta funcionalidade. Ela não recebe update
-- nem delete em lugar nenhum, nem leitura de outras tabelas.
--
-- Não cria nem altera tabela, coluna, função, trigger ou policy. Não toca
-- `public`, `auth` ou `storage`.


-- ---------------------------------------------------------------------
-- PASSO 0 — Conferência. Só lê.
-- ---------------------------------------------------------------------
-- Hoje a service role não deve aparecer com usage no schema.

select has_schema_privilege('service_role', 'rosabranca', 'usage') as service_role_entra_no_schema;


-- ---------------------------------------------------------------------
-- PASSO 1 — As três permissões
-- ---------------------------------------------------------------------

grant usage  on schema rosabranca           to service_role;
grant select on rosabranca.profiles         to service_role;
grant insert on rosabranca.auditoria        to service_role;

-- A coluna id de auditoria é identity: o insert não exige permissão
-- separada na sequência.


-- ---------------------------------------------------------------------
-- Conferência
-- ---------------------------------------------------------------------
-- Esperado: true, true, true — e false, false nas duas últimas colunas,
-- que confirmam que ela NÃO ganhou nada além disso.

select
  has_schema_privilege('service_role', 'rosabranca', 'usage')                 as entra_no_schema,
  has_table_privilege('service_role', 'rosabranca.profiles', 'select')       as le_profiles,
  has_table_privilege('service_role', 'rosabranca.auditoria', 'insert')      as grava_auditoria,
  has_table_privilege('service_role', 'rosabranca.profiles', 'update')       as altera_profiles_nao_deve,
  has_table_privilege('service_role', 'rosabranca.membros', 'select')        as le_membros_nao_deve;


-- ---------------------------------------------------------------------
-- Desfazer
-- ---------------------------------------------------------------------
-- A tela de redefinir senha volta a falhar com segurança (sem trocar nada).
--
--   revoke insert on rosabranca.auditoria from service_role;
--   revoke select on rosabranca.profiles  from service_role;
--   revoke usage  on schema rosabranca    from service_role;
