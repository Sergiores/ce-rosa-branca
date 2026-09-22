"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";

/**
 * Marca a questao como lida pelo usuario logado. Chamada automaticamente ao
 * abrir a pagina da questao — silenciosa e best-effort, como as RPCs de
 * metrica: anonimo nao tem linha nenhuma, e um erro aqui nunca deve quebrar
 * a leitura da pagina. Roda com `after()`: quem abriu a questao ve o
 * conteudo sem esperar essa escrita.
 */
export async function marcarQuestaoLida(questaoId: string): Promise<void> {
  after(async () => {
    try {
      const supabase = await criarClienteServidor();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("questao_leitura")
        .upsert({ user_id: user.id, questao_id: questaoId }, { onConflict: "user_id,questao_id" });
    } catch {
      /* best-effort, como as demais marcas de leitura */
    }
  });
}

export type ResultadoFavorito = { erro: string } | { ok: true; favoritada: boolean };

/** Alterna favorito. Exige login — quem chama sem sessao recebe erro claro. */
export async function alternarFavorito(questaoId: string): Promise<ResultadoFavorito> {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Entre para favoritar questões." };

  const { data: existente } = await supabase
    .from("questao_favorita")
    .select("questao_id")
    .eq("questao_id", questaoId)
    .maybeSingle();

  if (existente) {
    const { error } = await supabase
      .from("questao_favorita")
      .delete()
      .eq("questao_id", questaoId);
    if (error) return { erro: error.message };
    revalidatePath("/estudo");
    revalidatePath("/estudo/favoritas");
    return { ok: true, favoritada: false };
  }

  const { error } = await supabase
    .from("questao_favorita")
    .insert({ user_id: user.id, questao_id: questaoId });
  if (error) return { erro: error.message };

  revalidatePath("/estudo");
  revalidatePath("/estudo/favoritas");
  return { ok: true, favoritada: true };
}
