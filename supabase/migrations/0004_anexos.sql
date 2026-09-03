-- ============================================================
-- 0004_anexos.sql  -- Anexos em bucket PRIVADO, servidos por signed URL.
-- Notas fiscais e atas nunca podem ser publicas.
-- ============================================================

do $$ begin
  create type public.entidade_anexo as enum ('documento', 'ata', 'noticia', 'evento');
exception when duplicate_object then null; end $$;

create table if not exists public.anexos (
  id           uuid primary key default gen_random_uuid(),
  entidade     public.entidade_anexo not null,
  entidade_id  uuid not null,
  nome_arquivo text not null,
  mime         text not null,
  tamanho      bigint not null check (tamanho > 0 and tamanho <= 20971520), -- 20 MB
  storage_path text not null unique,
  enviado_por  uuid references public.profiles(id) on delete set null,
  criado_em    timestamptz not null default now(),
  constraint mime_permitido check (mime in (
    'application/pdf','image/jpeg','image/png','image/webp',
    'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ))
);
create index if not exists idx_anexos_entidade on public.anexos (entidade, entidade_id);

alter table public.anexos enable row level security;

-- Anexos de documentos e atas: apenas diretoria.
-- Anexos de noticia/evento acompanham conteudo publicado.
drop policy if exists anexos_select on public.anexos;
create policy anexos_select on public.anexos for select to authenticated
  using (
    public.eh_diretoria()
    or (entidade in ('noticia','evento') and public.meu_papel() in ('voluntario'))
  );

drop policy if exists anexos_escrita on public.anexos;
create policy anexos_escrita on public.anexos for all to authenticated
  using (public.eh_diretoria() or (entidade in ('noticia','evento') and public.meu_papel() = 'voluntario'))
  with check (public.eh_diretoria() or (entidade in ('noticia','evento') and public.meu_papel() = 'voluntario'));

select public.aplicar_auditoria('anexos');

-- ---------- Buckets ----------
insert into storage.buckets (id, name, public, file_size_limit)
values ('midia', 'midia', true, 10485760)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public, file_size_limit)
values ('anexos', 'anexos', false, 20971520)
on conflict (id) do update set public = false;

-- midia: leitura publica, escrita para editores
drop policy if exists midia_leitura on storage.objects;
create policy midia_leitura on storage.objects for select to anon, authenticated
  using (bucket_id = 'midia');

drop policy if exists midia_escrita on storage.objects;
create policy midia_escrita on storage.objects for all to authenticated
  using (bucket_id = 'midia' and public.meu_papel() in ('diretoria','voluntario'))
  with check (bucket_id = 'midia' and public.meu_papel() in ('diretoria','voluntario'));

-- anexos: privado. Sem policy para anon; signed URL e emitida no servidor.
drop policy if exists anexos_storage on storage.objects;
create policy anexos_storage on storage.objects for all to authenticated
  using (bucket_id = 'anexos' and public.eh_diretoria())
  with check (bucket_id = 'anexos' and public.eh_diretoria());
