import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AreaTexto, Campo, Rotulo, Selecao } from "@/components/ui";
import { PaginaManutencao } from "@/components/gestao/PaginaManutencao";
import { FormularioSimples } from "@/components/gestao/Formulario";
import { exigirTela } from "@/lib/auth/permissoes";
import { obterAula } from "@/lib/gestao/estudos";
import { salvarMaterial } from "@/lib/gestao/acoes-estudos";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Novo material" };

export default async function NovoMaterial({
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
      voltarRotulo={`Aula ${aula.numero} — ${aula.titulo}`}
      titulo="Acrescentar material"
      descricao="Vídeo, link ou uma anotação que apoie esta aula."
    >
      <FormularioSimples acao={salvarMaterial} rotulo="Acrescentar">
        <input type="hidden" name="aula_id" value={aulaId} />
        <input type="hidden" name="turma_id" value={id} />

        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <Rotulo htmlFor="tipo">Tipo</Rotulo>
            <Selecao id="tipo" name="tipo" defaultValue="link">
              <option value="link">Link</option>
              <option value="video">Vídeo</option>
              <option value="texto">Anotação</option>
            </Selecao>
          </div>

          <div className="sm:col-span-2">
            <Rotulo htmlFor="titulo">Título</Rotulo>
            <Campo id="titulo" name="titulo" required />
          </div>

          <div className="sm:col-span-3">
            <Rotulo htmlFor="url">Endereço (vídeo ou link)</Rotulo>
            <Campo id="url" name="url" type="url" placeholder="https://..." />
            <p className="mt-1 text-xs text-texto-suave">
              Anotação não precisa de endereço — o texto vai na descrição.
            </p>
          </div>

          <div className="sm:col-span-3">
            <Rotulo htmlFor="descricao">Descrição</Rotulo>
            <AreaTexto id="descricao" name="descricao" rows={3} />
          </div>
        </div>
      </FormularioSimples>
    </PaginaManutencao>
  );
}
