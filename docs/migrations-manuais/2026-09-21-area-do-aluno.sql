-- =====================================================================
-- Área do aluno — leitura própria, vínculo de conta e frequência
-- Schema: rosabranca            Banco compartilhado com a loja em produção
-- Escrito em 21/09/2026 para aplicação manual no SQL Editor
-- =====================================================================
--
-- Complementa 2026-09-21-area-de-estudos.sql, que precisa já estar aplicado.
--
-- Hoje as tabelas de estudo têm UMA policy cada: diretoria e voluntário.
-- Um aluno logado não enxerga nada. Este arquivo acrescenta as policies de
-- LEITURA do próprio aluno — nenhuma de escrita: aluno não marca a própria
-- presença nem edita aula.
--
-- Tudo é aditivo. Nada altera nem apaga o que já existe, e nenhuma linha
-- toca `public` ou `storage`. Lê `auth.users` (só leitura, para pegar o
-- e-mail da conta logada) e não escreve nada lá.


-- ---------------------------------------------------------------------
-- PASSO 0 — Conferência. Só lê.
-- ---------------------------------------------------------------------

-- 0.1 As tabelas do estudo precisam existir (migration anterior aplicada).
select table_name
  from information_schema.tables
 where table_schema = 'rosabranca' and table_name like 'estudo\_%'
 order by table_name;

-- 0.2 Policies de hoje: uma por tabela, só da equipe.
select c.relname as tabela, p.polname as policy, p.polcmd as comando
  from pg_policy p
  join pg_class c on c.oid = p.polrelid
  join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'rosabranca' and c.relname like 'estudo\_%'
 order by c.relname, p.polname;


-- ---------------------------------------------------------------------
-- PASSO 1 — Um login = um aluno
-- ---------------------------------------------------------------------
-- Índice parcial: a mesma conta não pode ser vinculada a dois cadastros de
-- aluno. Ignora quem ainda não tem login (profile_id nulo), que é a maioria.

create unique index if not exists ux_estudo_alunos_profile
  on rosabranca.estudo_alunos (profile_id)
  where profile_id is not null;

-- Qual cadastro de aluno pertence à conta logada.
--
-- SECURITY DEFINER de propósito: as policies abaixo chamam esta função, e
-- se ela lesse `estudo_alunos` como o próprio usuário, a policy de
-- `estudo_alunos` chamaria a função de novo — a mesma recursão que
-- `meu_papel()` já resolve do mesmo jeito neste banco.
create or replace function rosabranca.meu_aluno_id()
returns uuid
language sql
stable
security definer
set search_path to 'rosabranca'
as $function$
  select a.id
    from rosabranca.estudo_alunos a
   where a.profile_id = auth.uid()
     and a.ativo
   limit 1;
$function$;

grant execute on function rosabranca.meu_aluno_id() to authenticated;


-- ---------------------------------------------------------------------
-- PASSO 2 — Policies de leitura do aluno
-- ---------------------------------------------------------------------
-- Policies permissivas somam com OR: a equipe continua vendo tudo pela
-- policy que já existe, e o aluno passa a ver o que é dele. Todas são
-- `for select` — nenhuma dá escrita.
--
-- `estudo_alunos` fica de fora DE PROPÓSITO: o aluno nunca precisa ler a
-- própria linha, e ela guarda as observações que a secretaria escreve
-- sobre ele. O nome e a frequência dele saem pela função do passo 4.

drop policy if exists estudo_matriculas_propria on rosabranca.estudo_matriculas;
create policy estudo_matriculas_propria on rosabranca.estudo_matriculas
  for select to authenticated
  using (aluno_id = rosabranca.meu_aluno_id());

drop policy if exists estudo_turmas_minhas on rosabranca.estudo_turmas;
create policy estudo_turmas_minhas on rosabranca.estudo_turmas
  for select to authenticated
  using (exists (
    select 1 from rosabranca.estudo_matriculas m
     where m.turma_id = estudo_turmas.id
       and m.aluno_id = rosabranca.meu_aluno_id()
  ));

drop policy if exists estudo_aulas_minhas on rosabranca.estudo_aulas;
create policy estudo_aulas_minhas on rosabranca.estudo_aulas
  for select to authenticated
  using (exists (
    select 1 from rosabranca.estudo_matriculas m
     where m.turma_id = estudo_aulas.turma_id
       and m.aluno_id = rosabranca.meu_aluno_id()
  ));

drop policy if exists estudo_materiais_meus on rosabranca.estudo_materiais;
create policy estudo_materiais_meus on rosabranca.estudo_materiais
  for select to authenticated
  using (exists (
    select 1
      from rosabranca.estudo_aulas au
      join rosabranca.estudo_matriculas m on m.turma_id = au.turma_id
     where au.id = estudo_materiais.aula_id
       and m.aluno_id = rosabranca.meu_aluno_id()
  ));

-- O aluno vê a própria presença, e só a dele: a chamada da turma inteira
-- continua sendo coisa da equipe.
drop policy if exists estudo_presencas_minhas on rosabranca.estudo_presencas;
create policy estudo_presencas_minhas on rosabranca.estudo_presencas
  for select to authenticated
  using (aluno_id = rosabranca.meu_aluno_id());

-- Confere: duas policies por tabela, menos estudo_alunos que segue com uma.
select c.relname as tabela, count(p.polname) as policies
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  left join pg_policy p on p.polrelid = c.oid
 where n.nspname = 'rosabranca' and c.relname like 'estudo\_%'
 group by c.relname
 order by c.relname;


-- ---------------------------------------------------------------------
-- PASSO 3 — Vincular a conta ao cadastro de aluno
-- ---------------------------------------------------------------------
-- O aluno se vincula sozinho, pelo e-mail: a secretaria cadastra o aluno
-- com o e-mail dele, ele cria a conta com o mesmo e-mail e clica em
-- vincular.
--
-- O e-mail vem do JWT da sessão, nunca de parâmetro — quem chama não
-- escolhe com qual cadastro se vincular. E só pega cadastro ainda solto:
-- não rouba vínculo de ninguém.

create or replace function rosabranca.vincular_meu_cadastro()
returns uuid
language plpgsql
security definer
set search_path to 'rosabranca'
as $function$
declare
  v_email text;
  v_id    uuid;
begin
  if auth.uid() is null then
    return null;
  end if;

  -- Já vinculado? Devolve o que já existe, sem tocar em nada.
  select a.id into v_id
    from rosabranca.estudo_alunos a
   where a.profile_id = auth.uid()
   limit 1;
  if v_id is not null then
    return v_id;
  end if;

  select u.email into v_email from auth.users u where u.id = auth.uid();
  if v_email is null or v_email = '' then
    return null;
  end if;

  select a.id into v_id
    from rosabranca.estudo_alunos a
   where a.profile_id is null
     and a.ativo
     and lower(a.email) = lower(v_email)
   order by a.criado_em
   limit 1;

  if v_id is null then
    return null;
  end if;

  update rosabranca.estudo_alunos
     set profile_id = auth.uid()
   where id = v_id;

  return v_id;
end $function$;

grant execute on function rosabranca.vincular_meu_cadastro() to authenticated;


-- ---------------------------------------------------------------------
-- PASSO 4 — A frequência do próprio aluno
-- ---------------------------------------------------------------------
-- v_estudo_frequencia junta `estudo_alunos`, que o aluno não pode ler (é
-- onde ficam as observações da secretaria). Então a view, sozinha, volta
-- vazia para ele.
--
-- Esta função roda como dona e filtra por meu_aluno_id(). O filtro não vem
-- de parâmetro: não há como pedir a frequência de outra pessoa.

create or replace function rosabranca.minha_frequencia()
returns setof rosabranca.v_estudo_frequencia
language sql
stable
security definer
set search_path to 'rosabranca'
as $function$
  select f.*
    from rosabranca.v_estudo_frequencia f
   where f.aluno_id = rosabranca.meu_aluno_id();
$function$;

grant execute on function rosabranca.minha_frequencia() to authenticated;


-- ---------------------------------------------------------------------
-- PASSO 5 — Tirar as funções novas do alcance do anônimo
-- ---------------------------------------------------------------------
-- O Postgres concede EXECUTE a PUBLIC por padrão em função nova. Conferido
-- depois de aplicar os passos acima: as três respondiam HTTP 200 para a
-- chave anônima.
--
-- Não havia vazamento — `meu_aluno_id()` devolve null sem auth.uid(), e
-- `minha_frequencia()` filtra por ela, então voltavam `null` e `[]`. Mas
-- isso é uma camada só de proteção: bastaria um dia alguém editar a função
-- e esquecer a guarda. Revogar é a segunda camada.

revoke execute on function rosabranca.meu_aluno_id()          from public, anon;
revoke execute on function rosabranca.vincular_meu_cadastro() from public, anon;
revoke execute on function rosabranca.minha_frequencia()      from public, anon;

-- `authenticated` mantém o execute concedido nos passos anteriores.
grant execute on function rosabranca.meu_aluno_id()          to authenticated;
grant execute on function rosabranca.vincular_meu_cadastro() to authenticated;
grant execute on function rosabranca.minha_frequencia()      to authenticated;

-- Confere: só authenticated na lista de quem pode executar.
select p.proname as funcao, p.proacl as permissoes
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'rosabranca'
   and p.proname in ('meu_aluno_id', 'vincular_meu_cadastro', 'minha_frequencia')
 order by p.proname;


-- ---------------------------------------------------------------------
-- Final — avisar a API das funções novas
-- ---------------------------------------------------------------------
notify pgrst, 'reload schema';


-- ---------------------------------------------------------------------
-- Conferência final (opcional, depois de ter um aluno vinculado)
-- ---------------------------------------------------------------------
-- Rodando como você (diretoria), meu_aluno_id() devolve nulo — você não é
-- aluno. Isso é o esperado e não indica erro:
--
--   select rosabranca.meu_aluno_id() as meu_aluno_id;
--
-- O teste que vale é entrar no site com a conta de um aluno vinculado e
-- abrir /aluno.


-- ---------------------------------------------------------------------
-- Desfazer
-- ---------------------------------------------------------------------
--   drop function if exists rosabranca.minha_frequencia();   -- o revoke do passo 5 cai junto
--   drop function if exists rosabranca.vincular_meu_cadastro();
--   drop policy if exists estudo_presencas_minhas  on rosabranca.estudo_presencas;
--   drop policy if exists estudo_materiais_meus    on rosabranca.estudo_materiais;
--   drop policy if exists estudo_aulas_minhas      on rosabranca.estudo_aulas;
--   drop policy if exists estudo_turmas_minhas     on rosabranca.estudo_turmas;
--   drop policy if exists estudo_matriculas_propria on rosabranca.estudo_matriculas;
--   drop function if exists rosabranca.meu_aluno_id();
--   drop index if exists rosabranca.ux_estudo_alunos_profile;
