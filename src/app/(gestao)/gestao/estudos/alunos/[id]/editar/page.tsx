import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Etiqueta } from "@/components/ui";
import { PaginaManutencao } from "@/components/gestao/PaginaManutencao";
import { FormularioAluno } from "@/components/gestao/FormulariosEstudo";
import { exigirTela } from "@/lib/auth/permissoes";
import { obterAluno } from "@/lib/gestao/estudos";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Editar aluno" };

export default async function EditarAluno({ params }: { params: Promise<{ id: string }> }) {
  await exigirTela("estudos", true);
  const { id } = await params;

  const aluno = await obterAluno(id);
  if (!aluno) notFound();

  return (
    <PaginaManutencao
      voltarHref={`/gestao/estudos/alunos/${id}`}
      voltarRotulo={aluno.nome}
      titulo="Editar aluno"
      descricao={
        aluno.profile_id
          ? undefined
          : "Para o aluno acessar a área dele, o e-mail aqui precisa ser o mesmo com que ele cria a conta."
      }
      acoes={
        aluno.profile_id ? <Etiqueta tom="verde">Conta vinculada</Etiqueta> : null
      }
    >
      <FormularioAluno aluno={aluno} />
    </PaginaManutencao>
  );
}
