"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";
import { exigirTela } from "@/lib/auth/permissoes";
import type { Resultado } from "@/lib/gestao/acoes-conteudo";

function texto(dados: FormData, campo: string) {
  const v = dados.get(campo);
  return typeof v === "string" ? v.trim() : "";
}

export async function proximoNumeroAta(ano: number) {
  await exigirTela("atas");
  const supabase = await criarClienteServidor();
  const { data } = await supabase.rpc("proximo_numero_ata", { p_ano: ano });
  return (data as number) ?? 1;
}

export async function salvarAta(_estado: Resultado, dados: FormData): Promise<Resultado> {
  await exigirTela("atas", true);
  const supabase = await criarClienteServidor();

  const id = texto(dados, "id");
  const titulo = texto(dados, "titulo");
  const dataReuniao = texto(dados, "data_reuniao");
  const numero = Number(texto(dados, "numero"));
  const ano = Number(texto(dados, "ano"));

  if (!titulo || !dataReuniao || !Number.isInteger(numero) || !Number.isInteger(ano)) {
    return { erro: "Informe número, ano, data da reunião e título." };
  }

  const aprovar = texto(dados, "acao") === "publicar";
  const { data: usuario } = await supabase.auth.getUser();

  const registro = {
    numero,
    ano,
    data_reuniao: dataReuniao,
    tipo: texto(dados, "tipo") || "ordinaria",
    titulo,
    pauta: texto(dados, "pauta") || null,
    deliberacoes: texto(dados, "deliberacoes") || null,
    participantes: texto(dados, "participantes") || null,
    visivel_voluntarios: dados.get("visivel_voluntarios") === "on",
    status: aprovar ? ("aprovada" as const) : ("rascunho" as const),
    aprovada_por: aprovar ? (usuario.user?.id ?? null) : null,
    aprovada_em: aprovar ? new Date().toISOString() : null,
    atualizado_em: new Date().toISOString(),
  };

  let idFinal = id;

  if (id) {
    const { error } = await supabase.from("atas").update(registro).eq("id", id);
    if (error) {
      return {
        erro:
          error.code === "23505"
            ? "Já existe uma ata com esse número neste ano."
            : error.message,
      };
    }
  } else {
    const { data, error } = await supabase
      .from("atas")
      .insert({ ...registro, autor_id: usuario.user?.id ?? null })
      .select("id")
      .single();
    if (error) {
      return {
        erro:
          error.code === "23505"
            ? "Já existe uma ata com esse número neste ano."
            : error.message,
      };
    }
    idFinal = data.id as string;
  }

  revalidatePath("/gestao/atas");
  redirect(`/gestao/atas/${idFinal}?salvo=1`);
}

/** Reabre uma ata aprovada para correção. A trigger no banco bloqueia edição direta. */
export async function reabrirAta(id: string) {
  await exigirTela("atas", true);
  const supabase = await criarClienteServidor();
  await supabase
    .from("atas")
    .update({ status: "rascunho", aprovada_em: null, aprovada_por: null })
    .eq("id", id);
  revalidatePath("/gestao/atas");
  revalidatePath(`/gestao/atas/${id}`);
}

export async function excluirAta(id: string) {
  await exigirTela("atas", true);
  const supabase = await criarClienteServidor();
  await supabase.from("atas").delete().eq("id", id);
  revalidatePath("/gestao/atas");
  redirect("/gestao/atas");
}

/** Exclusao a partir da lista: apenas atualiza a propria lista, sem redirecionar. */
export async function excluirAtaDaLista(dados: FormData) {
  await exigirTela("atas", true);
  const supabase = await criarClienteServidor();
  await supabase.from("atas").delete().eq("id", String(dados.get("id")));
  revalidatePath("/gestao/atas");
}
