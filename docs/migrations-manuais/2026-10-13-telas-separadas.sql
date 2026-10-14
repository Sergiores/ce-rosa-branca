-- =====================================================================
-- Permissão por tela dentro de Conteúdo e da Área de estudos
-- Schema: rosabranca            Banco compartilhado com a loja em produção
-- Escrito em 13/10/2026 para aplicação manual no SQL Editor
-- =====================================================================
--
-- Hoje seis telas respondem a UMA chave, `conteudo`: notícias, mensagem do
-- dia, eventos, projetos, páginas institucionais e o Livro dos Espíritos.
-- E duas respondem a `estudos`: turmas e alunos. Quem vê uma, vê todas.
--
-- Este arquivo cria uma chave para cada tela e copia para ela o acesso que
-- a chave-mãe tem HOJE. Resultado: no dia em que rodar, ninguém ganha nem
-- perde nada. A diferença é que, daí em diante, dá para ajustar tela por
-- tela.
--
-- SÓ DADOS. Nenhuma tabela, coluna, função ou policy muda — são linhas a
-- mais em `permissoes` e `permissoes_usuario`. Não toca `public`, `auth`
-- ou `storage`.
--
-- ORDEM IMPORTANTE: rode ANTES de o código novo ir ao ar. O código novo
-- procura as chaves novas; sem estas linhas, Conteúdo e Estudos somem do
-- menu de todo mundo, diretoria inclusive.


-- ---------------------------------------------------------------------
-- PASSO 0 — Conferência. Só lê.
-- ---------------------------------------------------------------------
-- O acesso de hoje às duas chaves-mãe, por papel. É isto que será copiado.

select role::text as papel, tela_key, ver, editar
  from rosabranca.permissoes
 where tela_key in ('conteudo', 'estudos')
 order by tela_key, role::text;


-- ---------------------------------------------------------------------
-- PASSO 1 — Matriz por papel: uma linha por tela nova
-- ---------------------------------------------------------------------
-- Cada tela-filha nasce com o mesmo ver/editar que a mãe tem hoje.
-- `on conflict do nothing`: rodar duas vezes não estraga nada.

insert into rosabranca.permissoes (role, tela_key, ver, editar)
select p.role, filha.tela_key, p.ver, p.editar
  from rosabranca.permissoes p
  cross join (values
    ('conteudo_noticias'),
    ('conteudo_mensagens'),
    ('conteudo_eventos'),
    ('conteudo_projetos'),
    ('conteudo_paginas'),
    ('conteudo_livro')
  ) as filha(tela_key)
 where p.tela_key = 'conteudo'
on conflict (role, tela_key) do nothing;

insert into rosabranca.permissoes (role, tela_key, ver, editar)
select p.role, filha.tela_key, p.ver, p.editar
  from rosabranca.permissoes p
  cross join (values
    ('estudos_turmas'),
    ('estudos_alunos')
  ) as filha(tela_key)
 where p.tela_key = 'estudos'
on conflict (role, tela_key) do nothing;


-- ---------------------------------------------------------------------
-- PASSO 2 — Exceções por pessoa que já existirem
-- ---------------------------------------------------------------------
-- Se alguém já ajustou "Conteúdo" para uma pessoa específica, o ajuste
-- passa para cada tela-filha. Sem isso, a exceção ficaria presa numa chave
-- que o código novo não consulta mais e se perderia sem aviso.

insert into rosabranca.permissoes_usuario
       (user_id, tela_key, ver, editar, definido_por, atualizado_em)
select u.user_id, filha.tela_key, u.ver, u.editar, u.definido_por, now()
  from rosabranca.permissoes_usuario u
  cross join (values
    ('conteudo_noticias'),
    ('conteudo_mensagens'),
    ('conteudo_eventos'),
    ('conteudo_projetos'),
    ('conteudo_paginas'),
    ('conteudo_livro')
  ) as filha(tela_key)
 where u.tela_key = 'conteudo'
on conflict (user_id, tela_key) do nothing;

insert into rosabranca.permissoes_usuario
       (user_id, tela_key, ver, editar, definido_por, atualizado_em)
select u.user_id, filha.tela_key, u.ver, u.editar, u.definido_por, now()
  from rosabranca.permissoes_usuario u
  cross join (values
    ('estudos_turmas'),
    ('estudos_alunos')
  ) as filha(tela_key)
 where u.tela_key = 'estudos'
on conflict (user_id, tela_key) do nothing;


-- ---------------------------------------------------------------------
-- Conferência final
-- ---------------------------------------------------------------------
-- Cada papel deve ter as 8 telas novas, com o mesmo ver/editar da mãe.

select role::text as papel,
       count(*) filter (where tela_key like 'conteudo\_%') as telas_conteudo,
       count(*) filter (where tela_key like 'estudos\_%')  as telas_estudos
  from rosabranca.permissoes
 group by role::text
 order by role::text;
-- Esperado: telas_conteudo = 6 e telas_estudos = 2 em todas as linhas.


-- ---------------------------------------------------------------------
-- Desfazer
-- ---------------------------------------------------------------------
-- Só depois de voltar o código anterior; com o código novo no ar, apagar
-- estas linhas tira Conteúdo e Estudos do menu de todo mundo.
--
--   delete from rosabranca.permissoes_usuario
--    where tela_key like 'conteudo\_%' or tela_key like 'estudos\_%';
--   delete from rosabranca.permissoes
--    where tela_key like 'conteudo\_%' or tela_key like 'estudos\_%';
