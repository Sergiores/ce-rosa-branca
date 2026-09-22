import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PaginaManutencao } from "@/components/gestao/PaginaManutencao";
import { FormularioTurma } from "@/components/gestao/FormulariosEstudo";
import { exigirTela } from "@/lib/auth/permissoes";
import { obterTurma } from "@/lib/gestao/estudos";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Editar turma" };

export default async function EditarTurma({ params }: { params: Promise<{ id: string }> }) {
  await exigirTela("estudos", true);
  const { id } = await params;

  const turma = await obterTurma(id);
  if (!turma) notFound();

  return (
    <PaginaManutencao
      voltarHref={`/gestao/estudos/${id}`}
      voltarRotulo={turma.nome}
      titulo="Editar turma"
    >
      <FormularioTurma turma={turma} />
    </PaginaManutencao>
  );
}
