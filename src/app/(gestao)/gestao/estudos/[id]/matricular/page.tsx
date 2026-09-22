import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { UserPlus } from "lucide-react";
import { Rotulo, Selecao, Vazio } from "@/components/ui";
import { PaginaManutencao } from "@/components/gestao/PaginaManutencao";
import { exigirTela } from "@/lib/auth/permissoes";
import { alunosDisponiveis, obterTurma } from "@/lib/gestao/estudos";
import { matricularAluno } from "@/lib/gestao/acoes-estudos";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Matricular aluno" };

export default async function Matricular({ params }: { params: Promise<{ id: string }> }) {
  await exigirTela("estudos", true);
  const { id } = await params;

  const turma = await obterTurma(id);
  if (!turma) notFound();

  const disponiveis = await alunosDisponiveis(id);

  return (
    <PaginaManutencao
      voltarHref={`/gestao/estudos/${id}`}
      voltarRotulo={turma.nome}
      titulo="Matricular aluno"
      descricao="Só aparecem aqui os alunos ativos que ainda não estão nesta turma."
    >
      {disponiveis.length === 0 ? (
        <>
          <Vazio mensagem="Todos os alunos cadastrados já estão nesta turma." />
          <p className="mt-5 text-center text-sm text-texto-suave">
            <Link
              href="/gestao/estudos/alunos/novo"
              className="font-medium text-marca-700 hover:text-marca-800"
            >
              Cadastrar um aluno novo
            </Link>
          </p>
        </>
      ) : (
        <form action={matricularAluno} className="space-y-5">
          <input type="hidden" name="turma_id" value={id} />
          <div>
            <Rotulo htmlFor="aluno_id">Aluno</Rotulo>
            <Selecao id="aluno_id" name="aluno_id" required>
              {disponiveis.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}
                </option>
              ))}
            </Selecao>
          </div>

          <div className="border-t border-borda pt-5">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-marca-600 px-6 py-2.5 text-sm font-medium text-white shadow-md shadow-marca-600/20 hover:bg-marca-700"
            >
              <UserPlus className="h-4 w-4" /> Matricular
            </button>
          </div>
        </form>
      )}
    </PaginaManutencao>
  );
}
