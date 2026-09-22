import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PaginaManutencao } from "@/components/gestao/PaginaManutencao";
import { FormularioAula } from "@/components/gestao/FormulariosEstudo";
import { exigirTela } from "@/lib/auth/permissoes";
import { listarAulas, obterTurma } from "@/lib/gestao/estudos";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Nova aula" };

export default async function NovaAula({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ numero?: string }>;
}) {
  await exigirTela("estudos", true);
  const { id } = await params;
  const { numero } = await searchParams;

  const turma = await obterTurma(id);
  if (!turma) notFound();

  // Sugere o próximo número livre, mas deixa mudar: turma pode pular aula.
  const aulas = await listarAulas(id);
  const sugerido =
    Number(numero) || (aulas.length > 0 ? Math.max(...aulas.map((a) => a.numero)) + 1 : 1);

  return (
    <PaginaManutencao
      voltarHref={`/gestao/estudos/${id}`}
      voltarRotulo={turma.nome}
      titulo="Nova aula"
    >
      <FormularioAula turmaId={id} numeroSugerido={sugerido} />
    </PaginaManutencao>
  );
}
