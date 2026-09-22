import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ExternalLink, FileText, Link2, Video } from "lucide-react";
import {
  AreaTexto,
  Campo,
  Cartao,
  CartaoCorpo,
  Etiqueta,
  Rotulo,
  Selecao,
  Vazio,
} from "@/components/ui";
import { FormularioSimples } from "@/components/gestao/Formulario";
import { BotaoExcluir } from "@/components/gestao/BotaoExcluir";
import { Chamada } from "@/components/gestao/Chamada";
import { formatarData } from "@/lib/datas";
import { exigirTela } from "@/lib/auth/permissoes";
import {
  listarMateriais,
  listarMatriculas,
  obterAula,
  obterPresencas,
  obterTurma,
} from "@/lib/gestao/estudos";
import {
  excluirAula,
  excluirMaterial,
  salvarAula,
  salvarChamada,
  salvarMaterial,
} from "@/lib/gestao/acoes-estudos";
import type { Aula } from "@/lib/tipos";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Aula" };

const ICONE_MATERIAL = { video: Video, link: Link2, texto: FileText };

export default async function PaginaAula({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; aulaId: string }>;
  searchParams: Promise<{ numero?: string }>;
}) {
  const sessao = await exigirTela("estudos");
  const { id, aulaId } = await params;
  const { numero } = await searchParams;
  const nova = aulaId === "nova";
  const podeEditar = sessao.podeEditar("estudos");

  const turma = await obterTurma(id);
  if (!turma) notFound();

  let aula: Aula | null = null;
  if (!nova) {
    aula = await obterAula(aulaId);
    if (!aula || aula.turma_id !== id) notFound();
  }

  const [materiais, matriculas, presencas] = nova
    ? [[], [], new Map()]
    : await Promise.all([listarMateriais(aulaId), listarMatriculas(id), obterPresencas(aulaId)]);

  // Quem desistiu não entra na chamada das aulas seguintes.
  const chamada = matriculas.filter((m) => m.status !== "desistente");

  async function excluir(dados: FormData) {
    "use server";
    await excluirAula(dados);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={`/gestao/estudos/${id}`}
        className="inline-flex items-center gap-1 text-sm font-medium text-marca-700 hover:text-marca-800"
      >
        <ArrowLeft className="h-4 w-4" /> {turma.nome}
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-texto">
          {nova ? "Nova aula" : `Aula ${aula!.numero} — ${aula!.titulo}`}
        </h1>
        {!nova && podeEditar ? (
          <BotaoExcluir
            acao={excluir}
            id={aulaId}
            campos={{ turma_id: id }}
            comTexto="Excluir aula"
            mensagem="Excluir esta aula apaga o plano, os materiais e a chamada dela. Confirma?"
          />
        ) : null}
      </div>

      {/* Plano da aula */}
      <Cartao className="mt-6">
        <CartaoCorpo className="sm:p-8">
          <FormularioSimples acao={salvarAula} aoSalvar="Aula salva.">
            <input type="hidden" name="id" value={nova ? "" : aulaId} />
            <input type="hidden" name="turma_id" value={id} />

            {/* O aluno matriculado le o plano e as observacoes na area dele.
                Anotacao interna sobre aluno nao deve entrar aqui. */}
            <p className="rounded-xl bg-marca-50 px-4 py-3 text-sm text-texto-suave">
              O planejamento e as observações aparecem para os alunos matriculados na área deles.
            </p>

            <div className="grid gap-5 sm:grid-cols-4">
              <div>
                <Rotulo htmlFor="numero">Nº</Rotulo>
                <Campo
                  id="numero"
                  name="numero"
                  type="number"
                  min={1}
                  required
                  defaultValue={aula?.numero ?? numero ?? 1}
                  disabled={!podeEditar}
                />
              </div>

              <div className="sm:col-span-2">
                <Rotulo htmlFor="titulo">Título</Rotulo>
                <Campo
                  id="titulo"
                  name="titulo"
                  required
                  defaultValue={aula?.titulo ?? ""}
                  placeholder="Ex.: A prece segundo o Espiritismo"
                  disabled={!podeEditar}
                />
              </div>

              <div>
                <Rotulo htmlFor="data">Data</Rotulo>
                <Campo
                  id="data"
                  name="data"
                  type="date"
                  required
                  defaultValue={aula?.data ?? ""}
                  disabled={!podeEditar}
                />
              </div>

              <div className="sm:col-span-4">
                <Rotulo htmlFor="plano">Planejamento da aula</Rotulo>
                <AreaTexto
                  id="plano"
                  name="plano"
                  rows={8}
                  defaultValue={aula?.plano ?? ""}
                  placeholder={"Objetivo do encontro, roteiro, textos de apoio, dinâmica..."}
                  disabled={!podeEditar}
                />
              </div>

              <div>
                <Rotulo htmlFor="status">Situação</Rotulo>
                <Selecao
                  id="status"
                  name="status"
                  defaultValue={aula?.status ?? "planejada"}
                  disabled={!podeEditar}
                >
                  <option value="planejada">Planejada</option>
                  <option value="realizada">Realizada</option>
                  <option value="cancelada">Cancelada</option>
                </Selecao>
              </div>

              <div className="sm:col-span-3">
                <Rotulo htmlFor="observacoes">Observações</Rotulo>
                <Campo
                  id="observacoes"
                  name="observacoes"
                  defaultValue={aula?.observacoes ?? ""}
                  disabled={!podeEditar}
                />
              </div>
            </div>
          </FormularioSimples>
        </CartaoCorpo>
      </Cartao>

      {nova ? (
        <p className="mt-6 text-sm text-texto-suave">
          Salve a aula para acrescentar materiais e fazer a chamada.
        </p>
      ) : (
        <>
          {/* Materiais complementares */}
          <section className="mt-10">
            <h2 className="text-lg font-semibold text-texto">Materiais complementares</h2>
            <p className="mt-1 text-sm text-texto-suave">
              Vídeos, links e anotações que apoiam esta aula.
            </p>

            {materiais.length === 0 ? (
              <div className="mt-5">
                <Vazio mensagem="Nenhum material nesta aula ainda." />
              </div>
            ) : (
              <Cartao className="mt-5 divide-y divide-borda overflow-hidden">
                {materiais.map((m) => {
                  const Icone = ICONE_MATERIAL[m.tipo];
                  return (
                    <div key={m.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                      <Icone className="h-5 w-5 shrink-0 text-marca-600" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-texto">{m.titulo}</p>
                        {m.descricao ? (
                          <p className="mt-0.5 text-sm text-texto-suave">{m.descricao}</p>
                        ) : null}
                        {m.url ? (
                          <a
                            href={m.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-flex items-center gap-1 text-sm text-marca-700 hover:text-marca-800"
                          >
                            Abrir <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        ) : null}
                      </div>
                      {podeEditar ? (
                        <BotaoExcluir
                          acao={excluirMaterial}
                          id={m.id}
                          campos={{ aula_id: aulaId, turma_id: id }}
                          mensagem={`Excluir o material "${m.titulo}"?`}
                        />
                      ) : null}
                    </div>
                  );
                })}
              </Cartao>
            )}

            {podeEditar ? (
              <Cartao className="mt-5">
                <CartaoCorpo>
                  <h3 className="mb-4 font-semibold text-texto">Acrescentar material</h3>
                  <FormularioSimples
                    acao={salvarMaterial}
                    rotulo="Acrescentar"
                    aoSalvar="Material acrescentado."
                  >
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
                        <Rotulo htmlFor="titulo-material">Título</Rotulo>
                        <Campo id="titulo-material" name="titulo" required />
                      </div>

                      <div className="sm:col-span-3">
                        <Rotulo htmlFor="url">Endereço (vídeo ou link)</Rotulo>
                        <Campo
                          id="url"
                          name="url"
                          type="url"
                          placeholder="https://..."
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <Rotulo htmlFor="descricao-material">Descrição</Rotulo>
                        <AreaTexto id="descricao-material" name="descricao" rows={2} />
                      </div>
                    </div>
                  </FormularioSimples>
                </CartaoCorpo>
              </Cartao>
            ) : null}
          </section>

          {/* Chamada */}
          <section className="mt-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-texto">Lista de chamada</h2>
                <p className="mt-1 text-sm text-texto-suave">
                  Aula de {formatarData(aula!.data)}
                  {presencas.size > 0 ? " · chamada já registrada" : ""}
                </p>
              </div>
              {presencas.size > 0 ? <Etiqueta tom="verde">Registrada</Etiqueta> : null}
            </div>

            {chamada.length === 0 ? (
              <div className="mt-5">
                <Vazio mensagem="Nenhum aluno matriculado nesta turma para chamar." />
              </div>
            ) : (
              <Chamada
                acao={salvarChamada}
                aulaId={aulaId}
                turmaId={id}
                podeEditar={podeEditar}
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
          </section>
        </>
      )}
    </div>
  );
}
