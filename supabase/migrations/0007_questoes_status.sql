-- ============================================================
-- 0007_questoes_status.sql
-- Questao passa a ter rascunho/publicado, como o restante do conteudo.
-- A leitura publica deixa de ver tudo e passa a ver so o publicado.
-- ============================================================

alter table public.questoes
  add column if not exists status public.status_publicacao not null default 'rascunho';

-- Questoes que ja existiam continuam visiveis no site.
update public.questoes set status = 'publicado' where status = 'rascunho';

create index if not exists idx_questoes_status on public.questoes (status, numero);

-- Busca por texto da pergunta e da resposta.
create index if not exists idx_questoes_busca
  on public.questoes using gin (to_tsvector('portuguese', pergunta || ' ' || resposta));

-- A policy antiga liberava toda questao para o anonimo.
drop policy if exists questoes_leitura on public.questoes;
create policy questoes_leitura on public.questoes for select to anon, authenticated
  using (status = 'publicado');
