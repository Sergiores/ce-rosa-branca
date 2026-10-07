-- =====================================================================
-- Favoritos da gestão — atalhos por usuário para as telas que ele mais usa
-- Schema: rosabranca            Banco compartilhado com a loja em produção
-- Escrito em 06/10/2026 para aplicação manual no SQL Editor
-- =====================================================================
--
-- Um passo só, aditivo. Uma tabela nova, nada alterado.
-- Nenhuma linha toca `public`, `auth` ou `storage`.
--
-- Por que no banco e não no navegador: favorito guardado em localStorage
-- vive num aparelho só. Quem marca no computador da secretaria não encontra
-- nada ao abrir no celular, e perde tudo ao limpar o navegador. É o mesmo
-- motivo de `questao_favorita` ter ido para o banco.


-- ---------------------------------------------------------------------
-- PASSO 0 — Conferência. Só lê.
-- ---------------------------------------------------------------------

-- A policy usa auth.uid() direto, então não precisa de função auxiliar.
-- Só confirma que profiles existe para a chave estrangeira.
select table_name from information_schema.tables
 where table_schema = 'rosabranca' and table_name = 'profiles';


-- ---------------------------------------------------------------------
-- PASSO 1 — Tabela
-- ---------------------------------------------------------------------
-- Guarda o CAMINHO, não a tela do enum de permissões. Assim dá para
-- favoritar tanto "Área de estudos" quanto "Alunos e históricos", que é
-- uma tela de dentro dela e não tem chave própria em `permissoes`.
--
-- O rótulo vem gravado junto porque quem lê o favorito é o menu, e ele não
-- deve ter que adivinhar o nome de uma tela a partir da URL.

create table if not exists rosabranca.gestao_favoritos (
  user_id   uuid not null references rosabranca.profiles(id) on delete cascade,
  href      text not null check (href like '/gestao%'),
  rotulo    text not null,
  criado_em timestamptz not null default now(),
  primary key (user_id, href)
);

-- O menu lista por ordem de marcação, mais antigo primeiro.
create index if not exists ix_gestao_favoritos_usuario
  on rosabranca.gestao_favoritos (user_id, criado_em);

comment on table rosabranca.gestao_favoritos is
  'Atalhos do menu da gestao, por usuario. Conveniencia de navegacao: nao
   concede acesso a nada. Quem decide o que a pessoa ve continua sendo
   `permissoes` na interface e o RLS de cada tabela nos dados.';


-- ---------------------------------------------------------------------
-- PASSO 2 — RLS e grants
-- ---------------------------------------------------------------------
-- Escopo de PESSOA, como questao_favorita: ninguém lê nem apaga o atalho
-- de outro. `anon` não entra — isto é área restrita.
--
-- IMPORTANTE: favoritar não dá acesso. Se alguém favoritar uma tela e
-- depois perder a permissão dela, o atalho continua na lista mas a tela
-- barra na entrada, como qualquer outro caminho digitado à mão.

alter table rosabranca.gestao_favoritos enable row level security;

drop policy if exists gestao_favoritos_proprio on rosabranca.gestao_favoritos;
create policy gestao_favoritos_proprio on rosabranca.gestao_favoritos
  for all to authenticated
  using      (user_id = auth.uid())
  with check (user_id = auth.uid());

-- RLS sozinho não basta: sem grant a API falha antes de chegar na policy.
grant select, insert, delete on rosabranca.gestao_favoritos to authenticated;

-- Sem auditoria de propósito. Marcar e desmarcar atalho é preferência de
-- navegação, não ato que a casa precise defender depois — auditar isso só
-- encheria o log. Mesmo critério que deixou `questao_leitura` de fora.

-- Confere: RLS ligado e uma policy.
select c.relname as tabela, c.relrowsecurity as rls_ligado, count(p.polname) as policies
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  left join pg_policy p on p.polrelid = c.oid
 where n.nspname = 'rosabranca' and c.relname = 'gestao_favoritos'
 group by c.relname, c.relrowsecurity;


-- ---------------------------------------------------------------------
-- Final — avisar a API da tabela nova
-- ---------------------------------------------------------------------
notify pgrst, 'reload schema';


-- ---------------------------------------------------------------------
-- Desfazer
-- ---------------------------------------------------------------------
--   drop table if exists rosabranca.gestao_favoritos;
