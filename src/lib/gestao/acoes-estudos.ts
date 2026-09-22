"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";
import { exigirTela } from "@/lib/auth/permissoes";
import type { Resultado } from "@/lib/gestao/acoes-conteudo";

function texto(dados: FormData, campo: string) {
  const v = dados.get(campo);
  return typeof v === "string" ? v.trim() : "";
}

function ouNulo(valor: string) {
  return valor === "" ? null : valor;
}

function numeroOuNulo(valor: string) {
  if (valor === "") return null;
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
}

/* -------------------------------------------------- Turmas */

export async function salvarTurma(_estado: Resultado, dados: FormData): Promise<Resultado> {
  await exigirTela("estudos", true);
  const supabase = await criarClienteServidor();

  const id = texto(dados, "id");
  const nome = texto(dados, "nome");
  const nivel = texto(dados, "nivel");

  if (!nome) return { erro: "Informe o nome da turma." };
  if (!nivel) return { erro: "Informe o nível da turma." };

  const registro = {
    nome,
    nivel,
    descricao: ouNulo(texto(dados, "descricao")),
    dia_semana: numeroOuNulo(texto(dados, "dia_semana")),
    horario: ouNulo(texto(dados, "horario")),
    local: ouNulo(texto(dados, "local")),
    data_inicio: ouNulo(texto(dados, "data_inicio")),
    data_fim: ouNulo(texto(dados, "data_fim")),
    status: texto(dados, "status") || "planejada",
    atualizado_em: new Date().toISOString(),
  };

  if (id) {
    const { error } = await supabase.from("estudo_turmas").update(registro).eq("id", id);
    if (error) return { erro: error.message };
    revalidatePath("/gestao/estudos");
    revalidatePath(`/gestao/estudos/${id}`);
    return { ok: true };
  }

  const { data, error } = await supabase
    .from("estudo_turmas")
    .insert(registro)
    .select("id")
    .single();
  if (error) return { erro: error.message };

  revalidatePath("/gestao/estudos");
  redirect(`/gestao/estudos/${(data as { id: string }).id}`);
}

export async function excluirTurma(dados: FormData) {
  await exigirTela("estudos", true);
  const id = texto(dados, "id");
  if (!id) return;

  const supabase = await criarClienteServidor();
  // As aulas, matrículas, materiais e presenças caem junto por cascade.
  await supabase.from("estudo_turmas").delete().eq("id", id);
  revalidatePath("/gestao/estudos");
  redirect("/gestao/estudos");
}

/* -------------------------------------------------- Alunos */

export async function salvarAluno(_estado: Resultado, dados: FormData): Promise<Resultado> {
  await exigirTela("estudos", true);
  const supabase = await criarClienteServidor();

  const id = texto(dados, "id");
  const nome = texto(dados, "nome");
  if (!nome) return { erro: "Informe o nome do aluno." };

  const registro = {
    nome,
    email: ouNulo(texto(dados, "email")),
    telefone: ouNulo(texto(dados, "telefone")),
    observacoes: ouNulo(texto(dados, "observacoes")),
    membro_id: ouNulo(texto(dados, "membro_id")),
    ativo: dados.get("ativo") === "on" || dados.get("ativo") === "1",
  };

  if (id) {
    const { error } = await supabase.from("estudo_alunos").update(registro).eq("id", id);
    if (error) return { erro: error.message };
    revalidatePath("/gestao/estudos/alunos");
    revalidatePath(`/gestao/estudos/alunos/${id}`);
    return { ok: true };
  }

  const { error } = await supabase.from("estudo_alunos").insert(registro);
  if (error) return { erro: error.message };

  revalidatePath("/gestao/estudos/alunos");
  return { ok: true };
}

/* -------------------------------------------------- Matrículas */

export async function matricularAluno(dados: FormData) {
  await exigirTela("estudos", true);
  const turmaId = texto(dados, "turma_id");
  const alunoId = texto(dados, "aluno_id");
  if (!turmaId || !alunoId) return;

  const supabase = await criarClienteServidor();
  await supabase
    .from("estudo_matriculas")
    .insert({ turma_id: turmaId, aluno_id: alunoId })
    .select("id");

  revalidatePath(`/gestao/estudos/${turmaId}`);
}

export async function alterarStatusMatricula(dados: FormData) {
  await exigirTela("estudos", true);
  const id = texto(dados, "id");
  const turmaId = texto(dados, "turma_id");
  const status = texto(dados, "status");
  if (!id || !["matriculado", "concluido", "desistente"].includes(status)) return;

  const supabase = await criarClienteServidor();
  await supabase
    .from("estudo_matriculas")
    .update({
      status,
      // Concluir carimba a data; voltar atrás limpa, para o histórico não
      // guardar conclusão de quem não concluiu.
      concluido_em: status === "concluido" ? new Date().toISOString().slice(0, 10) : null,
    })
    .eq("id", id);

  revalidatePath(`/gestao/estudos/${turmaId}`);
}

export async function removerMatricula(dados: FormData) {
  await exigirTela("estudos", true);
  const id = texto(dados, "id");
  const turmaId = texto(dados, "turma_id");
  if (!id) return;

  const supabase = await criarClienteServidor();
  await supabase.from("estudo_matriculas").delete().eq("id", id);
  revalidatePath(`/gestao/estudos/${turmaId}`);
}

/* -------------------------------------------------- Aulas */

export async function salvarAula(_estado: Resultado, dados: FormData): Promise<Resultado> {
  await exigirTela("estudos", true);
  const supabase = await criarClienteServidor();

  const id = texto(dados, "id");
  const turmaId = texto(dados, "turma_id");
  const titulo = texto(dados, "titulo");
  const data = texto(dados, "data");
  const numero = Number(texto(dados, "numero"));

  if (!turmaId) return { erro: "Turma não informada." };
  if (!titulo || !data) return { erro: "Informe o título e a data da aula." };
  if (!Number.isInteger(numero) || numero < 1) return { erro: "Informe o número da aula." };

  const registro = {
    turma_id: turmaId,
    numero,
    titulo,
    data,
    plano: ouNulo(texto(dados, "plano")),
    observacoes: ouNulo(texto(dados, "observacoes")),
    status: texto(dados, "status") || "planejada",
  };

  if (id) {
    const { error } = await supabase.from("estudo_aulas").update(registro).eq("id", id);
    if (error) return { erro: traduzirErroAula(error.message) };
    revalidatePath(`/gestao/estudos/${turmaId}`);
    revalidatePath(`/gestao/estudos/${turmaId}/aulas/${id}`);
    return { ok: true };
  }

  const { data: nova, error } = await supabase
    .from("estudo_aulas")
    .insert(registro)
    .select("id")
    .single();
  if (error) return { erro: traduzirErroAula(error.message) };

  revalidatePath(`/gestao/estudos/${turmaId}`);
  redirect(`/gestao/estudos/${turmaId}/aulas/${(nova as { id: string }).id}`);
}

/** O banco recusa duas aulas com o mesmo número na turma; a mensagem crua não ajuda. */
function traduzirErroAula(mensagem: string) {
  return mensagem.includes("estudo_aulas_turma_id_numero_key") ||
    mensagem.includes("duplicate key")
    ? "Já existe uma aula com esse número nesta turma."
    : mensagem;
}

export async function excluirAula(dados: FormData) {
  await exigirTela("estudos", true);
  const id = texto(dados, "id");
  const turmaId = texto(dados, "turma_id");
  if (!id) return;

  const supabase = await criarClienteServidor();
  await supabase.from("estudo_aulas").delete().eq("id", id);
  revalidatePath(`/gestao/estudos/${turmaId}`);
  redirect(`/gestao/estudos/${turmaId}`);
}

/* -------------------------------------------------- Materiais */

export async function salvarMaterial(_estado: Resultado, dados: FormData): Promise<Resultado> {
  await exigirTela("estudos", true);
  const supabase = await criarClienteServidor();

  const aulaId = texto(dados, "aula_id");
  const turmaId = texto(dados, "turma_id");
  const titulo = texto(dados, "titulo");
  const tipo = texto(dados, "tipo") || "link";
  const url = texto(dados, "url");

  if (!aulaId || !titulo) return { erro: "Informe o título do material." };
  if (tipo !== "texto" && !url) return { erro: "Vídeo e link precisam de um endereço." };

  const { error } = await supabase.from("estudo_materiais").insert({
    aula_id: aulaId,
    tipo,
    titulo,
    url: ouNulo(url),
    descricao: ouNulo(texto(dados, "descricao")),
    ordem: numeroOuNulo(texto(dados, "ordem")) ?? 0,
  });
  if (error) return { erro: error.message };

  revalidatePath(`/gestao/estudos/${turmaId}/aulas/${aulaId}`);
  return { ok: true };
}

export async function excluirMaterial(dados: FormData) {
  await exigirTela("estudos", true);
  const id = texto(dados, "id");
  const aulaId = texto(dados, "aula_id");
  const turmaId = texto(dados, "turma_id");
  if (!id) return;

  const supabase = await criarClienteServidor();
  await supabase.from("estudo_materiais").delete().eq("id", id);
  revalidatePath(`/gestao/estudos/${turmaId}/aulas/${aulaId}`);
}

/* -------------------------------------------------- Chamada */

/**
 * Grava a chamada inteira de uma vez. O formulário manda um campo por aluno
 * matriculado, então quem não veio também vira linha — ausência registrada
 * vale mais que ausência de registro na hora de conferir o histórico.
 */
export async function salvarChamada(dados: FormData) {
  await exigirTela("estudos", true);
  const supabase = await criarClienteServidor();

  const aulaId = texto(dados, "aula_id");
  const turmaId = texto(dados, "turma_id");
  const alunos = String(dados.get("alunos") ?? "").split(",").filter(Boolean);
  if (!aulaId || alunos.length === 0) return;

  const { data: usuario } = await supabase.auth.getUser();

  const linhas = alunos.map((alunoId) => ({
    aula_id: aulaId,
    aluno_id: alunoId,
    presente: dados.get(`presente:${alunoId}`) === "on",
    justificativa: ouNulo(texto(dados, `justificativa:${alunoId}`)),
    registrado_por: usuario.user?.id ?? null,
    registrado_em: new Date().toISOString(),
  }));

  await supabase.from("estudo_presencas").upsert(linhas, { onConflict: "aula_id,aluno_id" });

  // Fazer a chamada é o que marca a aula como dada.
  await supabase.from("estudo_aulas").update({ status: "realizada" }).eq("id", aulaId);

  revalidatePath(`/gestao/estudos/${turmaId}/aulas/${aulaId}`);
  revalidatePath(`/gestao/estudos/${turmaId}`);
}
