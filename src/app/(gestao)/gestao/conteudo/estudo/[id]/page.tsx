import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ExternalLink, Trash2 } from "lucide-react";
import {
  AreaTexto, Campo, Cartao, CartaoCorpo, Etiqueta, Rotulo, Vazio,
} from "@/components/ui";
import { FormularioConteudo } from "@/components/gestao/Formulario";
import { exigirTela } from "@/lib/auth/permissoes";
import { criarClienteServidor } from "@/lib/supabase/server";
import {
  excluirParecer, excluirQuestao, salvarParecer, salvarQuestao,
} from "@/lib/gestao/acoes-conteudo";
import type { Parecer, Questao } from "@/lib/tipos";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Editar questão" };

export default async function EditorQuestao({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const sessao = await exigirTela("conteudo");
  const podeEditar = sessao.podeEditar("conteudo");
  const { id } = await params;
  const nova = id === "nova";

  let questao: Questao | null = null;
  let pareceres: Parecer[] = [];

  if (!nova) {
    const supabase = await criarClienteServidor();
    const { data } = await supabase.from("questoes").select("*").eq("id", id).maybeSingle();
    if (!data) notFound();
    questao = data as Questao;

    const { data: lista } = await supabase
      .from("pareceres")
      .select("*")
      .eq("questao_id", questao.id)
      .order("criado_em");
    pareceres = (lista ?? []) as Parecer[];
  }

  const publicada = questao?.status === "publicado";

  async function excluir(dados: FormData) {
    "use server";
    await excluirParecer(String(dados.get("id")));
  }

  async function apagarQuestao(dados: FormData) {
    "use server";
    await excluirQuestao(String(dados.get("id")));
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/gestao/conteudo/estudo"
        className="inline-flex items-center gap-1 text-sm font-medium text-azul-700 hover:text-azul-800"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar às questões
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-texto">
          {nova ? "Nova questão" : `Questão ${questao!.numero}`}
        </h1>
        {questao ? (
          <Etiqueta tom={publicada ? "verde" : "ambar"}>
            {publicada ? "Publicada" : "Rascunho"}
          </Etiqueta>
        ) : null}
        {publicada ? (
          <a
            href={`/estudo/${questao!.numero}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-azul-700 hover:text-azul-800"
          >
            ver no site <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : null}
      </div>

      {/* Questão */}
      <Cartao className="mt-6">
        <CartaoCorpo className="sm:p-8">
          {podeEditar ? (
            <FormularioConteudo acao={salvarQuestao} rotuloPublicar="Publicar questão">
              {questao ? <input type="hidden" name="id" value={questao.id} /> : null}

              <div className="grid gap-5 sm:grid-cols-[8rem_1fr]">
                <div>
                  <Rotulo htmlFor="numero">Número</Rotulo>
                  <Campo
                    id="numero"
                    name="numero"
                    type="number"
                    required
                    defaultValue={questao?.numero ?? ""}
                  />
                </div>
                <div>
                  <Rotulo htmlFor="parte">Parte</Rotulo>
                  <Campo id="parte" name="parte" defaultValue={questao?.parte ?? ""} />
                </div>
              </div>

              <div>
                <Rotulo htmlFor="capitulo">Capítulo</Rotulo>
                <Campo id="capitulo" name="capitulo" defaultValue={questao?.capitulo ?? ""} />
              </div>

              <div>
                <Rotulo htmlFor="pergunta">Pergunta</Rotulo>
                <AreaTexto
                  id="pergunta"
                  name="pergunta"
                  rows={3}
                  required
                  defaultValue={questao?.pergunta ?? ""}
                />
              </div>

              <div>
                <Rotulo htmlFor="resposta">Resposta da obra</Rotulo>
                <AreaTexto
                  id="resposta"
                  name="resposta"
                  rows={10}
                  required
                  defaultValue={questao?.resposta ?? ""}
                />
              </div>
            </FormularioConteudo>
          ) : (
            <div className="space-y-4">
              <Leitura rotulo="Capítulo" valor={questao?.capitulo} />
              <Leitura rotulo="Pergunta" valor={questao?.pergunta} />
              <Leitura rotulo="Resposta da obra" valor={questao?.resposta} />
            </div>
          )}
        </CartaoCorpo>
      </Cartao>

      {/* Pareceres */}
      {questao ? (
        <Cartao className="mt-6">
          <CartaoCorpo className="sm:p-8">
            <h2 className="mb-5 font-semibold text-texto">
              Pareceres {pareceres.length > 0 ? `(${pareceres.length})` : ""}
            </h2>

            {pareceres.length === 0 ? (
              <div className="mb-6">
                <Vazio mensagem="Nenhum parecer registrado para esta questão." />
              </div>
            ) : (
              <div className="mb-6 space-y-3">
                {pareceres.map((p) => (
                  <div key={p.id} className="rounded-xl border border-borda bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <Etiqueta tom={p.status === "publicado" ? "verde" : "ambar"}>
                        {p.status === "publicado" ? "Publicado" : "Rascunho"}
                      </Etiqueta>
                      {podeEditar ? (
                        <form action={excluir}>
                          <input type="hidden" name="id" value={p.id} />
                          <button
                            type="submit"
                            aria-label="Excluir parecer"
                            className="grid h-8 w-8 place-items-center rounded-full text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </form>
                      ) : null}
                    </div>
                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-texto">
                      {p.texto}
                    </p>
                    {p.autor_nome ? (
                      <p className="mt-2 text-xs text-texto-suave">— {p.autor_nome}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}

            {podeEditar ? (
              <div className="border-t border-borda pt-6">
                <h3 className="mb-4 text-sm font-semibold text-texto-suave">
                  Registrar novo parecer
                </h3>
                <FormularioConteudo acao={salvarParecer} key={`parecer-${questao.id}`}>
                  <input type="hidden" name="questao_id" value={questao.id} />
                  <div>
                    <Rotulo htmlFor="autor_nome">Médium / autor do parecer</Rotulo>
                    <Campo id="autor_nome" name="autor_nome" />
                  </div>
                  <div>
                    <Rotulo htmlFor="texto">Parecer</Rotulo>
                    <AreaTexto id="texto" name="texto" rows={8} required />
                  </div>
                </FormularioConteudo>
              </div>
            ) : null}
          </CartaoCorpo>
        </Cartao>
      ) : null}

      {questao && podeEditar ? (
        <form action={apagarQuestao} className="mt-6">
          <input type="hidden" name="id" value={questao.id} />
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50"
          >
            <Trash2 className="h-4 w-4" /> Excluir esta questão e seus pareceres
          </button>
        </form>
      ) : null}
    </div>
  );
}

function Leitura({ rotulo, valor }: { rotulo: string; valor?: string | null }) {
  return (
    <div>
      <p className="text-sm font-medium text-texto-suave">{rotulo}</p>
      <p className="mt-1 whitespace-pre-line text-texto">{valor || "—"}</p>
    </div>
  );
}
