import "server-only";

import { criarClienteServidor } from "@/lib/supabase/server";
import type { Evento, MensagemDoDia, Noticia, Pagina, Parecer, Projeto, Questao } from "@/lib/tipos";

/**
 * Enquanto o Supabase nao estiver configurado (ou em caso de falha de rede),
 * as paginas publicas renderizam vazias em vez de quebrar o build.
 */
async function seguro<T>(fn: () => Promise<T>, padrao: T): Promise<T> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return padrao;
  }
  try {
    return await fn();
  } catch {
    return padrao;
  }
}

export async function listarNoticias(limite = 12) {
  return seguro<Noticia[]>(async () => {
    const supabase = await criarClienteServidor();
    const { data } = await supabase
      .from("noticias")
      .select("*")
      .eq("status", "publicado")
      .order("publicado_em", { ascending: false, nullsFirst: false })
      .limit(limite);
    return (data ?? []) as Noticia[];
  }, []);
}

export async function listarDestaques() {
  return seguro<Noticia[]>(async () => {
    const supabase = await criarClienteServidor();
    const { data } = await supabase
      .from("noticias")
      .select("*")
      .eq("status", "publicado")
      .eq("destaque_carrossel", true)
      .order("publicado_em", { ascending: false, nullsFirst: false })
      .limit(6);
    return (data ?? []) as Noticia[];
  }, []);
}

export async function obterNoticia(slug: string) {
  return seguro<Noticia | null>(async () => {
    const supabase = await criarClienteServidor();
    const { data } = await supabase
      .from("noticias")
      .select("*")
      .eq("slug", slug)
      .eq("status", "publicado")
      .maybeSingle();
    return (data as Noticia) ?? null;
  }, null);
}

export async function obterMensagemDoDia() {
  return seguro<MensagemDoDia | null>(async () => {
    const supabase = await criarClienteServidor();
    const { data } = await supabase
      .from("mensagens_do_dia")
      .select("*")
      .eq("status", "publicado")
      .lte("data", new Date().toISOString().slice(0, 10))
      .order("data", { ascending: false })
      .limit(1)
      .maybeSingle();
    return (data as MensagemDoDia) ?? null;
  }, null);
}

export async function listarProximosEventos(limite = 4) {
  return seguro<Evento[]>(async () => {
    const supabase = await criarClienteServidor();
    const { data } = await supabase
      .from("eventos")
      .select("*")
      .eq("status", "publicado")
      .gte("inicio", new Date().toISOString())
      .order("inicio", { ascending: true })
      .limit(limite);
    return (data ?? []) as Evento[];
  }, []);
}

export async function listarEventos() {
  return seguro<Evento[]>(async () => {
    const supabase = await criarClienteServidor();
    const { data } = await supabase
      .from("eventos")
      .select("*")
      .eq("status", "publicado")
      .order("inicio", { ascending: true });
    return (data ?? []) as Evento[];
  }, []);
}

export async function listarProjetos() {
  return seguro<Projeto[]>(async () => {
    const supabase = await criarClienteServidor();
    const { data } = await supabase
      .from("projetos")
      .select("*")
      .eq("status", "publicado")
      .order("ordem", { ascending: true });
    return (data ?? []) as Projeto[];
  }, []);
}

export async function obterPagina(slug: string) {
  return seguro<Pagina | null>(async () => {
    const supabase = await criarClienteServidor();
    const { data } = await supabase
      .from("paginas")
      .select("*")
      .eq("slug", slug)
      .eq("status", "publicado")
      .maybeSingle();
    return (data as Pagina) ?? null;
  }, null);
}

export async function listarQuestoes() {
  return seguro<Questao[]>(async () => {
    const supabase = await criarClienteServidor();
    const { data } = await supabase.from("questoes").select("*").order("numero");
    return (data ?? []) as Questao[];
  }, []);
}

export async function obterQuestaoComPareceres(numero: number) {
  return seguro<{ questao: Questao | null; pareceres: Parecer[] }>(
    async () => {
      const supabase = await criarClienteServidor();
      const { data: questao } = await supabase
        .from("questoes")
        .select("*")
        .eq("numero", numero)
        .maybeSingle();
      if (!questao) return { questao: null, pareceres: [] };
      const { data: pareceres } = await supabase
        .from("pareceres")
        .select("*")
        .eq("questao_id", (questao as Questao).id)
        .eq("status", "publicado")
        .order("criado_em");
      return { questao: questao as Questao, pareceres: (pareceres ?? []) as Parecer[] };
    },
    { questao: null, pareceres: [] },
  );
}
