import "server-only";

import { criarClienteServidor } from "@/lib/supabase/server";

export type Favorito = { href: string; rotulo: string };

/**
 * Atalhos do usuario logado. O RLS limita as linhas dele, entao nao ha
 * filtro por user_id aqui. Volta vazio para quem nao tem sessao.
 */
export async function listarFavoritos(): Promise<Favorito[]> {
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("gestao_favoritos")
    .select("href, rotulo")
    .order("criado_em");
  return (data ?? []) as Favorito[];
}
