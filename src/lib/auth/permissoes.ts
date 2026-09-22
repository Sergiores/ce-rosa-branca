import "server-only";

import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";
import type { Papel, Perfil } from "@/lib/tipos";

export type TelaKey =
  | "painel"
  | "conteudo"
  | "atas"
  | "estudos"
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

/**
 * Por que existe: `auth.users` e compartilhado com a loja. Uma conta
 * autenticada pode nao ter perfil em `rosabranca.profiles`, e antes disso
 * virava laco de redirecionamento entre /entrar e /gestao. Aqui o motivo
 * fica explicito para quem chama decidir o destino.
 */
export type EstadoSessao =
  | { tipo: "anonimo" }
  | { tipo: "sem_perfil" }
  | { tipo: "inativo" }
  | { tipo: "ok"; sessao: Sessao };

export async function estadoSessao(): Promise<EstadoSessao> {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { tipo: "anonimo" };

  // maybeSingle: ausencia de perfil e caso previsto, nao erro.
  const { data: perfil } = await supabase
    .from("profiles")
    .select("id, nome, email, telefone, role, ativo")
    .eq("id", user.id)
    .maybeSingle();

  if (!perfil) return { tipo: "sem_perfil" };
  if (!perfil.ativo) return { tipo: "inativo" };

  const { data: permissoes } = await supabase
    .from("permissoes")
    .select("tela_key, ver, editar")
    .eq("role", perfil.role as Papel);

  const lista = (permissoes ?? []) as Permissao[];
  const achar = (tela: TelaKey) => lista.find((p) => p.tela_key === tela);

  return {
    tipo: "ok",
    sessao: {
      perfil: perfil as Perfil,
      permissoes: lista,
      podeVer: (tela) => Boolean(achar(tela)?.ver),
      podeEditar: (tela) => Boolean(achar(tela)?.editar),
    },
  };
}

/** Carrega perfil e matriz de permissoes do usuario logado, ou null. */
export async function obterSessao(): Promise<Sessao | null> {
  const estado = await estadoSessao();
  return estado.tipo === "ok" ? estado.sessao : null;
}

/**
 * Exige sessao valida. Sem login vai para /entrar; logado sem perfil aqui vai
 * para /sem-acesso — nunca de volta para /entrar, senao o middleware devolve
 * para /gestao e o navegador fica em laco.
 */
export async function exigirSessao(): Promise<Sessao> {
  const estado = await estadoSessao();
  if (estado.tipo === "ok") return estado.sessao;
  if (estado.tipo === "anonimo") redirect("/entrar");
  redirect(estado.tipo === "inativo" ? "/sem-acesso?motivo=inativo" : "/sem-acesso");
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
