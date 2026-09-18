import Link from "next/link";
import type { Metadata } from "next";
import { Eye, EyeOff, MapPin, Pencil } from "lucide-react";
import { Cartao, Etiqueta, Vazio } from "@/components/ui";
import { BotaoExcluir } from "@/components/gestao/BotaoExcluir";
import {
  CabecalhoLista, FiltrosLista, OPCOES_PUBLICACAO, Paginacao,
} from "@/components/gestao/Lista";
import { formatarDataHora } from "@/lib/datas";
import { exigirTela } from "@/lib/auth/permissoes";
import { criarClienteServidor } from "@/lib/supabase/server";
import { alternarPublicacao, excluirEvento } from "@/lib/gestao/acoes-conteudo";
import type { Evento } from "@/lib/tipos";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Eventos" };

const BASE = "/gestao/conteudo/eventos";
const POR_PAGINA = 20;

export default async function ListaEventos({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; quando?: string; pagina?: string }>;
}) {
  const sessao = await exigirTela("conteudo");
  const podeEditar = sessao.podeEditar("conteudo");

  const filtros = await searchParams;
  const busca = filtros.q?.trim() ?? "";
  const status = filtros.status ?? "";
  const pagina = Math.max(1, Number(filtros.pagina ?? 1) || 1);

  const supabase = await criarClienteServidor();
  let consulta = supabase
    .from("eventos")
    .select("*", { count: "exact" })
    .order("inicio", { ascending: false })
    .range((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA - 1);

  if (status === "publicado" || status === "rascunho") consulta = consulta.eq("status", status);
  if (busca) {
    const alvo = busca.replace(/[%,()]/g, " ");
    consulta = consulta.or(`titulo.ilike.%${alvo}%,descricao.ilike.%${alvo}%,local.ilike.%${alvo}%`);
  }

  const { data, count } = await consulta;
  const eventos = (data ?? []) as Evento[];
  const total = count ?? 0;
  const agora = Date.now();

  async function publicar(dados: FormData) {
    "use server";
    await alternarPublicacao("eventos", String(dados.get("id")), dados.get("publicar") === "1");
  }

  async function excluir(dados: FormData) {
    "use server";
    await excluirEvento(String(dados.get("id")));
  }

  return (
    <div className="mx-auto max-w-5xl">
      <CabecalhoLista
        titulo="Eventos"
        descricao="Programação exibida na página de eventos e na home."
        novoHref={`${BASE}/novo`}
        novoRotulo="Novo evento"
        podeEditar={podeEditar}
      />

      <FiltrosLista
        base={BASE}
        busca={busca}
        status={status}
        opcoesStatus={OPCOES_PUBLICACAO}
        placeholder="Título, descrição ou local"
      />

      <div className="mt-6">
        {eventos.length === 0 ? (
          <Vazio
            mensagem={
              busca || status
                ? "Nenhum evento para os filtros escolhidos."
                : "Nenhum evento cadastrado."
            }
          />
        ) : (
          <Cartao className="overflow-x-auto">
            <table className="w-full min-w-[46rem] text-sm">
              <thead>
                <tr className="border-b border-borda bg-marca-50/60 text-left">
                  <th className="w-44 px-5 py-3 font-semibold text-texto">Quando</th>
                  <th className="px-4 py-3 font-semibold text-texto">Evento</th>
                  <th className="w-36 px-4 py-3 font-semibold text-texto">Situação</th>
                  {podeEditar ? <th className="w-32 px-4 py-3" /> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                {eventos.map((e) => {
                  const publicado = e.status === "publicado";
                  const passado = new Date(e.inicio).getTime() < agora;
                  return (
                    <tr key={e.id} className="align-top hover:bg-marca-50/40">
                      <td className="px-5 py-3">
                        <Link href={`${BASE}/${e.id}`} className="font-medium text-marca-700">
                          {formatarDataHora(e.inicio)}
                        </Link>
                        {passado ? (
                          <p className="mt-0.5 text-xs text-texto-suave">já realizado</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`${BASE}/${e.id}`}
                          className="line-clamp-2 font-medium text-texto hover:text-marca-700"
                        >
                          {e.titulo}
                        </Link>
                        {e.local ? (
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-texto-suave">
                            <MapPin className="h-3 w-3" /> {e.local}
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
                              href={`${BASE}/${e.id}`}
                              aria-label="Editar"
                              title="Editar"
                              className="grid h-9 w-9 place-items-center rounded-full text-marca-700 hover:bg-marca-100"
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>
                            <form action={publicar}>
                              <input type="hidden" name="id" value={e.id} />
                              <input type="hidden" name="publicar" value={publicado ? "0" : "1"} />
                              <button
                                type="submit"
                                aria-label={publicado ? "Voltar a rascunho" : "Publicar"}
                                title={publicado ? "Voltar a rascunho" : "Publicar"}
                                className="grid h-9 w-9 place-items-center rounded-full text-marca-700 hover:bg-marca-100"
                              >
                                {publicado ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </form>
                            <BotaoExcluir
                              acao={excluir}
                              id={e.id}
                              rotulo="Excluir evento"
                              mensagem={`Excluir o evento "${e.titulo}"? Esta ação não pode ser desfeita.`}
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
