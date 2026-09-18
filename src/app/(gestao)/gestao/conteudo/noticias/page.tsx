import Link from "next/link";
import type { Metadata } from "next";
import { Eye, EyeOff, Pencil, Star } from "lucide-react";
import { Cartao, Etiqueta, Vazio } from "@/components/ui";
import { BotaoExcluir } from "@/components/gestao/BotaoExcluir";
import {
  CabecalhoLista, FiltrosLista, OPCOES_PUBLICACAO, Paginacao,
} from "@/components/gestao/Lista";
import { formatarData } from "@/lib/datas";
import { exigirTela } from "@/lib/auth/permissoes";
import { criarClienteServidor } from "@/lib/supabase/server";
import { alternarPublicacaoNoticia, excluirNoticia } from "@/lib/gestao/acoes-conteudo";
import type { Noticia } from "@/lib/tipos";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Notícias" };

const BASE = "/gestao/conteudo/noticias";
const POR_PAGINA = 20;

export default async function ListaNoticias({
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
    .from("noticias")
    .select("*", { count: "exact" })
    .order("criado_em", { ascending: false })
    .range((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA - 1);

  if (status === "publicado" || status === "rascunho") consulta = consulta.eq("status", status);
  if (busca) {
    const alvo = busca.replace(/[%,()]/g, " ");
    consulta = consulta.or(`titulo.ilike.%${alvo}%,resumo.ilike.%${alvo}%,corpo.ilike.%${alvo}%`);
  }

  const { data, count } = await consulta;
  const noticias = (data ?? []) as Noticia[];
  const total = count ?? 0;

  const [{ count: totalGeral }, { count: totalPublicadas }] = await Promise.all([
    supabase.from("noticias").select("id", { count: "exact", head: true }),
    supabase.from("noticias").select("id", { count: "exact", head: true }).eq("status", "publicado"),
  ]);

  async function publicar(dados: FormData) {
    "use server";
    await alternarPublicacaoNoticia(String(dados.get("id")), dados.get("publicar") === "1");
  }

  async function excluir(dados: FormData) {
    "use server";
    await excluirNoticia(String(dados.get("id")));
  }

  return (
    <div className="mx-auto max-w-5xl">
      <CabecalhoLista
        titulo="Notícias"
        descricao={`${totalGeral ?? 0} cadastradas · ${totalPublicadas ?? 0} publicadas no site.`}
        novoHref={`${BASE}/nova`}
        novoRotulo="Nova notícia"
        podeEditar={podeEditar}
      />

      <FiltrosLista
        base={BASE}
        busca={busca}
        status={status}
        opcoesStatus={OPCOES_PUBLICACAO}
        placeholder="Título, resumo ou texto da notícia"
      />

      <div className="mt-6">
        {noticias.length === 0 ? (
          <Vazio
            mensagem={
              busca || status
                ? "Nenhuma notícia para os filtros escolhidos."
                : "Nenhuma notícia cadastrada."
            }
          />
        ) : (
          <Cartao className="overflow-x-auto">
            <table className="w-full min-w-[46rem] text-sm">
              <thead>
                <tr className="border-b border-borda bg-marca-50/60 text-left">
                  <th className="px-5 py-3 font-semibold text-texto">Notícia</th>
                  <th className="w-32 px-4 py-3 font-semibold text-texto">Publicação</th>
                  <th className="w-40 px-4 py-3 font-semibold text-texto">Situação</th>
                  {podeEditar ? <th className="w-32 px-4 py-3" /> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                {noticias.map((n) => {
                  const publicada = n.status === "publicado";
                  return (
                    <tr key={n.id} className="align-top hover:bg-marca-50/40">
                      <td className="px-5 py-3">
                        <Link
                          href={`${BASE}/${n.id}`}
                          className="line-clamp-2 font-medium text-texto hover:text-marca-700"
                        >
                          {n.titulo}
                        </Link>
                        <p className="mt-0.5 truncate text-xs text-texto-suave">/{n.slug}</p>
                      </td>
                      <td className="px-4 py-3 text-texto-suave">
                        {formatarData(n.publicado_em ?? n.criado_em)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Etiqueta tom={publicada ? "verde" : "ambar"}>
                            {publicada ? "Publicada" : "Rascunho"}
                          </Etiqueta>
                          {n.destaque_carrossel ? (
                            <Etiqueta tom="marca">
                              <Star className="h-3 w-3" /> Carrossel
                            </Etiqueta>
                          ) : null}
                        </div>
                      </td>
                      {podeEditar ? (
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`${BASE}/${n.id}`}
                              aria-label="Editar"
                              title="Editar"
                              className="grid h-9 w-9 place-items-center rounded-full text-marca-700 hover:bg-marca-100"
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>

                            <form action={publicar}>
                              <input type="hidden" name="id" value={n.id} />
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
                              id={n.id}
                              rotulo="Excluir notícia"
                              mensagem={`Excluir a notícia "${n.titulo}"? Esta ação não pode ser desfeita.`}
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

      <Paginacao
        base={BASE}
        pagina={pagina}
        total={total}
        porPagina={POR_PAGINA}
        filtros={{ q: busca, status }}
      />
    </div>
  );
}
