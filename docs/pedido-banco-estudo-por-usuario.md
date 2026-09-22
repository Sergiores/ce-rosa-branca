# Pedido de migration — estudo por usuário

**Para:** repositório `D:\Projetos\BancodeDados`
**Pedido por:** Casa Espírita Rosa Branca (app), 21/09/2026
**Schema:** `rosabranca`

Este arquivo existe porque o app não cria nem altera estrutura de banco
(AGENTS.md, regra 2). Abaixo está o que a aplicação precisa para atender o
pedido: ordenar as questões por data de publicação, marcar questão lida por
usuário e permitir favoritar.

São **duas entregas independentes**. A primeira é uma coluna e desbloqueia
sozinha a parte visível do pedido.

---

## Entrega 1 — ordem de publicação (uma coluna, sem policy nova)

### Por que

Hoje `rosabranca.questoes` só tem `criado_em`, e as 1.019 questões entraram
num único seed. As duas publicadas têm **exatamente** o mesmo valor:

```
numero   criado_em
1        2026-09-05T20:18:54.005391+00:00
919      2026-09-05T20:18:54.005391+00:00
```

Ou seja, `criado_em` registra quando a linha foi criada, não quando a casa
publicou a questão. Ordenar por ela devolve ordem arbitrária, e continuará
errada conforme os rascunhos forem publicados um a um.

### Migration

```sql
alter table rosabranca.questoes
  add column publicado_em timestamptz;

comment on column rosabranca.questoes.publicado_em is
  'Quando a questao passou a publicada. Diferente de criado_em, que marca o
   seed inicial das 1.019 questoes e e igual para todas elas.';

-- Backfill das que ja estao no ar, para nao ficarem com NULL na ordenacao.
update rosabranca.questoes
   set publicado_em = criado_em
 where status = 'publicado'
   and publicado_em is null;
```

Preencher `publicado_em` na transição para `publicado` pode ser feito por
trigger no banco ou pela Server Action do app — **diga qual**, para não
acontecer nos dois lugares.

### O que o app faz depois

Reflete a coluna em `src/lib/tipos.ts` à mão e troca a ordenação de
`listarQuestoes()` para `publicado_em desc`, com `numero` como desempate.

---

## Entrega 2 — leitura e favoritos por usuário

### Atenção: não reaproveitar `registrar_visualizacao`

A RPC existente é `security definer` justamente para o anônimo incrementar
contador sem ter insert, e guarda **hash de sessão, não id de usuário**. Ela
responde "quantas visualizações", e não consegue responder "esta pessoa leu".
São coisas diferentes: o que segue precisa de `user_id` de verdade.

### Decisão pendente antes de escrever esta parte

Quem pode favoritar? Hoje não existe cadastro público: o acesso é por convite
da diretoria, e `auth.users` é compartilhado com a loja. Ver a seção
"Decisão" no fim.

### Migration (assumindo referência a `rosabranca.profiles`)

```sql
create table rosabranca.questao_leitura (
  user_id     uuid not null references rosabranca.profiles(id) on delete cascade,
  questao_id  uuid not null references rosabranca.questoes(id) on delete cascade,
  lido_em     timestamptz not null default now(),
  primary key (user_id, questao_id)
);

create table rosabranca.questao_favorita (
  user_id     uuid not null references rosabranca.profiles(id) on delete cascade,
  questao_id  uuid not null references rosabranca.questoes(id) on delete cascade,
  criado_em   timestamptz not null default now(),
  primary key (user_id, questao_id)
);

create index on rosabranca.questao_favorita (user_id, criado_em desc);

alter table rosabranca.questao_leitura  enable row level security;
alter table rosabranca.questao_favorita enable row level security;
```

### RLS — o modelo de segurança inteiro está aqui

Estas são as primeiras tabelas do projeto com escopo de **pessoa**, não de
papel. Ninguém pode ler nem escrever a linha de outro:

```sql
create policy leitura_propria on rosabranca.questao_leitura
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy favorita_propria on rosabranca.questao_favorita
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
```

`anon` não recebe grant nenhum nestas tabelas — quem não está logado não
marca nada, que é o comportamento pedido.

Aplicar a auditoria genérica nas duas:

```sql
select rosabranca.aplicar_auditoria('questao_leitura');
select rosabranca.aplicar_auditoria('questao_favorita');
```

Se o volume de leitura incomodar a auditoria (é uma linha por questão aberta
por pessoa), vale decidir aí se `questao_leitura` fica de fora.

---

## Decisão que trava a Entrega 2

Favoritar exige conta. Hoje o site **não tem cadastro público** — a diretoria
convida por e-mail. Dois caminhos:

**A. Abrir cadastro público, com papel novo `visitante`** *(recomendado)*
Quem frequenta a casa cria a própria conta e passa a ter lista de leitura e
favoritos. Exige:
- acrescentar `visitante` ao enum de papéis;
- `permissoes` do `visitante` sem nenhuma tela de gestão;
- a trigger de criação de perfil continua exigindo `projeto: 'rosabranca'` no
  metadata — o `signUp` do site precisa mandar isso, senão a conta nasce sem
  perfil (mesmo cuidado que já existe no convite).

**B. Manter só por convite**
Nada muda no cadastro. Favoritos ficam disponíveis apenas para diretoria,
voluntários, alunos e membros já convidados. Mais simples e mais fechado, mas
o visitante comum do site não favorita nada.

A escolha muda o enum e o fluxo de cadastro, não o desenho das duas tabelas.
