-- ============================================================
-- 0005_atas.sql  -- Atas de reuniao
-- ============================================================

do $$ begin
  create type public.tipo_reuniao as enum ('ordinaria', 'extraordinaria', 'assembleia');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.status_ata as enum ('rascunho', 'aprovada');
exception when duplicate_object then null; end $$;

create table if not exists public.atas (
  id                  uuid primary key default gen_random_uuid(),
  numero              int not null,
  ano                 int not null,
  data_reuniao        date not null,
  tipo                public.tipo_reuniao not null default 'ordinaria',
  titulo              text not null,
  pauta               text,
  deliberacoes        text,
  participantes       text,
  status              public.status_ata not null default 'rascunho',
  visivel_voluntarios boolean not null default false,
  aprovada_por        uuid references public.profiles(id) on delete set null,
  aprovada_em         timestamptz,
  autor_id            uuid references public.profiles(id) on delete set null,
  criado_em           timestamptz not null default now(),
  atualizado_em       timestamptz not null default now(),
  unique (numero, ano)
);
create index if not exists idx_atas_data on public.atas (data_reuniao desc);

-- Sugere o proximo numero do ano.
create or replace function public.proximo_numero_ata(p_ano int)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(max(numero), 0) + 1 from public.atas where ano = p_ano;
$$;
grant execute on function public.proximo_numero_ata(int) to authenticated;

-- Ata aprovada e somente leitura: correcao vira nova versao, com historico em auditoria.
create or replace function public.fn_ata_imutavel()
returns trigger
language plpgsql
as $$
begin
  if old.status = 'aprovada' and public.meu_papel() is distinct from 'diretoria' then
    raise exception 'Ata aprovada nao pode ser alterada.';
  end if;
  if old.status = 'aprovada' and new.status = 'aprovada'
     and (new.pauta, new.deliberacoes, new.participantes, new.data_reuniao, new.numero)
         is distinct from (old.pauta, old.deliberacoes, old.participantes, old.data_reuniao, old.numero) then
    raise exception 'Ata aprovada e somente leitura. Reabra para rascunho antes de corrigir.';
  end if;
  return new;
end $$;

drop trigger if exists trg_ata_imutavel on public.atas;
create trigger trg_ata_imutavel before update on public.atas
  for each row execute function public.fn_ata_imutavel();

alter table public.atas enable row level security;

drop policy if exists atas_select on public.atas;
create policy atas_select on public.atas for select to authenticated
  using (public.eh_diretoria() or (visivel_voluntarios and public.meu_papel() = 'voluntario'));

drop policy if exists atas_escrita on public.atas;
create policy atas_escrita on public.atas for all to authenticated
  using (public.eh_diretoria()) with check (public.eh_diretoria());

select public.aplicar_auditoria('atas');
