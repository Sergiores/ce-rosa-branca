-- =====================================================================
-- Dar acesso ao site a quem já tem conta (na loja)
-- Schema: rosabranca            Banco compartilhado com a loja em produção
-- Escrito em 13/10/2026 para aplicação manual no SQL Editor
-- =====================================================================
--
-- O CASO: janei@personalclick.com.br já tem conta, criada pela loja. O
-- login (auth.users) é o mesmo para os dois sistemas, então o convite da
-- Casa é recusado: "já existe um usuário com este e-mail". O que falta a
-- ela é só o perfil em rosabranca.profiles.
--
-- A SOLUÇÃO: uma função que acha a conta pelo e-mail e cria o perfil aqui.
-- O convite passa a chamá-la sozinho quando o e-mail já existe.
--
-- Por que função e não a chave de administrador no app: achar conta por
-- e-mail exige ler auth.users, e a regra do projeto é não abrir um terceiro
-- uso da service role. A função faz UMA coisa, e só para a diretoria.
--
-- Aditivo: cria uma função. Não altera tabela, policy nem trigger. Lê
-- `auth.users` (só leitura) e escreve só em rosabranca.profiles.


-- ---------------------------------------------------------------------
-- PASSO 0 — Conferência. Só lê.
-- ---------------------------------------------------------------------

-- A conta existe, e ainda não tem perfil na Casa.
select u.id,
       u.email,
       u.raw_user_meta_data->>'projeto' as criada_por,
       exists (select 1 from rosabranca.profiles p where p.id = u.id) as ja_tem_perfil_na_casa
  from auth.users u
 where lower(u.email) = 'janei@personalclick.com.br';


-- ---------------------------------------------------------------------
-- PASSO 1 — A função
-- ---------------------------------------------------------------------

create or replace function rosabranca.conceder_acesso_conta_existente(
  p_email text,
  p_nome  text,
  p_role  rosabranca.papel_usuario
)
returns table (user_id uuid, situacao text)
language plpgsql
security definer
set search_path to 'rosabranca'
as $function$
declare
  v_id uuid;
begin
  -- Só a diretoria. Sem esta linha, qualquer pessoa logada poderia dar a si
  -- mesma (ou a qualquer conta da loja) um perfil aqui.
  if not coalesce(rosabranca.eh_diretoria(), false) then
    raise exception 'Apenas a diretoria pode conceder acesso.'
      using errcode = '42501';
  end if;

  -- Visitante nasce sozinho pelo cadastro do site; não é concedido.
  if p_role::text = 'visitante' then
    raise exception 'Perfil inválido para concessão.' using errcode = '22023';
  end if;

  select u.id into v_id
    from auth.users u
   where lower(u.email) = lower(trim(p_email))
   limit 1;

  if v_id is null then
    return query select null::uuid, 'nao_encontrado'::text;
    return;
  end if;

  if exists (select 1 from rosabranca.profiles p where p.id = v_id) then
    return query select v_id, 'ja_tinha'::text;
    return;
  end if;

  insert into rosabranca.profiles (id, nome, email, role)
  values (v_id, coalesce(nullif(trim(p_nome), ''), ''), lower(trim(p_email)), p_role);

  -- O gatilho de auditoria de profiles registra este insert com quem fez.
  return query select v_id, 'criado'::text;
end $function$;

-- O Postgres concede EXECUTE a PUBLIC em função nova. Revogar primeiro.
revoke execute on function rosabranca.conceder_acesso_conta_existente(text, text, rosabranca.papel_usuario)
  from public, anon;
grant execute on function rosabranca.conceder_acesso_conta_existente(text, text, rosabranca.papel_usuario)
  to authenticated;


-- ---------------------------------------------------------------------
-- Final
-- ---------------------------------------------------------------------
notify pgrst, 'reload schema';

-- Depois de rodar: convide a Janei de novo pela tela de Usuários. O convite
-- vai perceber que a conta existe e conceder o acesso no lugar de recusar.


-- ---------------------------------------------------------------------
-- Desfazer
-- ---------------------------------------------------------------------
--   drop function if exists rosabranca.conceder_acesso_conta_existente(text, text, rosabranca.papel_usuario);
