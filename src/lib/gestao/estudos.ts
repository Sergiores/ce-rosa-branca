import "server-only";

import { criarClienteServidor } from "@/lib/supabase/server";
import type {
  Aluno,
  Aula,
  FrequenciaAluno,
  MaterialAula,
  Matricula,
  Presenca,
  Turma,
} from "@/lib/tipos";

/**
 * Consultas da área de estudos. Escrita fica em `acoes-estudos.ts`.
 * Tudo aqui passa pelo cliente de servidor normal: o RLS já limita a
 * diretoria e voluntários.
 */

export type TurmaComContagem = Turma & {
  matriculados: number;
  aulas: number;
};

export async function listarTurmas(status?: string) {
  const supabase = await criarClienteServidor();
  let consulta = supabase
    .from("estudo_turmas")
    .select("*, estudo_matriculas(count), estudo_aulas(count)")
    .order("status")
    .order("nome");

  if (status) consulta = consulta.eq("status", status);

  const { data } = await consulta;

  return (data ?? []).map((t) => {
    const linha = t as Turma & {
      estudo_matriculas: { count: number }[];
      estudo_aulas: { count: number }[];
    };
    return {
      ...(t as Turma),
      matriculados: linha.estudo_matriculas?.[0]?.count ?? 0,
      aulas: linha.estudo_aulas?.[0]?.count ?? 0,
    } as TurmaComContagem;
  });
}

export async function obterTurma(id: string) {
  const supabase = await criarClienteServidor();
  const { data } = await supabase.from("estudo_turmas").select("*").eq("id", id).maybeSingle();
  return (data as Turma) ?? null;
}

export type MatriculaComAluno = Matricula & { aluno: Aluno };

export async function listarMatriculas(turmaId: string): Promise<MatriculaComAluno[]> {
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("estudo_matriculas")
    .select("*, estudo_alunos(*)")
    .eq("turma_id", turmaId);

  return (data ?? [])
    .map((m) => {
      const { estudo_alunos, ...matricula } = m as Matricula & { estudo_alunos: Aluno };
      return { ...matricula, aluno: estudo_alunos } as MatriculaComAluno;
    })
    .filter((m) => Boolean(m.aluno))
    .sort((a, b) => a.aluno.nome.localeCompare(b.aluno.nome, "pt-BR"));
}

export async function listarAulas(turmaId: string) {
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("estudo_aulas")
    .select("*")
    .eq("turma_id", turmaId)
    .order("numero");
  return (data ?? []) as Aula[];
}

export async function obterAula(id: string) {
  const supabase = await criarClienteServidor();
  const { data } = await supabase.from("estudo_aulas").select("*").eq("id", id).maybeSingle();
  return (data as Aula) ?? null;
}

export async function listarMateriais(aulaId: string) {
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("estudo_materiais")
    .select("*")
    .eq("aula_id", aulaId)
    .order("ordem")
    .order("criado_em");
  return (data ?? []) as MaterialAula[];
}

/** Presenças já registradas numa aula, indexadas por aluno. */
export async function obterPresencas(aulaId: string) {
  const supabase = await criarClienteServidor();
  const { data } = await supabase.from("estudo_presencas").select("*").eq("aula_id", aulaId);
  const mapa = new Map<string, Presenca>();
  for (const p of (data ?? []) as Presenca[]) mapa.set(p.aluno_id, p);
  return mapa;
}

export async function listarAlunos(busca?: string) {
  const supabase = await criarClienteServidor();
  let consulta = supabase.from("estudo_alunos").select("*").order("nome");

  const termo = busca?.trim();
  if (termo) {
    const alvo = termo.replace(/[%,()]/g, " ");
    consulta = consulta.or(`nome.ilike.%${alvo}%,email.ilike.%${alvo}%,telefone.ilike.%${alvo}%`);
  }

  const { data } = await consulta;
  return (data ?? []) as Aluno[];
}

export async function obterAluno(id: string) {
  const supabase = await criarClienteServidor();
  const { data } = await supabase.from("estudo_alunos").select("*").eq("id", id).maybeSingle();
  return (data as Aluno) ?? null;
}

/** Histórico: uma linha por matrícula, com frequência calculada na view. */
export async function historicoDoAluno(alunoId: string) {
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("v_estudo_frequencia")
    .select("*")
    .eq("aluno_id", alunoId)
    .order("matriculado_em", { ascending: false });
  return (data ?? []) as FrequenciaAluno[];
}

export async function frequenciaDaTurma(turmaId: string) {
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("v_estudo_frequencia")
    .select("*")
    .eq("turma_id", turmaId)
    .order("aluno_nome");
  return (data ?? []) as FrequenciaAluno[];
}

/** Alunos ainda não matriculados nesta turma, para o seletor de matrícula. */
export async function alunosDisponiveis(turmaId: string) {
  const [todos, matriculados] = await Promise.all([listarAlunos(), listarMatriculas(turmaId)]);
  const jaTem = new Set(matriculados.map((m) => m.aluno_id));
  return todos.filter((a) => a.ativo && !jaTem.has(a.id));
}
