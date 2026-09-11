-- ============================================================
-- Teste de ponta a ponta do financeiro e do RLS.
--
-- Roda inteiro dentro de uma transacao com ROLLBACK no fim:
-- NADA fica gravado no banco.
--
-- Antes de rodar, troque os dois UUIDs abaixo:
--   :diretoria_id -> id do usuario com role 'diretoria'
--   :membro_id    -> id de um usuario com role 'membro'
-- Pegue os ids em: select id, email, role from public.profiles;
-- ============================================================

begin;

-- ---------- ajuste aqui ----------
create temp table _ctx (diretoria uuid, membro uuid) on commit drop;
insert into _ctx values (
  'COLE-AQUI-O-UUID-DA-DIRETORIA'::uuid,
  'COLE-AQUI-O-UUID-DO-MEMBRO'::uuid
);
-- ---------------------------------

create temp table _resultado (etapa text, esperado text, obtido text, ok boolean)
  on commit drop;

-- As tabelas temporarias sao gravadas tambem enquanto o teste assume os papeis
-- authenticated e anon, entao precisam ser acessiveis por eles.
grant all on _resultado to authenticated, anon;
grant all on _ctx to authenticated, anon;

do $teste$
declare
  v_dir      uuid;
  v_membro   uuid;
  v_doc      uuid;
  v_titulo   uuid;
  v_membro_r uuid;
  v_n        int;
  v_valor    numeric;
  v_status   text;
  v_erro     text;
begin
  select diretoria, membro into v_dir, v_membro from _ctx;

  -- Assume a identidade da diretoria (mesmo caminho que o app usa)
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_dir, 'role', 'authenticated')::text, true);

  insert into _resultado values
    ('papel reconhecido', 'diretoria', coalesce(public.meu_papel()::text, 'NULO'),
     public.meu_papel() = 'diretoria');

  -- ---------- 1. Nota a prazo em 3 parcelas ----------
  v_doc := public.lancar_documento(
    'entrada', current_date, 'TESTE-001', 'Fornecedor de Teste',
    'Compra de teste', 'prazo',
    '[{"descricao_produto":"Livros","quantidade":10,"valor_unitario":30.00}]'::jsonb,
    format('[{"vencimento":"%s","valor":100.00},
             {"vencimento":"%s","valor":100.00},
             {"vencimento":"%s","valor":100.00}]',
           current_date + 30, current_date + 60, current_date + 90)::jsonb
  );

  select count(*) into v_n from public.titulos where documento_id = v_doc;
  insert into _resultado values ('duplicatas geradas', '3', v_n::text, v_n = 3);

  select sum(valor) into v_valor from public.titulos where documento_id = v_doc;
  insert into _resultado values ('soma das parcelas', '300.00', v_valor::text, v_valor = 300);

  select valor_total into v_valor from public.documentos where id = v_doc;
  insert into _resultado values ('total do documento', '300.00', v_valor::text, v_valor = 300);

  -- ---------- 2. Soma das parcelas divergente deve ser recusada ----------
  begin
    perform public.lancar_documento(
      'entrada', current_date, 'TESTE-002', 'Fornecedor de Teste',
      'Divergente', 'prazo',
      '[{"descricao_produto":"X","quantidade":1,"valor_unitario":100.00}]'::jsonb,
      format('[{"vencimento":"%s","valor":50.00}]', current_date + 30)::jsonb
    );
    insert into _resultado values ('parcelas divergentes', 'recusado', 'ACEITOU', false);
  exception when others then
    insert into _resultado values ('parcelas divergentes', 'recusado', 'recusado', true);
  end;

  -- ---------- 3. Baixa parcial ----------
  select id into v_titulo from public.titulos
   where documento_id = v_doc and parcela = 1;

  insert into public.baixas (titulo_id, valor, forma) values (v_titulo, 40.00, 'pix');

  select saldo, status into v_valor, v_status
    from public.v_titulos_saldo where id = v_titulo;
  insert into _resultado values ('saldo apos baixa parcial', '60.00', v_valor::text, v_valor = 60);
  insert into _resultado values ('situacao apos baixa parcial', 'parcial', v_status, v_status = 'parcial');

  -- ---------- 4. Baixa acima do saldo deve ser recusada ----------
  begin
    insert into public.baixas (titulo_id, valor, forma) values (v_titulo, 999.00, 'pix');
    insert into _resultado values ('baixa acima do saldo', 'recusado', 'ACEITOU', false);
  exception when others then
    insert into _resultado values ('baixa acima do saldo', 'recusado', 'recusado', true);
  end;

  -- ---------- 5. Quitacao ----------
  insert into public.baixas (titulo_id, valor, forma) values (v_titulo, 60.00, 'pix');
  select saldo, status into v_valor, v_status
    from public.v_titulos_saldo where id = v_titulo;
  insert into _resultado values ('saldo apos quitar', '0.00', v_valor::text, v_valor = 0);
  insert into _resultado values ('situacao apos quitar', 'pago', v_status, v_status = 'pago');

  -- ---------- 6. Baixa e append-only ----------
  begin
    update public.baixas set valor = 1 where titulo_id = v_titulo;
    insert into _resultado values ('editar baixa', 'recusado', 'ACEITOU', false);
  exception when others then
    insert into _resultado values ('editar baixa', 'recusado', 'recusado', true);
  end;

  -- ---------- 7. Estorno ----------
  insert into public.baixas (titulo_id, valor, forma, observacao)
  values (v_titulo, -60.00, 'estorno', 'teste');
  select saldo into v_valor from public.v_titulos_saldo where id = v_titulo;
  insert into _resultado values ('saldo apos estorno', '60.00', v_valor::text, v_valor = 60);

  -- ---------- 8. Mensalidade idempotente ----------
  insert into public.membros (nome, ativo) values ('Membro de Teste', true)
    returning id into v_membro_r;
  insert into public.membro_mensalidade (membro_id, valor, dia_vencimento, ativo)
    values (v_membro_r, 50.00, 10, true);

  perform public.gerar_mensalidades(date_trunc('month', current_date)::date);
  perform public.gerar_mensalidades(date_trunc('month', current_date)::date);
  perform public.gerar_mensalidades(date_trunc('month', current_date)::date);

  select count(*) into v_n from public.titulos
   where membro_id = v_membro_r
     and competencia = date_trunc('month', current_date)::date;
  insert into _resultado values
    ('mensalidade apos 3 execucoes', '1', v_n::text, v_n = 1);

  -- ---------- 9. Auditoria registrou ----------
  select count(*) into v_n from public.auditoria
   where tabela = 'documentos' and registro_id = v_doc::text and acao = 'INSERT';
  insert into _resultado values ('auditoria do documento', '1', v_n::text, v_n = 1);

  select count(*) into v_n from public.auditoria
   where tabela = 'baixas' and acao = 'INSERT';
  insert into _resultado values ('auditoria das baixas', '>= 3', v_n::text, v_n >= 3);

  -- ---------- 10. RLS: membro nao enxerga o financeiro ----------
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_membro, 'role', 'authenticated')::text, true);

  insert into _resultado values ('papel do membro', 'membro',
    coalesce(public.meu_papel()::text, 'NULO'), public.meu_papel() = 'membro');

  select count(*) into v_n from public.titulos;
  insert into _resultado values ('membro ve titulos', '0', v_n::text, v_n = 0);

  select count(*) into v_n from public.documentos;
  insert into _resultado values ('membro ve documentos', '0', v_n::text, v_n = 0);

  select count(*) into v_n from public.membros;
  insert into _resultado values ('membro ve cadastro de membros', '0', v_n::text, v_n = 0);

  select count(*) into v_n from public.auditoria;
  insert into _resultado values ('membro ve auditoria', '0', v_n::text, v_n = 0);

  select count(*) into v_n from public.atas;
  insert into _resultado values ('membro ve atas', '0', v_n::text, v_n = 0);

  -- ---------- 11. Membro nao pode se promover ----------
  begin
    update public.profiles set role = 'diretoria' where id = v_membro;
    select count(*) into v_n from public.profiles
     where id = v_membro and role = 'diretoria';
    insert into _resultado values ('membro se promove', 'bloqueado',
      case when v_n = 0 then 'bloqueado' else 'CONSEGUIU' end, v_n = 0);
  exception when others then
    insert into _resultado values ('membro se promove', 'bloqueado', 'bloqueado', true);
  end;

  perform set_config('role', 'postgres', true);

exception when others then
  get stacked diagnostics v_erro = message_text;
  perform set_config('role', 'postgres', true);
  insert into _resultado values ('ERRO INESPERADO', 'nenhum', v_erro, false);
end $teste$;

-- ---------- 12. Anonimo nao escreve e so le o que esta publicado ----------
do $anon$
declare v_n int; v_erro text;
begin
  -- Cria um rascunho como diretoria para checar a leitura anonima depois.
  perform set_config('role', 'postgres', true);
  insert into public.noticias (titulo, slug, corpo, status)
  values ('Rascunho de teste', 'rascunho-de-teste-xyz', 'texto', 'rascunho');

  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', null, true);

  select count(*) into v_n from public.noticias where slug = 'rascunho-de-teste-xyz';
  perform set_config('role', 'postgres', true);
  insert into _resultado values ('anonimo le rascunho', '0', v_n::text, v_n = 0);

  -- Escrita anonima deve ser recusada.
  begin
    perform set_config('role', 'anon', true);
    insert into public.noticias (titulo, slug, corpo, status)
    values ('Invasao', 'invasao-xyz', 'texto', 'publicado');
    perform set_config('role', 'postgres', true);
    insert into _resultado values ('anonimo escreve noticia', 'recusado', 'ACEITOU', false);
  exception when others then
    perform set_config('role', 'postgres', true);
    insert into _resultado values ('anonimo escreve noticia', 'recusado', 'recusado', true);
  end;

  -- Contador so pode ser gravado pela RPC, nunca por insert direto.
  begin
    perform set_config('role', 'anon', true);
    insert into public.acessos_site (path, sessao_hash) values ('/', 'hash-teste');
    perform set_config('role', 'postgres', true);
    insert into _resultado values ('anonimo insere acesso direto', 'recusado', 'ACEITOU', false);
  exception when others then
    perform set_config('role', 'postgres', true);
    insert into _resultado values ('anonimo insere acesso direto', 'recusado', 'recusado', true);
  end;

  -- Pela RPC, funciona.
  perform set_config('role', 'anon', true);
  perform public.registrar_acesso('/', 'hash-teste-rpc', null);
  perform set_config('role', 'postgres', true);
  select count(*) into v_n from public.acessos_site where sessao_hash = 'hash-teste-rpc';
  insert into _resultado values ('RPC registra acesso', '1', v_n::text, v_n = 1);

exception when others then
  get stacked diagnostics v_erro = message_text;
  perform set_config('role', 'postgres', true);
  insert into _resultado values ('ERRO INESPERADO (anonimo)', 'nenhum', v_erro, false);
end $anon$;

select
  case when ok then 'OK' else 'FALHOU' end as resultado,
  etapa, esperado, obtido
from _resultado
order by ok, etapa;

rollback;
