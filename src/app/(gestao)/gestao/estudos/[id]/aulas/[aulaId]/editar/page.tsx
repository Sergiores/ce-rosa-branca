import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PaginaManutencao } from "@/components/gestao/PaginaManutencao";
import { FormularioAula } from "@/components/gestao/FormulariosEstudo";
import { exigirTela } from "@/lib/auth/permissoes";
import { obterAula } from "@/lib/gestao/estudos";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Editar aula" };

export default async function EditarAula({
  params,
}: {
  params: Promise<{ id: string; aulaId: string }>;
}) {
  await exigirTela("estudos", true);
  const { id, aulaId } = await params;

  const aula = await obterAula(aulaId);
  if (!aula || aula.turma_id !== id) notFound();

  return (
    <PaginaManutencao
      voltarHref={`/gestao/estudos/${id}/aulas/${aulaId}`}
      voltarRotulo={`Aula ${aula.numero}`}
      titulo="Editar aula"
    >
      <FormularioAula turmaId={id} aula={aula} />
    </PaginaManutencao>
  );
}
