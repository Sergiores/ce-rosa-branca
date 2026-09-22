import "server-only";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { after } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";
import type { EntidadeMetrica } from "@/lib/tipos";

/**
 * Hash de sessao = IP + user-agent + sal do dia.
 * LGPD: o IP bruto nunca e gravado; o hash so serve para deduplicar visitas.
 */
async function hashSessao() {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "desconhecido";
  const ua = h.get("user-agent") ?? "";
  const dia = new Date().toISOString().slice(0, 10);
  const sal = process.env.METRICAS_SALT ?? "sal-padrao";
  return createHash("sha256").update(`${ip}|${ua}|${dia}|${sal}`).digest("hex").slice(0, 64);
}

async function referrer() {
  const h = await headers();
  return h.get("referer");
}

/**
 * Registra um acesso ao site. Falha silenciosa: metrica nunca derruba a
 * pagina. A gravacao roda com `after()`, depois da resposta ja ter saido —
 * quem visita nao espera essa escrita para ver a pagina. `headers()` precisa
 * ser lido aqui fora, antes do `after`, porque só é acessível durante o
 * render da requisição.
 */
export async function registrarAcesso(path: string) {
  const sessaoHash = await hashSessao();
  const ref = await referrer();

  after(async () => {
    try {
      const supabase = await criarClienteServidor();
      await supabase.rpc("registrar_acesso", {
        p_path: path,
        p_sessao_hash: sessaoHash,
        p_referrer: ref,
      });
    } catch {
      /* metricas sao best-effort */
    }
  });
}

/** Registra a visualizacao de uma noticia, mensagem, pagina, evento ou projeto. */
export async function registrarVisualizacao(entidade: EntidadeMetrica, entidadeId: string) {
  const sessaoHash = await hashSessao();
  const ref = await referrer();

  after(async () => {
    try {
      const supabase = await criarClienteServidor();
      await supabase.rpc("registrar_visualizacao", {
        p_entidade: entidade,
        p_entidade_id: entidadeId,
        p_sessao_hash: sessaoHash,
        p_referrer: ref,
      });
    } catch {
      /* metricas sao best-effort */
    }
  });
}
