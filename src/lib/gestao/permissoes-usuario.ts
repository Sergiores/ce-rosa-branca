import "server-only";

import { criarClienteServidor } from "@/lib/supabase/server";
import type { TelaKey } from "@/lib/auth/permissoes";
import type { Papel } from "@/lib/tipos";

export type AcessoTela = { tela_key: TelaKey; ver: boolean; editar: boolean };

/** A matriz do papel: a base sobre a qual as excecoes incidem. */
export async function acessosDoPapel(papel: Papel): Promise<Map<string, AcessoTela>> {
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("permissoes")
    .select("tela_key, ver, editar")
    .eq("role", papel);

  const mapa = new Map<string, AcessoTela>();
  for (const p of (data ?? []) as AcessoTela[]) mapa.set(p.tela_key, p);
  return mapa;
}

/** So as excecoes gravadas para a pessoa. Vazio = ela segue o papel. */
export async function excecoesDoUsuario(userId: string): Promise<Map<string, AcessoTela>> {
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("permissoes_usuario")
    .select("tela_key, ver, editar")
    .eq("user_id", userId);

  const mapa = new Map<string, AcessoTela>();
  for (const p of (data ?? []) as AcessoTela[]) mapa.set(p.tela_key, p);
  return mapa;
}

/** Quantas excecoes cada usuario tem, para sinalizar na lista de usuarios. */
export async function contarExcecoes(): Promise<Map<string, number>> {
  const supabase = await criarClienteServidor();
  const { data } = await supabase.from("permissoes_usuario").select("user_id");

  const mapa = new Map<string, number>();
  for (const linha of (data ?? []) as { user_id: string }[]) {
    mapa.set(linha.user_id, (mapa.get(linha.user_id) ?? 0) + 1);
  }
  return mapa;
}
