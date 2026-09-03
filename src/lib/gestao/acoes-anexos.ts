"use server";

import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/supabase/server";
import { exigirSessao } from "@/lib/auth/permissoes";
import type { Anexo, EntidadeAnexo } from "@/lib/tipos";

const MIMES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];
const LIMITE = 20 * 1024 * 1024;

export async function listarAnexos(entidade: EntidadeAnexo, entidadeId: string) {
  await exigirSessao();
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("anexos")
    .select("*")
    .eq("entidade", entidade)
    .eq("entidade_id", entidadeId)
    .order("criado_em");
  return (data ?? []) as Anexo[];
}

/** Registra o anexo depois do upload no bucket privado. */
export async function registrarAnexo(dados: {
  entidade: EntidadeAnexo;
  entidadeId: string;
  nomeArquivo: string;
  mime: string;
  tamanho: number;
  storagePath: string;
}) {
  await exigirSessao();

  if (!MIMES.includes(dados.mime)) {
    return { erro: "Tipo de arquivo não permitido." };
  }
  if (dados.tamanho <= 0 || dados.tamanho > LIMITE) {
    return { erro: "O arquivo deve ter até 20 MB." };
  }

  const supabase = await criarClienteServidor();
  const { data: usuario } = await supabase.auth.getUser();

  const { error } = await supabase.from("anexos").insert({
    entidade: dados.entidade,
    entidade_id: dados.entidadeId,
    nome_arquivo: dados.nomeArquivo,
    mime: dados.mime,
    tamanho: dados.tamanho,
    storage_path: dados.storagePath,
    enviado_por: usuario.user?.id ?? null,
  });

  if (error) return { erro: error.message };

  revalidatePath("/gestao");
  return { ok: true };
}

/** Gera uma URL assinada de curta duração. Anexos nunca são públicos. */
export async function urlAssinada(anexoId: string) {
  await exigirSessao();
  const supabase = await criarClienteServidor();

  const { data: anexo } = await supabase
    .from("anexos")
    .select("storage_path")
    .eq("id", anexoId)
    .maybeSingle();
  if (!anexo) return { erro: "Anexo não encontrado." };

  const { data, error } = await supabase.storage
    .from("anexos")
    .createSignedUrl(anexo.storage_path as string, 120);

  if (error || !data) return { erro: error?.message ?? "Não foi possível gerar o link." };
  return { url: data.signedUrl };
}

export async function excluirAnexo(anexoId: string) {
  await exigirSessao();
  const supabase = await criarClienteServidor();

  const { data: anexo } = await supabase
    .from("anexos")
    .select("storage_path")
    .eq("id", anexoId)
    .maybeSingle();
  if (!anexo) return { erro: "Anexo não encontrado." };

  await supabase.storage.from("anexos").remove([anexo.storage_path as string]);
  const { error } = await supabase.from("anexos").delete().eq("id", anexoId);
  if (error) return { erro: error.message };

  revalidatePath("/gestao");
  return { ok: true };
}
