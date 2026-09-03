"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";
import { exigirTela } from "@/lib/auth/permissoes";
import { slugificar } from "@/lib/utils";

export type Resultado = { erro?: string; ok?: boolean };

function texto(dados: FormData, campo: string) {
  const v = dados.get(campo);
  return typeof v === "string" ? v.trim() : "";
}

function marcado(dados: FormData, campo: string) {
  return dados.get(campo) === "on" || dados.get(campo) === "true";
}

function revalidarSite(...caminhos: string[]) {
  ["/", "/noticias", "/eventos", "/projetos", "/estudo", ...caminhos].forEach((c) =>
    revalidatePath(c),
  );
}

/* ------------------------------------------------------------------ Notícias */

export async function salvarNoticia(_estado: Resultado, dados: FormData): Promise<Resultado> {
  await exigirTela("conteudo", true);
  const supabase = await criarClienteServidor();

  const id = texto(dados, "id");
  const titulo = texto(dados, "titulo");
  if (!titulo) return { erro: "Informe o título da notícia." };

  const publicar = texto(dados, "acao") === "publicar";
  const slugInformado = texto(dados, "slug");
  const slug = slugificar(slugInformado || titulo);

  const registro = {
    titulo,
    slug,
    resumo: texto(dados, "resumo") || null,
    corpo: texto(dados, "corpo"),
    imagem_url: texto(dados, "imagem_url") || null,
    destaque_carrossel: marcado(dados, "destaque_carrossel"),
    status: publicar ? ("publicado" as const) : ("rascunho" as const),
    publicado_em: publicar ? new Date().toISOString() : null,
    atualizado_em: new Date().toISOString(),
  };

  if (id) {
    // Mantém a data de publicação original quando a notícia já estava no ar.
    const { data: atual } = await supabase
      .from("noticias")
      .select("publicado_em")
      .eq("id", id)
      .maybeSingle();
    if (publicar && atual?.publicado_em) registro.publicado_em = atual.publicado_em;

    const { error } = await supabase.from("noticias").update(registro).eq("id", id);
    if (error) return { erro: error.message };
  } else {
    const { data: usuario } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("noticias")
      .insert({ ...registro, autor_id: usuario.user?.id ?? null });
    if (error) return { erro: error.message };
  }

  revalidarSite(`/noticias/${slug}`);
  revalidatePath("/gestao/conteudo/noticias");
  redirect("/gestao/conteudo/noticias?salvo=1");
}

export async function alternarPublicacaoNoticia(id: string, publicar: boolean) {
  await exigirTela("conteudo", true);
  const supabase = await criarClienteServidor();
  await supabase
    .from("noticias")
    .update({
      status: publicar ? "publicado" : "rascunho",
      publicado_em: publicar ? new Date().toISOString() : null,
    })
    .eq("id", id);
  revalidarSite();
  revalidatePath("/gestao/conteudo/noticias");
}

export async function excluirNoticia(id: string) {
  await exigirTela("conteudo", true);
  const supabase = await criarClienteServidor();
  await supabase.from("noticias").delete().eq("id", id);
  revalidarSite();
  revalidatePath("/gestao/conteudo/noticias");
}

/* ------------------------------------------------------------ Mensagem do dia */

export async function salvarMensagem(_estado: Resultado, dados: FormData): Promise<Resultado> {
  await exigirTela("conteudo", true);
  const supabase = await criarClienteServidor();

  const id = texto(dados, "id");
  const conteudo = texto(dados, "texto");
  const data = texto(dados, "data");
  if (!conteudo || !data) return { erro: "Informe a data e o texto da mensagem." };

  const registro = {
    data,
    texto: conteudo,
    autor: texto(dados, "autor") || null,
    status: texto(dados, "acao") === "publicar" ? ("publicado" as const) : ("rascunho" as const),
    atualizado_em: new Date().toISOString(),
  };

  const { error } = id
    ? await supabase.from("mensagens_do_dia").update(registro).eq("id", id)
    : await supabase.from("mensagens_do_dia").insert(registro);

  if (error) {
    return {
      erro: error.code === "23505" ? "Já existe uma mensagem para esta data." : error.message,
    };
  }

  revalidarSite();
  redirect("/gestao/conteudo/mensagens?salvo=1");
}

export async function excluirMensagem(id: string) {
  await exigirTela("conteudo", true);
  const supabase = await criarClienteServidor();
  await supabase.from("mensagens_do_dia").delete().eq("id", id);
  revalidarSite();
  revalidatePath("/gestao/conteudo/mensagens");
}

/* ------------------------------------------------------------------- Eventos */

export async function salvarEvento(_estado: Resultado, dados: FormData): Promise<Resultado> {
  await exigirTela("conteudo", true);
  const supabase = await criarClienteServidor();

  const id = texto(dados, "id");
  const titulo = texto(dados, "titulo");
  const inicio = texto(dados, "inicio");
  if (!titulo || !inicio) return { erro: "Informe o título e a data de início." };

  const registro = {
    titulo,
    descricao: texto(dados, "descricao") || null,
    inicio: new Date(inicio).toISOString(),
    fim: texto(dados, "fim") ? new Date(texto(dados, "fim")).toISOString() : null,
    local: texto(dados, "local") || null,
    imagem_url: texto(dados, "imagem_url") || null,
    status: texto(dados, "acao") === "publicar" ? ("publicado" as const) : ("rascunho" as const),
    atualizado_em: new Date().toISOString(),
  };

  const { error } = id
    ? await supabase.from("eventos").update(registro).eq("id", id)
    : await supabase.from("eventos").insert(registro);
  if (error) return { erro: error.message };

  revalidarSite();
  redirect("/gestao/conteudo/eventos?salvo=1");
}

export async function excluirEvento(id: string) {
  await exigirTela("conteudo", true);
  const supabase = await criarClienteServidor();
  await supabase.from("eventos").delete().eq("id", id);
  revalidarSite();
  revalidatePath("/gestao/conteudo/eventos");
}

/* ------------------------------------------------------------------ Projetos */

export async function salvarProjeto(_estado: Resultado, dados: FormData): Promise<Resultado> {
  await exigirTela("conteudo", true);
  const supabase = await criarClienteServidor();

  const id = texto(dados, "id");
  const titulo = texto(dados, "titulo");
  if (!titulo) return { erro: "Informe o título do projeto." };

  const registro = {
    titulo,
    descricao: texto(dados, "descricao") || null,
    imagem_url: texto(dados, "imagem_url") || null,
    ordem: Number(texto(dados, "ordem") || 0),
    status: texto(dados, "acao") === "publicar" ? ("publicado" as const) : ("rascunho" as const),
    atualizado_em: new Date().toISOString(),
  };

  const { error } = id
    ? await supabase.from("projetos").update(registro).eq("id", id)
    : await supabase.from("projetos").insert(registro);
  if (error) return { erro: error.message };

  revalidarSite();
  redirect("/gestao/conteudo/projetos?salvo=1");
}

export async function excluirProjeto(id: string) {
  await exigirTela("conteudo", true);
  const supabase = await criarClienteServidor();
  await supabase.from("projetos").delete().eq("id", id);
  revalidarSite();
  revalidatePath("/gestao/conteudo/projetos");
}

/* ------------------------------------------------- Páginas institucionais */

export async function salvarPagina(_estado: Resultado, dados: FormData): Promise<Resultado> {
  await exigirTela("conteudo", true);
  const supabase = await criarClienteServidor();

  const slug = texto(dados, "slug");
  const titulo = texto(dados, "titulo");
  if (!slug || !titulo) return { erro: "Informe o identificador e o título da página." };

  const { error } = await supabase.from("paginas").upsert({
    slug,
    titulo,
    corpo: texto(dados, "corpo"),
    status: texto(dados, "acao") === "publicar" ? "publicado" : "rascunho",
    atualizado_em: new Date().toISOString(),
  });
  if (error) return { erro: error.message };

  revalidarSite("/sobre", "/sobre/missao", "/contato");
  redirect("/gestao/conteudo/paginas?salvo=1");
}

/* ------------------------------------- Estudo: questões e pareceres */

export async function salvarQuestao(_estado: Resultado, dados: FormData): Promise<Resultado> {
  await exigirTela("conteudo", true);
  const supabase = await criarClienteServidor();

  const id = texto(dados, "id");
  const numero = Number(texto(dados, "numero"));
  const pergunta = texto(dados, "pergunta");
  const resposta = texto(dados, "resposta");
  if (!Number.isInteger(numero) || !pergunta || !resposta) {
    return { erro: "Informe número, pergunta e resposta." };
  }

  const registro = {
    numero,
    parte: texto(dados, "parte") || null,
    capitulo: texto(dados, "capitulo") || null,
    pergunta,
    resposta,
  };

  const { error } = id
    ? await supabase.from("questoes").update(registro).eq("id", id)
    : await supabase.from("questoes").insert(registro);

  if (error) {
    return { erro: error.code === "23505" ? "Já existe uma questão com esse número." : error.message };
  }

  revalidarSite();
  redirect("/gestao/conteudo/estudo?salvo=1");
}

export async function salvarParecer(_estado: Resultado, dados: FormData): Promise<Resultado> {
  await exigirTela("conteudo", true);
  const supabase = await criarClienteServidor();

  const id = texto(dados, "id");
  const questao_id = texto(dados, "questao_id");
  const conteudo = texto(dados, "texto");
  if (!questao_id || !conteudo) return { erro: "Informe a questão e o texto do parecer." };

  const registro = {
    questao_id,
    texto: conteudo,
    autor_nome: texto(dados, "autor_nome") || null,
    status: texto(dados, "acao") === "publicar" ? ("publicado" as const) : ("rascunho" as const),
    atualizado_em: new Date().toISOString(),
  };

  const { data: usuario } = await supabase.auth.getUser();
  const { error } = id
    ? await supabase.from("pareceres").update(registro).eq("id", id)
    : await supabase.from("pareceres").insert({ ...registro, autor_id: usuario.user?.id ?? null });
  if (error) return { erro: error.message };

  revalidarSite();
  redirect(`/gestao/conteudo/estudo?questao=${questao_id}&salvo=1`);
}

export async function excluirParecer(id: string) {
  await exigirTela("conteudo", true);
  const supabase = await criarClienteServidor();
  await supabase.from("pareceres").delete().eq("id", id);
  revalidarSite();
  revalidatePath("/gestao/conteudo/estudo");
}
