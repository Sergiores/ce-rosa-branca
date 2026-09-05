import type { Metadata } from "next";
import { Search, Trash2, X } from "lucide-react";
import {
  AreaTexto, Botao, Campo, Cartao, CartaoCorpo, Etiqueta, Rotulo, Vazio,
} from "@/components/ui";
import { FormularioConteudo } from "@/components/gestao/Formulario";
import { exigirTela } from "@/lib/auth/permissoes";
import { criarClienteServidor } from "@/lib/supabase/server";
import { excluirParecer, salvarParecer, salvarQuestao } from "@/lib/gestao/acoes-conteudo";
import type { Parecer, Questao } from "@/lib/tipos";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Livro dos Espíritos" };

export default async function EstudoGestao({
  searchParams,
}: {
  searchParams: Promise<{ questao?: string; editar?: string; q?: string }>;
}) {
  await exigirTela("conteudo");
  const { questao: questaoId, editar, q } = await searchParams;
  const busca = q?.trim() ?? "";

  const supabase = await criarClienteServidor();

  // A gestao enxerga rascunhos tambem — o filtro de status vale so para o site.
  let consulta = supabase.from("questoes").select("*").order("numero");
  if (busca) {
    const numero = Number(busca);
    const alvo = busca.replace(/[%,()]/g, " ");
    consulta = Number.isInteger(numero)
      ? consulta.or(`numero.eq.${numero},pergunta.ilike.%${alvo}%,resposta.ilike.%${alvo}%`)
      : consulta.or(`pergunta.ilike.%${alvo}%,resposta.ilike.%${alvo}%`);
  }
  const { data: dadosQuestoes } = await consulta;
  const questoes = (dadosQuestoes ?? []) as Questao[];

  const selecionada = questoes.find((x) => x.id === questaoId) ?? questoes[0];
  const emEdicaoQuestao = questoes.find((x) => x.id === editar);

  let pareceres: Parecer[] = [];
  if (selecionada) {
    const { data } = await supabase
      .from("pareceres")
      .select("*")
      .eq("questao_id", selecionada.id)
      .order("criado_em");
    pareceres = (data ?? []) as Parecer[];
  }

  const preservaBusca = busca ? `&q=${encodeURIComponent(busca)}` : "";

  async function excluir(dados: FormData) {
    "use server";
    await excluirParecer(String(dados.get("id")));
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-semibold tracking-tight text-texto">
        Estudo do Livro dos Espíritos
      </h1>
      <p className="mt-1 text-texto-suave">
        Cadastre a questão com a resposta da obra e registre o parecer dos médiuns.
        Rascunhos não aparecem no site.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[22rem_1fr]">
        {/* Lista com busca */}
        <div>
          <form className="mb-3 flex gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-texto-suave" />
              <Campo
                name="q"
                defaultValue={busca}
                placeholder="Número ou palavra"
                className="pl-10"
                aria-label="Buscar questão"
              />
            </div>
            <Botao type="submit" tamanho="sm">
              Buscar
            </Botao>
            {busca ? (
              <a
                href="/gestao/conteudo/estudo"
                aria-label="Limpar busca"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-texto-suave hover:bg-azul-50"
              >
                <X className="h-4 w-4" />
              </a>
            ) : null}
          </form>

          {busca ? (
            <p className="mb-2 text-xs text-texto-suave">
              {questoes.length} resultado(s) para “{busca}”.
            </p>
          ) : null}

          <Cartao className="max-h-[30rem] overflow-y-auto">
            {questoes.length === 0 ? (
              <div className="p-5">
                <Vazio mensagem={busca ? "Nada encontrado." : "Nenhuma questão cadastrada."} />
              </div>
            ) : (
              <div className="divide-y divide-borda">
                {questoes.map((item) => (
                  <a
                    key={item.id}
                    href={`/gestao/conteudo/estudo?questao=${item.id}${preservaBusca}`}
                    className={
                      item.id === selecionada?.id
                        ? "block bg-azul-50 px-5 py-3"
                        : "block px-5 py-3 hover:bg-azul-50/60"
                    }
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-azul-700">
                        Questão {item.numero}
                      </span>
                      {item.status === "rascunho" ? (
                        <Etiqueta tom="ambar">Rascunho</Etiqueta>
                      ) : null}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-sm text-texto">{item.pergunta}</p>
                  </a>
                ))}
              </div>
            )}
          </Cartao>
        </div>

        <div className="space-y-6">
          {/* Formulário de questão */}
          <Cartao>
            <CartaoCorpo className="sm:p-7">
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <h2 className="font-semibold text-texto">
                  {emEdicaoQuestao ? `Editar questão ${emEdicaoQuestao.numero}` : "Nova questão"}
                </h2>
                {emEdicaoQuestao ? (
                  <Etiqueta tom={emEdicaoQuestao.status === "publicado" ? "verde" : "ambar"}>
                    {emEdicaoQuestao.status === "publicado" ? "Publicada" : "Rascunho"}
                  </Etiqueta>
                ) : null}
              </div>

              <FormularioConteudo
                acao={salvarQuestao}
                key={emEdicaoQuestao?.id ?? "nova-questao"}
                rotuloPublicar="Publicar questão"
              >
                {emEdicaoQuestao ? (
                  <input type="hidden" name="id" value={emEdicaoQuestao.id} />
                ) : null}

                <div className="grid gap-5 sm:grid-cols-[8rem_1fr_1fr]">
                  <div>
                    <Rotulo htmlFor="numero">Número</Rotulo>
                    <Campo
                      id="numero"
                      name="numero"
                      type="number"
                      required
                      defaultValue={emEdicaoQuestao?.numero ?? ""}
                    />
                  </div>
                  <div>
                    <Rotulo htmlFor="parte">Parte</Rotulo>
                    <Campo id="parte" name="parte" defaultValue={emEdicaoQuestao?.parte ?? ""} />
                  </div>
                  <div>
                    <Rotulo htmlFor="capitulo">Capítulo</Rotulo>
                    <Campo
                      id="capitulo"
                      name="capitulo"
                      defaultValue={emEdicaoQuestao?.capitulo ?? ""}
                    />
                  </div>
                </div>

                <div>
                  <Rotulo htmlFor="pergunta">Pergunta</Rotulo>
                  <AreaTexto
                    id="pergunta"
                    name="pergunta"
                    rows={3}
                    required
                    defaultValue={emEdicaoQuestao?.pergunta ?? ""}
                  />
                </div>

                <div>
                  <Rotulo htmlFor="resposta">Resposta da obra</Rotulo>
                  <AreaTexto
                    id="resposta"
                    name="resposta"
                    rows={6}
                    required
                    defaultValue={emEdicaoQuestao?.resposta ?? ""}
                  />
                </div>
              </FormularioConteudo>
            </CartaoCorpo>
          </Cartao>

          {/* Pareceres da questão selecionada */}
          {selecionada ? (
            <Cartao>
              <CartaoCorpo className="sm:p-7">
                <div className="mb-5 flex flex-wrap items-center gap-3">
                  <h2 className="font-semibold text-texto">
                    Pareceres — questão {selecionada.numero}
                  </h2>
                  <a
                    href={`/gestao/conteudo/estudo?questao=${selecionada.id}&editar=${selecionada.id}${preservaBusca}`}
                    className="text-sm font-medium text-azul-700 hover:text-azul-800"
                  >
                    editar esta questão
                  </a>
                </div>

                {pareceres.length > 0 ? (
                  <div className="mb-6 space-y-3">
                    {pareceres.map((p) => (
                      <div key={p.id} className="rounded-xl border border-borda bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <Etiqueta tom={p.status === "publicado" ? "verde" : "ambar"}>
                            {p.status === "publicado" ? "Publicado" : "Rascunho"}
                          </Etiqueta>
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
                        </div>
                        <p className="mt-2 whitespace-pre-line text-sm text-texto">{p.texto}</p>
                        {p.autor_nome ? (
                          <p className="mt-2 text-xs text-texto-suave">— {p.autor_nome}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}

                <FormularioConteudo acao={salvarParecer} key={`parecer-${selecionada.id}`}>
                  <input type="hidden" name="questao_id" value={selecionada.id} />

                  <div>
                    <Rotulo htmlFor="autor_nome">Médium / autor do parecer</Rotulo>
                    <Campo id="autor_nome" name="autor_nome" />
                  </div>

                  <div>
                    <Rotulo htmlFor="texto">Parecer</Rotulo>
                    <AreaTexto id="texto" name="texto" rows={6} required />
                  </div>
                </FormularioConteudo>
              </CartaoCorpo>
            </Cartao>
          ) : null}
        </div>
      </div>
    </div>
  );
}
