import Link from "next/link";
import type { Metadata } from "next";
import { Eye, EyeOff, Pencil } from "lucide-react";
import { Cartao, Etiqueta, Vazio } from "@/components/ui";
import { BotaoExcluir } from "@/components/gestao/BotaoExcluir";
import {
  CabecalhoLista, FiltrosLista, OPCOES_PUBLICACAO, Paginacao,
} from "@/components/gestao/Lista";
import { exigirTela } from "@/lib/auth/permissoes";
import { criarClienteServidor } from "@/lib/supabase/server";
import { alternarPublicacao, excluirProjeto } from "@/lib/gestao/acoes-conteudo";
import type { Projeto } from "@/lib/tipos";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Projetos" };

const BASE = "/gestao/conteudo/projetos";
const POR_PAGINA = 20;

export default async function ListaProjetos({
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
    .from("projetos")
    .select("*", { count: "exact" })
    .order("ordem")
    .range((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA - 1);

  if (status === "publicado" || status === "rascunho") consulta = consulta.eq("status", status);
  if (busca) {
    const alvo = busca.replace(/[%,()]/g, " ");
    consulta = consulta.or(`titulo.ilike.%${alvo}%,descricao.ilike.%${alvo}%`);
  }

  const { data, count } = await consulta;
  const projetos = (data ?? []) as Projeto[];
  const total = count ?? 0;

  async function publicar(dados: FormData) {
    "use server";
    await alternarPublicacao("projetos", String(dados.get("id")), dados.get("publicar") === "1");
  }

  async function excluir(dados: FormData) {
    "use server";
    await excluirProjeto(String(dados.get("id")));
  }

  return (
    <div className="mx-auto max-w-5xl">
      <CabecalhoLista
        titulo="Projetos"
        descricao="Frentes de trabalho exibidas no site, na ordem definida abaixo."
        novoHref={`${BASE}/novo`}
        novoRotulo="Novo projeto"
        podeEditar={podeEditar}
      />

      <FiltrosLista
        base={BASE}
        busca={busca}
        status={status}
        opcoesStatus={OPCOES_PUBLICACAO}
        placeholder="Título ou descrição"
      />

      <div className="mt-6">
        {projetos.length === 0 ? (
          <Vazio
            mensagem={
              busca || status
                ? "Nenhum projeto para os filtros escolhidos."
                : "Nenhum projeto cadastrado."
            }
          />
        ) : (
          <Cartao className="overflow-x-auto">
            <table className="w-full min-w-[42rem] text-sm">
              <thead>
                <tr className="border-b border-borda bg-azul-50/60 text-left">
                  <th className="w-20 px-5 py-3 font-semibold text-texto">Ordem</th>
                  <th className="px-4 py-3 font-semibold text-texto">Projeto</th>
                  <th className="w-36 px-4 py-3 font-semibold text-texto">Situação</th>
                  {podeEditar ? <th className="w-32 px-4 py-3" /> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                {projetos.map((p) => {
                  const publicado = p.status === "publicado";
                  return (
                    <tr key={p.id} className="align-top hover:bg-azul-50/40">
                      <td className="px-5 py-3 font-medium text-azul-700">
                        <Link href={`${BASE}/${p.id}`}>{p.ordem}</Link>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`${BASE}/${p.id}`}
                          className="font-medium text-texto hover:text-azul-700"
                        >
                          {p.titulo}
                        </Link>
                        {p.descricao ? (
                          <p className="mt-0.5 line-clamp-1 text-xs text-texto-suave">
                            {p.descricao}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <Etiqueta tom={publicado ? "verde" : "ambar"}>
                          {publicado ? "Publicado" : "Rascunho"}
                        </Etiqueta>
                      </td>
                      {podeEditar ? (
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`${BASE}/${p.id}`}
                              aria-label="Editar"
                              title="Editar"
                              className="grid h-9 w-9 place-items-center rounded-full text-azul-700 hover:bg-azul-100"
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>
                            <form action={publicar}>
                              <input type="hidden" name="id" value={p.id} />
                              <input type="hidden" name="publicar" value={publicado ? "0" : "1"} />
                              <button
                                type="submit"
                                aria-label={publicado ? "Voltar a rascunho" : "Publicar"}
                                title={publicado ? "Voltar a rascunho" : "Publicar"}
                                className="grid h-9 w-9 place-items-center rounded-full text-azul-700 hover:bg-azul-100"
                              >
                                {publicado ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </form>
                            <BotaoExcluir
                              acao={excluir}
                              id={p.id}
                              rotulo="Excluir projeto"
                              mensagem={`Excluir o projeto "${p.titulo}"? Esta ação não pode ser desfeita.`}
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
