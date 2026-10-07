"use server";

import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/supabase/server";
import { exigirSessao } from "@/lib/auth/permissoes";

export type ResultadoFavorito = { erro: string } | { ok: true; favoritado: boolean };

/**
 * Marca ou desmarca a tela atual como atalho. Favoritar nao concede acesso
 * nenhum: e so um item de menu. Por isso basta sessao valida, sem exigir
 * permissao de tela — inclusive porque o caminho pode ser uma tela de dentro
 * de outra, sem chave propria em `permissoes`.
 */
export async function alternarFavoritoTela(
  href: string,
  rotulo: string,
): Promise<ResultadoFavorito> {
  await exigirSessao();

  // So caminho da gestao. Sem isso o campo aceitaria qualquer URL, inclusive
  // de fora do site, e o menu viraria vetor de link arbitrario.
  if (!href.startsWith("/gestao")) return { erro: "Só telas da gestão podem ser favoritadas." };
  if (!rotulo.trim()) return { erro: "Tela sem nome para favoritar." };

  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sessão expirada." };

  const { data: existente } = await supabase
    .from("gestao_favoritos")
    .select("href")
    .eq("href", href)
    .maybeSingle();

  if (existente) {
    const { error } = await supabase.from("gestao_favoritos").delete().eq("href", href);
    if (error) return { erro: error.message };
    revalidatePath("/gestao", "layout");
    return { ok: true, favoritado: false };
  }

  const { error } = await supabase
    .from("gestao_favoritos")
    .insert({ user_id: user.id, href, rotulo: rotulo.trim().slice(0, 60) });
  if (error) return { erro: error.message };

  revalidatePath("/gestao", "layout");
  return { ok: true, favoritado: true };
}
