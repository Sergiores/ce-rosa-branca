-- ============================================================
-- Conferencia da instalacao. Rode no SQL Editor depois do schema.
-- Nao altera nada: apenas consulta.
-- ============================================================

-- 1) Tabelas criadas, com RLS ligado e trigger de auditoria
select
  t.tablename                                   as tabela,
  c.relrowsecurity                              as rls_ligado,
  (select count(*) from pg_policies p
    where p.schemaname = 'public' and p.tablename = t.tablename) as policies,
  exists (
    select 1 from pg_trigger tg
    where tg.tgrelid = c.oid and tg.tgname = 'trg_auditoria'
  )                                             as tem_auditoria
from pg_tables t
join pg_class c on c.relname = t.tablename and c.relnamespace = 'public'::regnamespace
where t.schemaname = 'public'
order by t.tablename;

-- Esperado: 22 tabelas, todas com rls_ligado = true.
-- tem_auditoria = false apenas em: acessos_site, visualizacoes, auditoria.

-- 2) Funcoes de apoio
select proname as funcao, prosecdef as security_definer
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in ('meu_papel','eh_diretoria','fn_auditoria','aplicar_auditoria',
                  'registrar_acesso','registrar_visualizacao','proximo_numero_ata',
                  'lancar_documento','gerar_mensalidades','fn_valida_baixa',
                  'fn_baixa_append_only','fn_ata_imutavel','fn_novo_usuario')
order by proname;
-- Esperado: 13 funcoes.

-- 3) Views de leitura
select table_name from information_schema.views
where table_schema = 'public' order by table_name;
-- Esperado: v_acessos_dia, v_noticias_mais_vistas, v_paginas_populares,
--           v_titulos_saldo, v_visualizacoes_dia

-- 4) Buckets de arquivos
select id, public, file_size_limit from storage.buckets where id in ('midia','anexos');
-- Esperado: midia public = true / anexos public = false

-- 5) Permissoes iniciais por perfil
select role, count(*) filter (where ver) as telas_visiveis
from public.permissoes group by role order by role;
-- Esperado: diretoria 12, voluntario 2, aluno 1, membro 1.
