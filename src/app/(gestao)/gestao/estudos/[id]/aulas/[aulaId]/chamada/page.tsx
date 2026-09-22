import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { Vazio } from "@/components/ui";
import { Chamada } from "@/components/gestao/Chamada";
import { formatarData } from "@/lib/datas";
import { exigirTela } from "@/lib/auth/permissoes";
import { listarMatriculas, obterAula, obterPresencas, obterTurma } from "@/lib/gestao/estudos";
import { salvarChamada } from "@/lib/gestao/acoes-estudos";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Chamada" };

export default async function PaginaChamada({
  params,
}: {
  params: Promise<{ id: string; aulaId: string }>;
}) {
  await exigirTela("estudos", true);
  const { id, aulaId } = await params;

  const [turma, aula] = await Promise.all([obterTurma(id), obterAula(aulaId)]);
  if (!turma || !aula || aula.turma_id !== id) notFound();

  const [matriculas, presencas] = await Promise.all([
    listarMatriculas(id),
    obterPresencas(aulaId),
  ]);

  // Quem desistiu não entra na chamada das aulas seguintes.
  const chamada = matriculas.filter((m) => m.status !== "desistente");

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={`/gestao/estudos/${id}/aulas/${aulaId}`}
        className="inline-flex items-center gap-1 text-sm font-medium text-marca-700 hover:text-marca-800"
      >
        <ArrowLeft className="h-4 w-4" /> Aula {aula.numero} — {aula.titulo}
      </Link>

      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-texto">Lista de chamada</h1>
      <p className="mt-1 text-texto-suave">
        {turma.nome} · aula de {formatarData(aula.data)}
        {presencas.size > 0 ? " · já registrada, gravar de novo substitui" : ""}
      </p>

      {chamada.length === 0 ? (
        <div className="mt-8">
          <Vazio mensagem="Nenhum aluno matriculado nesta turma para chamar." />
        </div>
      ) : (
        <Chamada
          acao={salvarChamada}
          aulaId={aulaId}
          turmaId={id}
          podeEditar
          alunos={chamada.map((m) => {
            const p = presencas.get(m.aluno_id);
            return {
              id: m.aluno_id,
              nome: m.aluno.nome,
              presente: p ? p.presente : true,
              justificativa: p?.justificativa ?? "",
            };
          })}
        />
      )}
    </div>
  );
}
