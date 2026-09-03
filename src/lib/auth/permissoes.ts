import "server-only";

import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";
import type { Papel, Perfil } from "@/lib/tipos";

export type TelaKey =
  | "painel"
  | "conteudo"
  | "atas"
  | "usuarios"
  | "permissoes"
  | "membros"
  | "compras"
  | "contas_pagar"
  | "contas_receber"
  | "relatorios"
  | "auditoria"
  | "audiencia";

export type Permissao = { tela_key: TelaKey; ver: boolean; editar: boolean };

export type Sessao = {
  perfil: Perfil;
  permissoes: Permissao[];
  podeVer: (tela: TelaKey) => boolean;
  podeEditar: (tela: TelaKey) => boolean;
};

/** Carrega perfil e matriz de permissoes do usuario logado, ou null. */
export async function obterSessao(): Promise<Sessao | null> {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: perfil } = await supabase
    .from("profiles")
    .select("id, nome, email, telefone, role, ativo")
    .eq("id", user.id)
    .single();

  if (!perfil || !perfil.ativo) return null;

  const { data: permissoes } = await supabase
    .from("permissoes")
    .select("tela_key, ver, editar")
    .eq("role", perfil.role as Papel);

  const lista = (permissoes ?? []) as Permissao[];
  const achar = (tela: TelaKey) => lista.find((p) => p.tela_key === tela);

  return {
    perfil: perfil as Perfil,
    permissoes: lista,
    podeVer: (tela) => Boolean(achar(tela)?.ver),
    podeEditar: (tela) => Boolean(achar(tela)?.editar),
  };
}

/** Exige sessao valida; caso contrario redireciona para o login. */
export async function exigirSessao(): Promise<Sessao> {
  const sessao = await obterSessao();
  if (!sessao) redirect("/entrar");
  return sessao;
}

/**
 * Exige permissao de visualizacao da tela.
 * Guard de UX — quem protege as linhas e o RLS no banco.
 */
export async function exigirTela(tela: TelaKey, escrita = false): Promise<Sessao> {
  const sessao = await exigirSessao();
  const permitido = escrita ? sessao.podeEditar(tela) : sessao.podeVer(tela);
  if (!permitido) redirect("/gestao?erro=sem-permissao");
  return sessao;
}
