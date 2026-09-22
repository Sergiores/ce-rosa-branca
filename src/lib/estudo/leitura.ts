import "server-only";

import { criarClienteServidor } from "@/lib/supabase/server";
import type { Questao } from "@/lib/tipos";

/**
 * Leitura e favoritos sao por pessoa (RLS com auth.uid()), nao por papel.
 * Um visitante anonimo simplesmente nao tem linha nenhuma — nunca lanca
 * erro, so devolve vazio.
 */

export type InteracoesQuestoes = {
  lidas: Set<string>;
  favoritas: Set<string>;
};

/** Para uma lista de ids de questao, o que o usuario logado ja leu/favoritou. */
export async function obterInteracoes(questaoIds: string[]): Promise<InteracoesQuestoes> {
  const vazio: InteracoesQuestoes = { lidas: new Set(), favoritas: new Set() };
  if (questaoIds.length === 0) return vazio;

  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return vazio;

  const [leituras, favoritas] = await Promise.all([
    supabase.from("questao_leitura").select("questao_id").in("questao_id", questaoIds),
    supabase.from("questao_favorita").select("questao_id").in("questao_id", questaoIds),
  ]);

  return {
    lidas: new Set((leituras.data ?? []).map((r) => r.questao_id as string)),
    favoritas: new Set((favoritas.data ?? []).map((r) => r.questao_id as string)),
  };
}

/** Questoes favoritadas pelo usuario logado, mais recente primeiro. Vazio se anonimo. */
export async function listarQuestoesFavoritas(): Promise<Questao[]> {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("questao_favorita")
    .select("criado_em, questoes(*)")
    .order("criado_em", { ascending: false });

  return (data ?? [])
    .map((linha) => linha.questoes as unknown as Questao)
    .filter((q): q is Questao => Boolean(q));
}
