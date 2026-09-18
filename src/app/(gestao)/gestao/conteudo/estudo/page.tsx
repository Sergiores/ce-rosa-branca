import Link from "next/link";
import type { Metadata } from "next";
import { Eye, EyeOff, Pencil, Plus, Search, X } from "lucide-react";
import {
  Botao, BotaoLink, Campo, Cartao, Etiqueta, Rotulo, Selecao, Vazio,
} from "@/components/ui";
import { BotaoExcluir } from "@/components/gestao/BotaoExcluir";
import { exigirTela } from "@/lib/auth/permissoes";
import { criarClienteServidor } from "@/lib/supabase/server";
import { alternarPublicacaoQuestao, excluirQuestao } from "@/lib/gestao/acoes-conteudo";
import type { Questao } from "@/lib/tipos";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Livro dos Espíritos" };

const POR_PAGINA = 25;

type Linha = Questao & { pareceres: { count: number }[] };

export default async function NavegadorQuestoes({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; pagina?: string }>;
}) {
  const sessao = await exigirTela("conteudo");
  const podeEditar = sessao.podeEditar("conteudo");

  const filtros = await searchParams;
  const busca = filtros.q?.trim() ?? "";
  const status = filtros.status ?? "";
  const pagina = Math.max(1, Number(filtros.pagina ?? 1) || 1);

  const supabase = await criarClienteServidor();

  let consulta = supabase
    .from("questoes")
    .select("*, pareceres(count)", { count: "exact" })
    .order("numero")
    .range((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA - 1);

  if (status === "publicado" || status === "rascunho") consulta = consulta.eq("status", status);
  if (busca) {
    const numero = Number(busca);
    const alvo = busca.replace(/[%,()]/g, " ");
    consulta = Number.isInteger(numero)
      ? consulta.or(`numero.eq.${numero},pergunta.ilike.%${alvo}%,resposta.ilike.%${alvo}%`)
      : consulta.or(`pergunta.ilike.%${alvo}%,resposta.ilike.%${alvo}%`);
  }

  const { data, count } = await consulta;
  const questoes = (data ?? []) as Linha[];
  const total = count ?? 0;
  const ultimaPagina = Math.max(1, Math.ceil(total / POR_PAGINA));

  // Totais gerais, independentes do filtro aplicado.
  const [{ count: totalGeral }, { count: totalPublicadas }] = await Promise.all([
    supabase.from("questoes").select("id", { count: "exact", head: true }),
    supabase
      .from("questoes")
      .select("id", { count: "exact", head: true })
      .eq("status", "publicado"),
  ]);

  const paramsPara = (p: number) => {
    const u = new URLSearchParams();
    if (busca) u.set("q", busca);
    if (status) u.set("status", status);
    if (p > 1) u.set("pagina", String(p));
    const s = u.toString();
    return `/gestao/conteudo/estudo${s ? `?${s}` : ""}`;
  };

  async function publicar(dados: FormData) {
    "use server";
    await alternarPublicacaoQuestao(String(dados.get("id")), dados.get("publicar") === "1");
  }

  async function excluir(dados: FormData) {
    "use server";
    await excluirQuestao(String(dados.get("id")));
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-texto">
            Estudo do Livro dos Espíritos
          </h1>
          <p className="mt-1 text-texto-suave">
            {totalGeral ?? 0} questões cadastradas · {totalPublicadas ?? 0} publicadas no site.
          </p>
        </div>
        {podeEditar ? (
          <BotaoLink href="/gestao/conteudo/estudo/nova">
            <Plus className="h-4 w-4" /> Nova questão
          </BotaoLink>
        ) : null}
      </div>

      {/* Filtros */}
      <Cartao className="mt-6">
        <form className="grid gap-4 p-5 sm:grid-cols-[1fr_12rem_auto] sm:items-end">
          <div>
            <Rotulo htmlFor="q">Buscar</Rotulo>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-texto-suave" />
              <Campo
                id="q"
                name="q"
                defaultValue={busca}
                placeholder="Número da questão ou palavra do texto"
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <Rotulo htmlFor="status">Situação</Rotulo>
            <Selecao id="status" name="status" defaultValue={status}>
              <option value="">Todas</option>
              <option value="publicado">Publicadas</option>
              <option value="rascunho">Rascunhos</option>
            </Selecao>
          </div>
          <div className="flex gap-2">
            <Botao type="submit">Filtrar</Botao>
            {busca || status ? (
              <Link
                href="/gestao/conteudo/estudo"
                className="inline-flex h-11 items-center gap-2 rounded-full border border-borda bg-white px-5 text-sm font-medium text-texto-suave hover:bg-marca-50"
              >
                <X className="h-4 w-4" /> Limpar
              </Link>
            ) : null}
          </div>
        </form>
      </Cartao>

      {/* Navegador */}
      <div className="mt-6">
        {questoes.length === 0 ? (
          <Vazio
            mensagem={
              busca || status
                ? "Nenhuma questão para os filtros escolhidos."
                : "Nenhuma questão cadastrada."
            }
          />
        ) : (
          <Cartao className="overflow-x-auto">
            <table className="w-full min-w-[46rem] text-sm">
              <thead>
                <tr className="border-b border-borda bg-marca-50/60 text-left">
                  <th className="w-20 px-5 py-3 font-semibold text-texto">Nº</th>
                  <th className="px-4 py-3 font-semibold text-texto">Pergunta</th>
                  <th className="w-40 px-4 py-3 font-semibold text-texto">Situação</th>
                  <th className="w-24 px-4 py-3 text-center font-semibold text-texto">Pareceres</th>
                  {podeEditar ? <th className="w-32 px-4 py-3" /> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                {questoes.map((q) => {
                  const pareceres = q.pareceres?.[0]?.count ?? 0;
                  const publicada = q.status === "publicado";
                  return (
                    <tr key={q.id} className="align-top hover:bg-marca-50/40">
                      <td className="px-5 py-3 font-medium text-marca-700">
                        <Link href={`/gestao/conteudo/estudo/${q.id}`}>{q.numero}</Link>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/gestao/conteudo/estudo/${q.id}`}
                          className="line-clamp-2 text-texto hover:text-marca-700"
                        >
                          {q.pergunta}
                        </Link>
                        <p className="mt-0.5 truncate text-xs text-texto-suave">{q.capitulo}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Etiqueta tom={publicada ? "verde" : "ambar"}>
                          {publicada ? "Publicada" : "Rascunho"}
                        </Etiqueta>
                      </td>
                      <td className="px-4 py-3 text-center text-texto-suave">
                        {pareceres > 0 ? pareceres : "—"}
                      </td>
                      {podeEditar ? (
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/gestao/conteudo/estudo/${q.id}`}
                              aria-label="Editar"
                              title="Editar"
                              className="grid h-9 w-9 place-items-center rounded-full text-marca-700 hover:bg-marca-100"
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>

                            <form action={publicar}>
                              <input type="hidden" name="id" value={q.id} />
                              <input type="hidden" name="publicar" value={publicada ? "0" : "1"} />
                              <button
                                type="submit"
                                aria-label={publicada ? "Voltar a rascunho" : "Publicar"}
                                title={publicada ? "Voltar a rascunho" : "Publicar"}
                                className="grid h-9 w-9 place-items-center rounded-full text-marca-700 hover:bg-marca-100"
                              >
                                {publicada ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            </form>

                            <BotaoExcluir
                              acao={excluir}
                              id={q.id}
                              rotulo="Excluir questão"
                              mensagem={`Excluir a questão ${q.numero}${pareceres > 0 ? ` e seus ${pareceres} parecer(es)` : ""}? Esta ação não pode ser desfeita.`}
                            />
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Cartao>
        )}
      </div>

      {/* Paginação */}
      {total > POR_PAGINA ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-texto-suave">
            Mostrando {(pagina - 1) * POR_PAGINA + 1}–{Math.min(pagina * POR_PAGINA, total)} de{" "}
            {total}
          </p>
          <div className="flex items-center gap-2">
            {pagina > 1 ? (
              <Link
                href={paramsPara(pagina - 1)}
                className="rounded-full border border-borda bg-white px-4 py-2 text-sm font-medium text-marca-700 hover:bg-marca-50"
              >
                Anterior
              </Link>
            ) : null}
            <span className="text-sm text-texto-suave">
              página {pagina} de {ultimaPagina}
            </span>
            {pagina < ultimaPagina ? (
              <Link
                href={paramsPara(pagina + 1)}
                className="rounded-full border border-borda bg-white px-4 py-2 text-sm font-medium text-marca-700 hover:bg-marca-50"
              >
                Próxima
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
