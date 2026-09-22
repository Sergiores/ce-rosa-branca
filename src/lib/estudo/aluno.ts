import "server-only";

import { criarClienteServidor } from "@/lib/supabase/server";
import type { Aula, FrequenciaAluno, MaterialAula, Presenca, Turma } from "@/lib/tipos";

/**
 * Lado do aluno. Tudo aqui passa pelo cliente normal e depende das policies
 * de leitura própria: o RLS é que decide o que a pessoa enxerga, não estas
 * funções. Se o vínculo não existir, as consultas voltam vazias — não é
 * erro, é alguém que ainda não foi vinculado a um cadastro.
 */

/** Id do cadastro de aluno ligado à conta logada, ou null. */
export async function meuAlunoId(): Promise<string | null> {
  const supabase = await criarClienteServidor();
  const { data } = await supabase.rpc("meu_aluno_id");
  return (data as string) ?? null;
}

/**
 * Tenta ligar a conta logada a um cadastro de aluno com o mesmo e-mail.
 * Devolve o id quando encontra. Idempotente: chamar de novo não muda nada.
 */
export async function vincularMeuCadastro(): Promise<string | null> {
  const supabase = await criarClienteServidor();
  const { data } = await supabase.rpc("vincular_meu_cadastro");
  return (data as string) ?? null;
}

/** Histórico do próprio aluno, uma linha por turma. */
export async function minhaFrequencia(): Promise<FrequenciaAluno[]> {
  const supabase = await criarClienteServidor();
  const { data } = await supabase.rpc("minha_frequencia");
  const linhas = (data ?? []) as FrequenciaAluno[];
  return [...linhas].sort((a, b) => b.matriculado_em.localeCompare(a.matriculado_em));
}

export async function minhasTurmas(): Promise<Turma[]> {
  const supabase = await criarClienteServidor();
  const { data } = await supabase.from("estudo_turmas").select("*").order("nome");
  return (data ?? []) as Turma[];
}

export async function minhaTurma(id: string): Promise<Turma | null> {
  const supabase = await criarClienteServidor();
  const { data } = await supabase.from("estudo_turmas").select("*").eq("id", id).maybeSingle();
  return (data as Turma) ?? null;
}

export async function aulasDaTurma(turmaId: string): Promise<Aula[]> {
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("estudo_aulas")
    .select("*")
    .eq("turma_id", turmaId)
    .order("numero");
  return (data ?? []) as Aula[];
}

export async function minhaAula(id: string): Promise<Aula | null> {
  const supabase = await criarClienteServidor();
  const { data } = await supabase.from("estudo_aulas").select("*").eq("id", id).maybeSingle();
  return (data as Aula) ?? null;
}

export async function materiaisDaAula(aulaId: string): Promise<MaterialAula[]> {
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("estudo_materiais")
    .select("*")
    .eq("aula_id", aulaId)
    .order("ordem")
    .order("criado_em");
  return (data ?? []) as MaterialAula[];
}

/** Presenças do próprio aluno numa turma, indexadas por aula. */
export async function minhasPresencas(turmaId: string) {
  const supabase = await criarClienteServidor();
  const aulas = await aulasDaTurma(turmaId);
  if (aulas.length === 0) return new Map<string, Presenca>();

  const { data } = await supabase
    .from("estudo_presencas")
    .select("*")
    .in(
      "aula_id",
      aulas.map((a) => a.id),
    );

  const mapa = new Map<string, Presenca>();
  for (const p of (data ?? []) as Presenca[]) mapa.set(p.aula_id, p);
  return mapa;
}

/** Próxima aula planejada entre todas as turmas do aluno. */
export async function proximaAula(): Promise<(Aula & { turma_nome?: string }) | null> {
  const supabase = await criarClienteServidor();
  const hoje = new Date().toISOString().slice(0, 10);

  const { data } = await supabase
    .from("estudo_aulas")
    .select("*, estudo_turmas(nome)")
    .gte("data", hoje)
    .eq("status", "planejada")
    .order("data")
    .limit(1);

  const linha = (data ?? [])[0] as (Aula & { estudo_turmas: { nome: string } | null }) | undefined;
  if (!linha) return null;

  const { estudo_turmas, ...aula } = linha;
  return { ...aula, turma_nome: estudo_turmas?.nome };
}
