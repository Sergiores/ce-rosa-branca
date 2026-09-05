import Link from "next/link";
import type { Metadata } from "next";
import { Eye, EyeOff, Pencil } from "lucide-react";
import { Cartao, Etiqueta, Vazio } from "@/components/ui";
import { BotaoExcluir } from "@/components/gestao/BotaoExcluir";
import {
  CabecalhoLista, FiltrosLista, OPCOES_PUBLICACAO, Paginacao,
} from "@/components/gestao/Lista";
import { formatarData } from "@/lib/datas";
import { exigirTela } from "@/lib/auth/permissoes";
import { criarClienteServidor } from "@/lib/supabase/server";
import { alternarPublicacao, excluirMensagem } from "@/lib/gestao/acoes-conteudo";
import type { MensagemDoDia } from "@/lib/tipos";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mensagem do dia" };

const BASE = "/gestao/conteudo/mensagens";
const POR_PAGINA = 20;

export default async function ListaMensagens({
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
    .from("mensagens_do_dia")
    .select("*", { count: "exact" })
    .order("data", { ascending: false })
    .range((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA - 1);

  if (status === "publicado" || status === "rascunho") consulta = consulta.eq("status", status);
  if (busca) {
    const alvo = busca.replace(/[%,()]/g, " ");
    consulta = consulta.or(`texto.ilike.%${alvo}%,autor.ilike.%${alvo}%`);
  }

  const { data, count } = await consulta;
  const mensagens = (data ?? []) as MensagemDoDia[];
  const total = count ?? 0;

  async function publicar(dados: FormData) {
    "use server";
    await alternarPublicacao("mensagens_do_dia", String(dados.get("id")), dados.get("publicar") === "1");
  }

  async function excluir(dados: FormData) {
    "use server";
    await excluirMensagem(String(dados.get("id")));
  }

  return (
    <div className="mx-auto max-w-5xl">
      <CabecalhoLista
        titulo="Mensagem do dia"
        descricao="A mensagem mais recente já publicada aparece na página inicial."
        novoHref={`${BASE}/nova`}
        novoRotulo="Nova mensagem"
        podeEditar={podeEditar}
      />

      <FiltrosLista
        base={BASE}
        busca={busca}
        status={status}
        opcoesStatus={OPCOES_PUBLICACAO}
        placeholder="Texto da mensagem ou autor"
      />

      <div className="mt-6">
        {mensagens.length === 0 ? (
          <Vazio
            mensagem={
              busca || status
                ? "Nenhuma mensagem para os filtros escolhidos."
                : "Nenhuma mensagem cadastrada."
            }
          />
        ) : (
          <Cartao className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-sm">
              <thead>
                <tr className="border-b border-borda bg-azul-50/60 text-left">
                  <th className="w-32 px-5 py-3 font-semibold text-texto">Data</th>
                  <th className="px-4 py-3 font-semibold text-texto">Mensagem</th>
                  <th className="w-36 px-4 py-3 font-semibold text-texto">Situação</th>
                  {podeEditar ? <th className="w-32 px-4 py-3" /> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                {mensagens.map((m) => {
                  const publicada = m.status === "publicado";
                  return (
                    <tr key={m.id} className="align-top hover:bg-azul-50/40">
                      <td className="px-5 py-3 font-medium text-azul-700">
                        <Link href={`${BASE}/${m.id}`}>{formatarData(m.data)}</Link>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`${BASE}/${m.id}`} className="line-clamp-2 text-texto hover:text-azul-700">
                          {m.texto}
                        </Link>
                        {m.autor ? (
                          <p className="mt-0.5 text-xs text-texto-suave">— {m.autor}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <Etiqueta tom={publicada ? "verde" : "ambar"}>
                          {publicada ? "Publicada" : "Rascunho"}
                        </Etiqueta>
                      </td>
                      {podeEditar ? (
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`${BASE}/${m.id}`}
                              aria-label="Editar"
                              title="Editar"
                              className="grid h-9 w-9 place-items-center rounded-full text-azul-700 hover:bg-azul-100"
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>
                            <form action={publicar}>
                              <input type="hidden" name="id" value={m.id} />
                              <input type="hidden" name="publicar" value={publicada ? "0" : "1"} />
                              <button
                                type="submit"
                                aria-label={publicada ? "Voltar a rascunho" : "Publicar"}
                                title={publicada ? "Voltar a rascunho" : "Publicar"}
                                className="grid h-9 w-9 place-items-center rounded-full text-azul-700 hover:bg-azul-100"
                              >
                                {publicada ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </form>
                            <BotaoExcluir
                              acao={excluir}
                              id={m.id}
                              rotulo="Excluir mensagem"
                              mensagem={`Excluir a mensagem de ${formatarData(m.data)}? Esta ação não pode ser desfeita.`}
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
