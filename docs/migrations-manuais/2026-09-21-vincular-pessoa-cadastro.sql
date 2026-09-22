-- =====================================================================
-- Trazer o cadastro do usuário para aluno e membro (evitar redigitação)
-- Schema: rosabranca            Banco compartilhado com a loja em produção
-- Escrito em 21/09/2026 para aplicação manual no SQL Editor
-- =====================================================================
--
-- Hoje, cadastrar um aluno ou um membro exige redigitar nome, e-mail e
-- telefone que já existem em `profiles`. As duas tabelas já têm
-- `profile_id` — só faltava a interface trazer os dados.
--
-- O obstáculo é o RLS de `profiles`:
--
--   profiles_select: using (id = auth.uid() or eh_diretoria())
--
-- Ou seja, um VOLUNTÁRIO não lista `profiles`. Um seletor que lesse a
-- tabela direto viria vazio para ele — e vazio em silêncio, que é o pior
-- jeito de falhar. Por isso a função abaixo, que devolve só o que o
-- seletor precisa e checa o papel de quem chama.
--
-- Um passo só, aditivo. Não altera nem apaga nada.


-- ---------------------------------------------------------------------
-- PASSO 0 — Conferência. Só lê.
-- ---------------------------------------------------------------------

-- Confirma que as duas tabelas de destino já têm a coluna de vínculo.
select table_name, column_name
  from information_schema.columns
 where table_schema = 'rosabranca'
   and column_name = 'profile_id'
   and table_name in ('membros', 'estudo_alunos')
 order by table_name;


-- ---------------------------------------------------------------------
-- PASSO 1 — Pessoas disponíveis para vincular
-- ---------------------------------------------------------------------
-- Devolve as contas que ainda NÃO estão ligadas a um cadastro do destino
-- pedido. Filtrar os já vinculados evita que a mesma pessoa seja escolhida
-- duas vezes e o índice único devolva erro cru na cara de quem cadastra.
--
-- Não filtra por papel de propósito: quem se cadastra sozinho no site nasce
-- 'visitante', quem é convidado pode ser 'membro' — filtrar só por 'aluno'
-- devolveria uma lista quase vazia e pareceria defeito. O papel vai junto,
-- como dica na tela.

create or replace function rosabranca.pessoas_vinculaveis(p_destino text)
returns table (id uuid, nome text, email text, telefone text, papel text)
language plpgsql
stable
security definer
set search_path to 'rosabranca'
as $function$
begin
  -- A função enxerga `profiles` inteiro porque roda como dona. A trava é
  -- esta: só equipe chama, e só recebe os campos listados no retorno.
  if coalesce(rosabranca.meu_papel()::text, '') not in ('diretoria', 'voluntario') then
    return;
  end if;

  if p_destino = 'aluno' then
    return query
      select p.id, p.nome, p.email, p.telefone, p.role::text
        from rosabranca.profiles p
       where p.ativo
         and not exists (
           select 1 from rosabranca.estudo_alunos a where a.profile_id = p.id
         )
       order by p.nome;

  elsif p_destino = 'membro' then
    return query
      select p.id, p.nome, p.email, p.telefone, p.role::text
        from rosabranca.profiles p
       where p.ativo
         and not exists (
           select 1 from rosabranca.membros m where m.profile_id = p.id
         )
       order by p.nome;
  end if;
end $function$;

-- O Postgres concede EXECUTE a PUBLIC por padrão em função nova. Revogar
-- antes de conceder é a segunda camada — a primeira é a checagem de papel
-- lá dentro.
revoke execute on function rosabranca.pessoas_vinculaveis(text) from public, anon;
grant  execute on function rosabranca.pessoas_vinculaveis(text) to authenticated;

-- Confere: rodando como você (diretoria), deve listar as contas ainda sem
-- cadastro de aluno.
select * from rosabranca.pessoas_vinculaveis('aluno');


-- ---------------------------------------------------------------------
-- Final — avisar a API da função nova
-- ---------------------------------------------------------------------
notify pgrst, 'reload schema';


-- ---------------------------------------------------------------------
-- Desfazer
-- ---------------------------------------------------------------------
--   drop function if exists rosabranca.pessoas_vinculaveis(text);
