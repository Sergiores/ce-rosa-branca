-- ============================================================
-- 0003_metricas.sql  -- Contador de acessos e de visualizacoes
-- O anonimo NAO recebe insert nessas tabelas: a gravacao passa por
-- RPC SECURITY DEFINER. Contador em coluna incrementavel pelo cliente
-- seria manipulavel por qualquer visitante.
-- LGPD: guardamos hash de sessao, nunca o IP bruto.
-- ============================================================

create table if not exists public.acessos_site (
  id          bigint generated always as identity primary key,
  path        text not null,
  dia         date not null default current_date,
  sessao_hash text not null,
  referrer    text,
  criado_em   timestamptz not null default now()
);
create unique index if not exists idx_acesso_unico on public.acessos_site (dia, sessao_hash, path);
create index if not exists idx_acesso_dia on public.acessos_site (dia desc);

do $$ begin
  create type public.entidade_metrica as enum ('noticia', 'mensagem', 'pagina', 'evento', 'projeto');
exception when duplicate_object then null; end $$;

create table if not exists public.visualizacoes (
  id          bigint generated always as identity primary key,
  entidade    public.entidade_metrica not null,
  entidade_id text not null,
  dia         date not null default current_date,
  sessao_hash text not null,
  referrer    text,
  criado_em   timestamptz not null default now()
);
create unique index if not exists idx_view_unica on public.visualizacoes (dia, sessao_hash, entidade, entidade_id);
create index if not exists idx_view_entidade on public.visualizacoes (entidade, entidade_id);

-- ---------- RPCs de gravacao ----------
create or replace function public.registrar_acesso(p_path text, p_sessao_hash text, p_referrer text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_path is null or p_sessao_hash is null then return; end if;
  insert into public.acessos_site (path, sessao_hash, referrer)
  values (left(p_path, 300), left(p_sessao_hash, 64), left(p_referrer, 300))
  on conflict do nothing;
end $$;

create or replace function public.registrar_visualizacao(
  p_entidade public.entidade_metrica,
  p_entidade_id text,
  p_sessao_hash text,
  p_referrer text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_entidade_id is null or p_sessao_hash is null then return; end if;
  insert into public.visualizacoes (entidade, entidade_id, sessao_hash, referrer)
  values (p_entidade, left(p_entidade_id, 64), left(p_sessao_hash, 64), left(p_referrer, 300))
  on conflict do nothing;
end $$;

grant execute on function public.registrar_acesso(text, text, text) to anon, authenticated;
grant execute on function public.registrar_visualizacao(public.entidade_metrica, text, text, text) to anon, authenticated;

-- ---------- Views de leitura (security_invoker: aplica o RLS de quem consulta) ----------
create or replace view public.v_acessos_dia with (security_invoker = true) as
  select dia, count(*)::bigint as acessos, count(distinct sessao_hash)::bigint as visitantes
  from public.acessos_site group by dia order by dia desc;

create or replace view public.v_paginas_populares with (security_invoker = true) as
  select path, count(*)::bigint as acessos
  from public.acessos_site group by path order by acessos desc;

create or replace view public.v_visualizacoes_dia with (security_invoker = true) as
  select dia, entidade, count(*)::bigint as visualizacoes
  from public.visualizacoes group by dia, entidade order by dia desc;

create or replace view public.v_noticias_mais_vistas with (security_invoker = true) as
  select n.id, n.titulo, n.slug, count(v.id)::bigint as visualizacoes
  from public.noticias n
  left join public.visualizacoes v on v.entidade = 'noticia' and v.entidade_id = n.id::text
  group by n.id, n.titulo, n.slug
  order by visualizacoes desc;

-- ---------- RLS ----------
alter table public.acessos_site  enable row level security;
alter table public.visualizacoes enable row level security;

drop policy if exists acessos_select on public.acessos_site;
create policy acessos_select on public.acessos_site for select to authenticated
  using (public.eh_diretoria());

drop policy if exists views_select on public.visualizacoes;
create policy views_select on public.visualizacoes for select to authenticated
  using (public.eh_diretoria());

-- Sem policy de insert: so as RPCs SECURITY DEFINER gravam.
revoke insert, update, delete on public.acessos_site  from anon, authenticated;
revoke insert, update, delete on public.visualizacoes from anon, authenticated;
