-- ============================================================
-- 0001_base.sql
-- Fundacao: papeis, profiles, permissoes por tela e auditoria.
-- A fronteira de permissao e o RLS do Postgres, nao a interface.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- Papeis ----------
do $$ begin
  create type public.papel_usuario as enum ('diretoria', 'voluntario', 'aluno', 'membro');
exception when duplicate_object then null; end $$;

-- ---------- Perfis ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  nome        text not null default '',
  email       text,
  telefone    text,
  role        public.papel_usuario not null default 'membro',
  ativo       boolean not null default true,
  criado_em   timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- Helper SECURITY DEFINER: politicas em profiles que consultam profiles
-- causariam recursao infinita. Este helper quebra o ciclo.
create or replace function public.meu_papel()
returns public.papel_usuario
language sql
stable
security definer
set search_path = public
as $$
  select p.role from public.profiles p where p.id = auth.uid() and p.ativo;
$$;

create or replace function public.eh_diretoria()
returns boolean
language sql
stable
as $$ select coalesce(public.meu_papel() = 'diretoria', false); $$;

-- Cria o profile automaticamente quando a diretoria convida um usuario.
-- O papel NUNCA vem do metadata do proprio usuario: se o signup publico
-- estiver ligado no projeto, qualquer um se cadastraria como diretoria.
-- Todo novo usuario nasce 'membro'; a tela de convite promove em seguida.
create or replace function public.fn_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', ''),
    new.email,
    'membro'
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists trg_novo_usuario on auth.users;
create trigger trg_novo_usuario
  after insert on auth.users
  for each row execute function public.fn_novo_usuario();

-- ---------- Auditoria ----------
create table if not exists public.auditoria (
  id            bigint generated always as identity primary key,
  tabela        text not null,
  registro_id   text,
  acao          text not null check (acao in ('INSERT','UPDATE','DELETE')),
  autor_id      uuid,
  autor_email   text,
  dados_antes   jsonb,
  dados_depois  jsonb,
  criado_em     timestamptz not null default now()
);
create index if not exists idx_auditoria_tabela on public.auditoria (tabela, criado_em desc);
create index if not exists idx_auditoria_autor  on public.auditoria (autor_id, criado_em desc);

-- Trigger generica. Registrar no banco (e nao na aplicacao) garante que nada
-- escapa: nem alteracao feita direto pelo painel do Supabase.
create or replace function public.fn_auditoria()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_registro text;
  v_antes    jsonb;
  v_depois   jsonb;
  v_email    text;
begin
  if tg_op = 'DELETE' then
    v_antes := to_jsonb(old);
    v_registro := v_antes->>'id';
  elsif tg_op = 'UPDATE' then
    v_antes := to_jsonb(old);
    v_depois := to_jsonb(new);
    v_registro := v_depois->>'id';
  else
    v_depois := to_jsonb(new);
    v_registro := v_depois->>'id';
  end if;

  begin
    v_email := nullif(current_setting('request.jwt.claims', true), '')::jsonb->>'email';
  exception when others then
    v_email := null;
  end;

  insert into public.auditoria (tabela, registro_id, acao, autor_id, autor_email, dados_antes, dados_depois)
  values (tg_table_name, v_registro, tg_op, auth.uid(), coalesce(v_email, session_user), v_antes, v_depois);

  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;

-- Toda migration nova deve chamar isto para a tabela que criar.
create or replace function public.aplicar_auditoria(p_tabela text)
returns void
language plpgsql
as $$
begin
  execute format('drop trigger if exists trg_auditoria on public.%I', p_tabela);
  execute format(
    'create trigger trg_auditoria after insert or update or delete on public.%I
       for each row execute function public.fn_auditoria()', p_tabela);
end $$;

-- ---------- Permissoes por tela (dirige a UI, nao substitui o RLS) ----------
create table if not exists public.permissoes (
  role      public.papel_usuario not null,
  tela_key  text not null,
  ver       boolean not null default false,
  editar    boolean not null default false,
  primary key (role, tela_key)
);

insert into public.permissoes (role, tela_key, ver, editar) values
  ('diretoria','painel',true,true),
  ('diretoria','conteudo',true,true),
  ('diretoria','atas',true,true),
  ('diretoria','usuarios',true,true),
  ('diretoria','permissoes',true,true),
  ('diretoria','membros',true,true),
  ('diretoria','compras',true,true),
  ('diretoria','contas_pagar',true,true),
  ('diretoria','contas_receber',true,true),
  ('diretoria','relatorios',true,true),
  ('diretoria','auditoria',true,false),
  ('diretoria','audiencia',true,false),
  ('voluntario','painel',true,false),
  ('voluntario','conteudo',true,true),
  ('aluno','painel',true,false),
  ('membro','painel',true,false)
on conflict (role, tela_key) do nothing;

-- ---------- RLS ----------
alter table public.profiles   enable row level security;
alter table public.permissoes enable row level security;
alter table public.auditoria  enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.eh_diretoria());

drop policy if exists profiles_update_proprio on public.profiles;
create policy profiles_update_proprio on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid() and role = public.meu_papel());

drop policy if exists profiles_admin on public.profiles;
create policy profiles_admin on public.profiles for all to authenticated
  using (public.eh_diretoria()) with check (public.eh_diretoria());

drop policy if exists permissoes_select on public.permissoes;
create policy permissoes_select on public.permissoes for select to authenticated using (true);

drop policy if exists permissoes_admin on public.permissoes;
create policy permissoes_admin on public.permissoes for all to authenticated
  using (public.eh_diretoria()) with check (public.eh_diretoria());

-- Auditoria e log imutavel: leitura para diretoria, sem update/delete para ninguem.
drop policy if exists auditoria_select on public.auditoria;
create policy auditoria_select on public.auditoria for select to authenticated
  using (public.eh_diretoria());

revoke insert, update, delete on public.auditoria from anon, authenticated;

select public.aplicar_auditoria('profiles');
select public.aplicar_auditoria('permissoes');
