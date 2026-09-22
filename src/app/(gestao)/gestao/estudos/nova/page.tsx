import type { Metadata } from "next";
import { PaginaManutencao } from "@/components/gestao/PaginaManutencao";
import { FormularioTurma } from "@/components/gestao/FormulariosEstudo";
import { exigirTela } from "@/lib/auth/permissoes";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Nova turma" };

export default async function NovaTurma() {
  await exigirTela("estudos", true);

  return (
    <PaginaManutencao
      voltarHref="/gestao/estudos"
      voltarRotulo="Voltar às turmas"
      titulo="Nova turma"
      descricao="Depois de criar, você matricula os alunos e planeja as aulas."
    >
      <FormularioTurma />
    </PaginaManutencao>
  );
}
