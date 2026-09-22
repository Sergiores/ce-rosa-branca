-- =====================================================================
-- Área de estudos — turmas, alunos, aulas, materiais, chamada e histórico
-- Schema: rosabranca            Banco compartilhado com a loja em produção
-- Escrito em 21/09/2026 para aplicação manual no SQL Editor
-- =====================================================================
--
-- COMO RODAR: um passo de cada vez, conferindo a saída antes do seguinte.
-- Diferente da migration anterior, aqui NENHUM passo precisa rodar sozinho:
-- não há `alter type ... add value` no caminho principal. Os status são
-- `text` com `check` justamente para evitar aquela armadilha do enum.
--
-- Tudo é aditivo: seis tabelas novas, uma view e linhas em `permissoes`.
-- Nada altera nem apaga objeto existente. Nenhuma linha toca `public`,
-- `auth` ou `storage`.
--
-- O passo 6 é OPCIONAL e é o único que mexe em coisa existente — leia o
-- aviso antes de rodá-lo.


-- ---------------------------------------------------------------------
-- PASSO 0 — Conferência. Só lê, não muda nada.
-- ---------------------------------------------------------------------

-- 0.1 As funções que as policies vão usar precisam existir neste schema.
select n.nspname as schema, p.proname as funcao
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'rosabranca'
   and p.proname in ('meu_papel', 'eh_diretoria', 'aplicar_auditoria')
 order by p.proname;

-- 0.2 `membros` precisa existir: o aluno pode apontar para um membro da casa.
select table_name
  from information_schema.tables
 where table_schema = 'rosabranca' and table_name = 'membros';

-- 0.3 Versão do Postgres — a view do passo 4 usa `security_invoker`,
--     que exige 15 ou superior.
select current_setting('server_version') as versao_postgres;


-- ---------------------------------------------------------------------
-- PASSO 1 — Tabelas
-- ---------------------------------------------------------------------

-- Turma: um grupo de estudo, num nível, com dia e horário fixos.
-- `nivel` é texto livre de propósito: "vários níveis" se resolve com turmas
-- de níveis diferentes, e uma tabela de níveis só pagaria a pena quando
-- existir currículo preso a cada nível.
create table if not exists rosabranca.estudo_turmas (
  id             uuid primary key default gen_random_uuid(),
  nome           text not null,
  nivel          text not null default 'Introdutório',
  descricao      text,
  dia_semana     smallint check (dia_semana between 0 and 6),  -- 0 = domingo
  horario        time,
  local          text,
  data_inicio    date,
  data_fim       date,
  status         text not null default 'planejada'
                 check (status in ('planejada', 'ativa', 'encerrada')),
  responsavel_id uuid references rosabranca.profiles(id) on delete set null,
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now()
);

-- Aluno: a PESSOA, e não a matrícula. Existe fora da turma porque o
-- histórico atravessa turmas — é isso que permite saber o que alguém
-- cursou ao longo dos anos.
--
-- profile_id e membro_id são os dois opcionais, de propósito: quem estuda
-- aqui pode não ter login nenhum e pode não ser membro da casa. Só `nome` é
-- obrigatório. Mesmo desenho que `membros` já usa para profile_id.
create table if not exists rosabranca.estudo_alunos (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid references rosabranca.profiles(id) on delete set null,
  membro_id   uuid references rosabranca.membros(id)  on delete set null,
  nome        text not null,
  email       text,
  telefone    text,
  observacoes text,
  ativo       boolean not null default true,
  criado_em   timestamptz not null default now()
);

create index if not exists ix_estudo_alunos_nome on rosabranca.estudo_alunos (nome);

-- Matrícula: liga aluno e turma, e guarda se ele concluiu.
create table if not exists rosabranca.estudo_matriculas (
  id             uuid primary key default gen_random_uuid(),
  turma_id       uuid not null references rosabranca.estudo_turmas(id) on delete cascade,
  aluno_id       uuid not null references rosabranca.estudo_alunos(id) on delete cascade,
  status         text not null default 'matriculado'
                 check (status in ('matriculado', 'concluido', 'desistente')),
  matriculado_em date not null default current_date,
  concluido_em   date,
  observacoes    text,
  unique (turma_id, aluno_id)
);

-- Aula: um encontro planejado da turma.
-- unique (turma_id, numero) segue a mesma invariante de `atas`, que já usa
-- unique (numero, ano): não pode existir "aula 3" duplicada na turma.
create table if not exists rosabranca.estudo_aulas (
  id          uuid primary key default gen_random_uuid(),
  turma_id    uuid not null references rosabranca.estudo_turmas(id) on delete cascade,
  numero      integer not null,
  titulo      text not null,
  data        date not null,
  plano       text,
  observacoes text,
  status      text not null default 'planejada'
              check (status in ('planejada', 'realizada', 'cancelada')),
  criado_em   timestamptz not null default now(),
  unique (turma_id, numero)
);

create index if not exists ix_estudo_aulas_turma_data
  on rosabranca.estudo_aulas (turma_id, data);

-- Material complementar da aula: vídeo, link ou um texto solto.
-- Arquivo de verdade não entra aqui: para isso existe `anexos`, e o passo 6
-- (opcional) explica como liberá-lo para aulas.
create table if not exists rosabranca.estudo_materiais (
  id        uuid primary key default gen_random_uuid(),
  aula_id   uuid not null references rosabranca.estudo_aulas(id) on delete cascade,
  tipo      text not null default 'link' check (tipo in ('video', 'link', 'texto')),
  titulo    text not null,
  url       text,
  descricao text,
  ordem     integer not null default 0,
  criado_em timestamptz not null default now(),
  -- vídeo e link precisam de endereço; 'texto' vive na descrição
  constraint material_url_quando_precisa
    check (tipo = 'texto' or (url is not null and url <> ''))
);

create index if not exists ix_estudo_materiais_aula
  on rosabranca.estudo_materiais (aula_id, ordem);

-- Chamada. A chave aponta para o ALUNO, não para a matrícula: se a pessoa
-- se matricular de novo numa turma futura, a presença de antes continua
-- ligada a ela. Era esse o histórico pedido.
create table if not exists rosabranca.estudo_presencas (
  aula_id        uuid not null references rosabranca.estudo_aulas(id)  on delete cascade,
  aluno_id       uuid not null references rosabranca.estudo_alunos(id) on delete cascade,
  presente       boolean not null default true,
  justificativa  text,
  registrado_por uuid references rosabranca.profiles(id) on delete set null,
  registrado_em  timestamptz not null default now(),
  primary key (aula_id, aluno_id)
);

-- Confere: as seis tabelas.
select table_name
  from information_schema.tables
 where table_schema = 'rosabranca' and table_name like 'estudo\_%'
 order by table_name;


-- ---------------------------------------------------------------------
-- PASSO 2 — RLS, policies e grants
-- ---------------------------------------------------------------------
-- Escopo de PAPEL, não de pessoa: quem cuida do estudo é diretoria e
-- voluntário. Diferente de questao_favorita, que era por auth.uid().
-- `anon` não recebe grant nenhum: nada disso é conteúdo público.

alter table rosabranca.estudo_turmas     enable row level security;
alter table rosabranca.estudo_alunos     enable row level security;
alter table rosabranca.estudo_matriculas enable row level security;
alter table rosabranca.estudo_aulas      enable row level security;
alter table rosabranca.estudo_materiais  enable row level security;
alter table rosabranca.estudo_presencas  enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'estudo_turmas', 'estudo_alunos', 'estudo_matriculas',
    'estudo_aulas', 'estudo_materiais', 'estudo_presencas'
  ] loop
    execute format('drop policy if exists %I on rosabranca.%I', t || '_equipe', t);
    execute format(
      'create policy %I on rosabranca.%I for all to authenticated
         using      (rosabranca.meu_papel() in (''diretoria'', ''voluntario''))
         with check (rosabranca.meu_papel() in (''diretoria'', ''voluntario''))',
      t || '_equipe', t);

    execute format(
      'grant select, insert, update, delete on rosabranca.%I to authenticated', t);
  end loop;
end $$;

-- Confere: seis tabelas, todas com RLS ligado e uma policy cada.
select c.relname as tabela, c.relrowsecurity as rls_ligado, count(p.polname) as policies
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  left join pg_policy p on p.polrelid = c.oid
 where n.nspname = 'rosabranca' and c.relname like 'estudo\_%'
 group by c.relname, c.relrowsecurity
 order by c.relname;


-- ---------------------------------------------------------------------
-- PASSO 3 — Auditoria
-- ---------------------------------------------------------------------
-- Todas as seis entram: quem marcou presença e quem alterou matrícula é
-- exatamente o tipo de registro que a casa pode precisar defender depois.

select rosabranca.aplicar_auditoria('estudo_turmas');
select rosabranca.aplicar_auditoria('estudo_alunos');
select rosabranca.aplicar_auditoria('estudo_matriculas');
select rosabranca.aplicar_auditoria('estudo_aulas');
select rosabranca.aplicar_auditoria('estudo_materiais');
select rosabranca.aplicar_auditoria('estudo_presencas');

-- Confere: seis triggers de auditoria.
select c.relname as tabela, t.tgname as trigger
  from pg_trigger t
  join pg_class c on c.oid = t.tgrelid
  join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'rosabranca'
   and c.relname like 'estudo\_%'
   and t.tgname = 'trg_auditoria'
 order by c.relname;


-- ---------------------------------------------------------------------
-- PASSO 4 — View de frequência (histórico do aluno)
-- ---------------------------------------------------------------------
-- Frequência é DERIVADA, nunca armazenada — mesma regra do saldo dos
-- títulos: não existe coluna de saldo, existe v_titulos_saldo.
--
-- `security_invoker = true` faz a view respeitar o RLS de quem consulta,
-- em vez de rodar com os poderes do dono. Exige Postgres 15+ (conferido
-- no passo 0.3). Se der erro de sintaxe, o banco é mais antigo: pare e
-- avise, porque sem isso a view furaria o RLS das tabelas de baixo.

create or replace view rosabranca.v_estudo_frequencia
with (security_invoker = true) as
select
  m.id       as matricula_id,
  m.turma_id,
  m.aluno_id,
  m.status   as matricula_status,
  m.matriculado_em,
  m.concluido_em,
  t.nome     as turma_nome,
  t.nivel    as turma_nivel,
  t.status   as turma_status,
  al.nome    as aluno_nome,
  count(au.id)                                as aulas_realizadas,
  count(p.aula_id) filter (where p.presente)  as presencas,
  case
    when count(au.id) = 0 then null
    else round(100.0 * count(p.aula_id) filter (where p.presente) / count(au.id), 1)
  end as frequencia_pct
from rosabranca.estudo_matriculas m
join rosabranca.estudo_turmas  t  on t.id  = m.turma_id
join rosabranca.estudo_alunos  al on al.id = m.aluno_id
-- só aulas realizadas contam: aula planejada ou cancelada não derruba a
-- frequência de ninguém
left join rosabranca.estudo_aulas au
       on au.turma_id = m.turma_id and au.status = 'realizada'
left join rosabranca.estudo_presencas p
       on p.aula_id = au.id and p.aluno_id = m.aluno_id
group by m.id, m.turma_id, m.aluno_id, m.status, m.matriculado_em, m.concluido_em,
         t.nome, t.nivel, t.status, al.nome;

grant select on rosabranca.v_estudo_frequencia to authenticated;

-- Confere: a view existe (vem vazia, ainda não há turma cadastrada).
select * from rosabranca.v_estudo_frequencia limit 5;


-- ---------------------------------------------------------------------
-- PASSO 5 — Tela nova na matriz de permissões
-- ---------------------------------------------------------------------
-- `permissoes` só dirige a interface: ela diz qual item de menu aparece
-- para cada papel. Quem protege as linhas é o RLS do passo 2.
--
-- Diretoria já entra vendo e editando; voluntário vê e edita (é quem dá
-- aula); os demais papéis entram negados e a diretoria libera depois na
-- tela de Permissões, se quiser.

insert into rosabranca.permissoes (role, tela_key, ver, editar)
values
  ('diretoria',  'estudos', true,  true),
  ('voluntario', 'estudos', true,  true),
  ('aluno',      'estudos', false, false),
  ('membro',     'estudos', false, false),
  ('visitante',  'estudos', false, false)
on conflict (role, tela_key) do nothing;

-- Confere.
select role, tela_key, ver, editar
  from rosabranca.permissoes
 where tela_key = 'estudos'
 order by role::text;


-- ---------------------------------------------------------------------
-- Final — avisar a API das tabelas novas
-- ---------------------------------------------------------------------
notify pgrst, 'reload schema';


-- ---------------------------------------------------------------------
-- PASSO 6 — OPCIONAL: anexar arquivo de verdade na aula
-- ---------------------------------------------------------------------
-- Só rode se quiser subir PDF/slide na aula, além de vídeo e link.
--
-- ATENÇÃO, DUAS COISAS:
--   1. Este é o único passo que altera objeto existente (o enum de
--      anexos, que já é usado por documento, ata, notícia e evento).
--   2. `alter type ... add value` NÃO pode ser usado na mesma transação
--      em que nasce. Rode a linha abaixo SOZINHA, e só depois mexa em
--      qualquer coisa que use 'aula'. É o mesmo erro 55P04 de antes.
--
-- alter type rosabranca.entidade_anexo add value if not exists 'aula';
--
-- Depois disso, a policy de anexos precisa aceitar a entidade nova — ela
-- hoje lista as entidades permitidas explicitamente. Pare e peça, que eu
-- escrevo em cima do corpo real da policy, como fiz com a trigger de
-- perfil.


-- ---------------------------------------------------------------------
-- Desfazer
-- ---------------------------------------------------------------------
-- Tudo dos passos 1 a 5 é reversível:
--
--   drop view  if exists rosabranca.v_estudo_frequencia;
--   drop table if exists rosabranca.estudo_presencas;
--   drop table if exists rosabranca.estudo_materiais;
--   drop table if exists rosabranca.estudo_aulas;
--   drop table if exists rosabranca.estudo_matriculas;
--   drop table if exists rosabranca.estudo_alunos;
--   drop table if exists rosabranca.estudo_turmas;
--   delete from rosabranca.permissoes where tela_key = 'estudos';
--
-- A ordem importa: as de baixo dependem das de cima.
