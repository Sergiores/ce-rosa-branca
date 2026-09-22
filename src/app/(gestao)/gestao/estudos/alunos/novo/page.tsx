import type { Metadata } from "next";
import { PaginaManutencao } from "@/components/gestao/PaginaManutencao";
import { FormularioAluno } from "@/components/gestao/FormulariosEstudo";
import { exigirTela } from "@/lib/auth/permissoes";
import { pessoasVinculaveis } from "@/lib/gestao/estudos";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Cadastrar aluno" };

export default async function NovoAluno() {
  await exigirTela("estudos", true);
  const pessoas = await pessoasVinculaveis("aluno");

  return (
    <PaginaManutencao
      voltarHref="/gestao/estudos/alunos"
      voltarRotulo="Voltar aos alunos"
      titulo="Cadastrar aluno"
      descricao="Confira antes na lista se a pessoa já não está cadastrada."
    >
      <FormularioAluno pessoas={pessoas} />
    </PaginaManutencao>
  );
}
