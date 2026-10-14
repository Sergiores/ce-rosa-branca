"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { criarClienteAdmin, criarClienteServidor } from "@/lib/supabase/server";
import { SCHEMA_DB } from "@/lib/supabase/schema";
import { exigirTela } from "@/lib/auth/permissoes";
import type { Papel } from "@/lib/tipos";
import type { Resultado } from "@/lib/gestao/acoes-conteudo";
import { acessosDoPapel } from "@/lib/gestao/permissoes-usuario";
import { TELAS } from "@/lib/auth/telas";

const PAPEIS: Papel[] = ["diretoria", "voluntario", "aluno", "membro"];

function texto(dados: FormData, campo: string) {
  const v = dados.get(campo);
  return typeof v === "string" ? v.trim() : "";
}

/**
 * Grava as excecoes de tela de uma pessoa, comparando o pedido com a matriz
 * do papel. So o que DIFERE vira linha.
 *
 * Isso importa: se gravassemos tudo, a pessoa ficaria congelada na matriz do
 * dia em que foi convidada, e ajuste futuro no papel nunca mais a alcancaria.
 */
async function gravarExcecoes(
  supabase: Awaited<ReturnType<typeof criarClienteServidor>>,
  userId: string,
  papel: Papel,
  dados: FormData,
  definidoPor: string | null,
) {
  const doPapel = await acessosDoPapel(papel);

  const excecoes = TELAS.flatMap((t) => {
    const ver = dados.get(`ver:${t.chave}`) === "on";
    const editarPedido = dados.get(`editar:${t.chave}`) === "on";
    // Editar sem ver nao faz sentido e confundiria a leitura da tela.
    const editar = ver && editarPedido;

    const base = doPapel.get(t.chave);
    if (ver === (base?.ver ?? false) && editar === (base?.editar ?? false)) return [];

    return [
      {
        user_id: userId,
        tela_key: t.chave,
        ver,
        editar,
        definido_por: definidoPor,
        atualizado_em: new Date().toISOString(),
      },
    ];
  });

  // Troca o conjunto inteiro: o que saiu da lista volta a seguir o papel.
  await supabase.from("permissoes_usuario").delete().eq("user_id", userId);
  if (excecoes.length > 0) {
    await supabase.from("permissoes_usuario").insert(excecoes);
  }

  return excecoes.length;
}

/** Convida um usuário por e-mail. Não existe auto-cadastro público. */
export async function convidarUsuario(_estado: Resultado, dados: FormData): Promise<Resultado> {
  await exigirTela("usuarios", true);

  const email = texto(dados, "email").toLowerCase();
  const nome = texto(dados, "nome");
  const role = texto(dados, "role") as Papel;

  if (!email || !nome) return { erro: "Informe o nome e o e-mail." };
  if (!PAPEIS.includes(role)) return { erro: "Perfil de acesso inválido." };
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { erro: "SUPABASE_SERVICE_ROLE_KEY não configurada no ambiente." };
  }

  const admin = criarClienteAdmin();
  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/definir-senha`;

  // `projeto` e obrigatorio: auth.users e compartilhado com os outros
  // projetos deste banco, e a trigger so cria o perfil aqui quando o
  // metadata marca este schema. Sem isso, o convite cria a conta e o
  // usuario fica sem perfil, incapaz de entrar.
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { nome, projeto: SCHEMA_DB },
    redirectTo,
  });

  if (error) {
    return {
      erro: error.message.includes("already")
        ? "Já existe um usuário com este e-mail."
        : error.message,
    };
  }

  // O papel e definido aqui, pelo servidor. A trigger no banco sempre cria o
  // usuario como 'membro' — o metadata do proprio usuario nunca decide o papel.
  if (data?.user?.id) {
    const supabase = await criarClienteServidor();
    const { error: erroPapel } = await supabase
      .from("profiles")
      .update({ nome, role, atualizado_em: new Date().toISOString() })
      .eq("id", data.user.id);
    if (erroPapel) return { erro: `Convite enviado, mas o perfil não foi definido: ${erroPapel.message}` };

    // Acessos escolhidos no proprio convite. Falhar aqui nao desfaz o
    // convite — a pessoa entra com o padrao do papel e a diretoria ajusta
    // depois na ficha dela.
    const { data: quemConvidou } = await supabase.auth.getUser();
    await gravarExcecoes(supabase, data.user.id, role, dados, quemConvidou.user?.id ?? null);
  }

  revalidatePath("/gestao/usuarios");
  redirect("/gestao/usuarios?convidado=1");
}

/**
 * Troca o papel de um usuario.
 *
 * Devolve o erro em vez de engolir: antes, se o banco recusasse, a tela so
 * recarregava com o papel antigo e ninguem sabia por que.
 *
 * O `.select()` depois do update existe porque o RLS nao gera erro quando
 * barra um update — ele simplesmente nao altera linha nenhuma. Sem conferir
 * quantas linhas voltaram, uma recusa de permissao pareceria sucesso.
 */
export async function alterarPapel(_estado: Resultado, dados: FormData): Promise<Resultado> {
  await exigirTela("usuarios", true);
  const id = texto(dados, "id");
  const role = texto(dados, "role") as Papel;
  if (!id) return { erro: "Usuário não informado." };
  if (!PAPEIS.includes(role)) return { erro: "Perfil de acesso inválido." };

  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("profiles")
    .update({ role, atualizado_em: new Date().toISOString() })
    .eq("id", id)
    .select("id");

  if (error) return { erro: `O banco recusou: ${error.message}` };
  if (!data || data.length === 0) {
    return {
      erro: "Nada foi alterado: o banco não deixou esta conta editar o perfil de outra pessoa.",
    };
  }

  revalidatePath("/gestao/usuarios");
  return { ok: true };
}

/** Ativa ou desativa um usuario. Mesmo cuidado de alterarPapel com a recusa silenciosa. */
export async function alternarAtivo(_estado: Resultado, dados: FormData): Promise<Resultado> {
  await exigirTela("usuarios", true);
  const id = texto(dados, "id");
  const ativo = dados.get("ativo") === "1";
  if (!id) return { erro: "Usuário não informado." };

  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("profiles")
    .update({ ativo, atualizado_em: new Date().toISOString() })
    .eq("id", id)
    .select("id");

  if (error) return { erro: `O banco recusou: ${error.message}` };
  if (!data || data.length === 0) {
    return {
      erro: "Nada foi alterado: o banco não deixou esta conta editar o perfil de outra pessoa.",
    };
  }

  revalidatePath("/gestao/usuarios");
  return { ok: true };
}

/** Salva a matriz de permissões por tela. */
export async function salvarPermissoes(dados: FormData) {
  await exigirTela("permissoes", true);
  const supabase = await criarClienteServidor();

  const linhas = String(dados.get("linhas") ?? "")
    .split(",")
    .filter(Boolean);

  const registros = linhas.map((chave) => {
    const [role, tela_key] = chave.split("|");
    return {
      role,
      tela_key,
      ver: dados.get(`ver:${chave}`) === "on",
      editar: dados.get(`editar:${chave}`) === "on",
    };
  });

  if (registros.length > 0) {
    await supabase.from("permissoes").upsert(registros, { onConflict: "role,tela_key" });
  }

  revalidatePath("/gestao/permissoes");
  revalidatePath("/gestao");
}

/* -------------------------------------------------- Permissoes por usuario */

/**
 * Grava as excecoes de tela de uma pessoa.
 *
 * O formulario manda o estado desejado de TODAS as telas. Aqui comparamos
 * com a matriz do papel e gravamos so o que difere — por isso a tabela fica
 * pequena e, principalmente, por isso mudar a matriz do papel continua
 * valendo para quem nao tem excecao daquela tela.
 *
 * Se gravassemos tudo, a primeira vez que alguem abrisse esta tela a pessoa
 * ficaria congelada na matriz daquele dia, e ajustes futuros no papel nunca
 * mais a alcancariam.
 */
export async function salvarAcessosDoUsuario(dados: FormData): Promise<void> {
  await exigirTela("usuarios", true);

  const userId = texto(dados, "user_id");
  const papel = texto(dados, "role") as Papel;
  if (!userId || !PAPEIS.includes(papel)) return;

  const supabase = await criarClienteServidor();
  const { data: usuario } = await supabase.auth.getUser();

  await gravarExcecoes(supabase, userId, papel, dados, usuario.user?.id ?? null);

  revalidatePath("/gestao", "layout");
  revalidatePath("/gestao/usuarios");
  redirect("/gestao/usuarios?acessos=1");
}

/* -------------------------------------------------- Redefinir senha */

/**
 * A diretoria define a senha de outra pessoa.
 *
 * SEGUNDO uso de criarClienteAdmin() no projeto, autorizado pelo dono do
 * sistema em 13/10/2026 (AGENTS.md, regra 4). A service role alcanca
 * `auth.users` inteiro, que e COMPARTILHADO com a loja: sem as travas abaixo,
 * esta acao trocaria a senha de cliente ou do administrador da loja.
 *
 * Travas, todas antes de tocar em auth.users:
 *   1. quem chama precisa ser diretoria E poder editar Usuarios;
 *   2. o alvo precisa ter perfil em rosabranca.profiles — conta so da loja
 *      nao tem, e e recusada;
 *   3. a auditoria e gravada ANTES da troca. Se nao der para registrar, a
 *      senha nao e trocada: nunca existe troca sem rastro.
 *
 * A senha nunca e gravada em lugar nenhum, nem na auditoria.
 */
export async function redefinirSenha(_estado: Resultado, dados: FormData): Promise<Resultado> {
  // Trava 1
  const sessao = await exigirTela("usuarios", true);
  if (sessao.perfil.role !== "diretoria") {
    return { erro: "Só a diretoria pode redefinir senha de outra pessoa." };
  }

  const alvoId = texto(dados, "id");
  const senha = typeof dados.get("senha") === "string" ? String(dados.get("senha")) : "";
  const confirmacao =
    typeof dados.get("confirmacao") === "string" ? String(dados.get("confirmacao")) : "";

  if (!alvoId) return { erro: "Usuário não informado." };
  if (senha.length < 8) return { erro: "A senha deve ter ao menos 8 caracteres." };
  if (senha !== confirmacao) return { erro: "As senhas não conferem." };
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { erro: "SUPABASE_SERVICE_ROLE_KEY não configurada no ambiente." };
  }

  const admin = criarClienteAdmin();

  // Trava 2: o cliente admin declara o schema rosabranca, entao isto le
  // rosabranca.profiles — nunca public.profiles, que e da loja.
  const { data: alvo } = await admin
    .from("profiles")
    .select("id, nome, email")
    .eq("id", alvoId)
    .maybeSingle();
  if (!alvo) {
    return { erro: "Esta conta não pertence a este sistema. A senha não foi alterada." };
  }

  // Trava 3: registra antes de trocar.
  const { error: erroAuditoria } = await admin.from("auditoria").insert({
    tabela: "auth.users",
    registro_id: alvoId,
    acao: "UPDATE",
    autor_id: sessao.perfil.id,
    autor_email: sessao.perfil.email,
    dados_antes: null,
    dados_depois: {
      evento: "senha redefinida pela diretoria",
      usuario: alvo.email ?? alvo.nome ?? alvoId,
    },
  });
  if (erroAuditoria) {
    return {
      erro: `A senha NÃO foi alterada: não foi possível registrar na auditoria (${erroAuditoria.message}).`,
    };
  }

  const { error } = await admin.auth.admin.updateUserById(alvoId, { password: senha });
  if (error) {
    // O registro acima ficou dizendo que houve troca; corrige com um segundo.
    await admin.from("auditoria").insert({
      tabela: "auth.users",
      registro_id: alvoId,
      acao: "UPDATE",
      autor_id: sessao.perfil.id,
      autor_email: sessao.perfil.email,
      dados_antes: null,
      dados_depois: { evento: "redefinição de senha FALHOU", motivo: error.message },
    });
    return { erro: `Não foi possível alterar a senha: ${error.message}` };
  }

  revalidatePath("/gestao/usuarios");
  redirect("/gestao/usuarios?senha=1");
}
