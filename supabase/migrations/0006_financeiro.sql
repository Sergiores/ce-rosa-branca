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
