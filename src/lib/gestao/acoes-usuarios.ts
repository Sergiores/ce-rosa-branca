"use server";

import { revalidatePath } from "next/cache";
import { criarClienteAdmin, criarClienteServidor } from "@/lib/supabase/server";
import { exigirTela } from "@/lib/auth/permissoes";
import type { Papel } from "@/lib/tipos";
import type { Resultado } from "@/lib/gestao/acoes-conteudo";

const PAPEIS: Papel[] = ["diretoria", "voluntario", "aluno", "membro"];

function texto(dados: FormData, campo: string) {
  const v = dados.get(campo);
  return typeof v === "string" ? v.trim() : "";
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

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { nome },
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
  }

  revalidatePath("/gestao/usuarios");
  return { ok: true };
}

export async function alterarPapel(dados: FormData) {
  await exigirTela("usuarios", true);
  const id = texto(dados, "id");
  const role = texto(dados, "role") as Papel;
  if (!id || !PAPEIS.includes(role)) return;

  const supabase = await criarClienteServidor();
  await supabase.from("profiles").update({ role, atualizado_em: new Date().toISOString() }).eq("id", id);
  revalidatePath("/gestao/usuarios");
}

export async function alternarAtivo(dados: FormData) {
  await exigirTela("usuarios", true);
  const id = texto(dados, "id");
  const ativo = dados.get("ativo") === "1";

  const supabase = await criarClienteServidor();
  await supabase
    .from("profiles")
    .update({ ativo, atualizado_em: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/gestao/usuarios");
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
