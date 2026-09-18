import Link from "next/link";
import type { Metadata } from "next";
import { ArrowDownCircle, ArrowUpCircle, Eye } from "lucide-react";
import { Campo, Cartao, Etiqueta, Rotulo, Vazio } from "@/components/ui";
import { BotaoExcluir } from "@/components/gestao/BotaoExcluir";
import { CabecalhoLista, FiltrosLista, Paginacao } from "@/components/gestao/Lista";
import { formatarData } from "@/lib/datas";
import { formatarMoeda } from "@/lib/utils";
import { exigirTela } from "@/lib/auth/permissoes";
import { criarClienteServidor } from "@/lib/supabase/server";
import { excluirDocumento } from "@/lib/gestao/acoes-financeiro";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Documentos" };

const BASE = "/gestao/compras";
const POR_PAGINA = 20;

type Documento = {
  id: string;
  tipo_movimento: "entrada" | "saida";
  data_emissao: string;
  numero: string;
  fornecedor_cliente: string;
  descricao: string | null;
  valor_total: number;
  condicao: "avista" | "prazo";
};

export default async function ListaDocumentos({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string; status?: string; de?: string; ate?: string; pagina?: string;
  }>;
}) {
  const sessao = await exigirTela("compras");
  const podeEditar = sessao.podeEditar("compras");

  const filtros = await searchParams;
  const busca = filtros.q?.trim() ?? "";
  const tipo = filtros.status ?? "";     // reaproveita o campo "status" dos filtros
  const de = filtros.de ?? "";
  const ate = filtros.ate ?? "";
  const pagina = Math.max(1, Number(filtros.pagina ?? 1) || 1);

  const supabase = await criarClienteServidor();
  let consulta = supabase
    .from("documentos")
    .select("*", { count: "exact" })
    .order("data_emissao", { ascending: false })
    .range((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA - 1);

  if (tipo === "entrada" || tipo === "saida") consulta = consulta.eq("tipo_movimento", tipo);
  if (de) consulta = consulta.gte("data_emissao", de);
  if (ate) consulta = consulta.lte("data_emissao", ate);
  if (busca) {
    const alvo = busca.replace(/[%,()]/g, " ");
    consulta = consulta.or(
      `numero.ilike.%${alvo}%,fornecedor_cliente.ilike.%${alvo}%,descricao.ilike.%${alvo}%`,
    );
  }

  const { data, count } = await consulta;
  const documentos = (data ?? []) as Documento[];
  const total = count ?? 0;

  async function excluir(dados: FormData) {
    "use server";
    await excluirDocumento(dados);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <CabecalhoLista
        titulo="Documentos"
        descricao="Notas de compra e de venda. A prazo, o lançamento já gera as duplicatas."
        novoHref={`${BASE}/novo`}
        novoRotulo="Lançar documento"
        podeEditar={podeEditar}
      />

      <FiltrosLista
        base={BASE}
        busca={busca}
        status={tipo}
        rotuloStatus="Movimento"
        opcoesStatus={[
          { valor: "", rotulo: "Todos" },
          { valor: "entrada", rotulo: "Entrada (compra)" },
          { valor: "saida", rotulo: "Saída (venda)" },
        ]}
        placeholder="Número, fornecedor/cliente ou descrição"
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Rotulo htmlFor="de">Emissão de</Rotulo>
            <Campo id="de" name="de" type="date" defaultValue={de} />
          </div>
          <div>
            <Rotulo htmlFor="ate">até</Rotulo>
            <Campo id="ate" name="ate" type="date" defaultValue={ate} />
          </div>
        </div>
      </FiltrosLista>

      <div className="mt-6">
        {documentos.length === 0 ? (
          <Vazio
            mensagem={
              busca || tipo || de || ate
                ? "Nenhum documento para os filtros escolhidos."
                : "Nenhum documento lançado."
            }
          />
        ) : (
          <Cartao className="overflow-x-auto">
            <table className="w-full min-w-[48rem] text-sm">
              <thead>
                <tr className="border-b border-borda bg-marca-50/60 text-left">
                  <th className="w-28 px-5 py-3 font-semibold text-texto">Emissão</th>
                  <th className="px-4 py-3 font-semibold text-texto">Documento</th>
                  <th className="w-32 px-4 py-3 font-semibold text-texto">Condição</th>
                  <th className="w-32 px-4 py-3 text-right font-semibold text-texto">Valor</th>
                  {podeEditar ? <th className="w-24 px-4 py-3" /> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                {documentos.map((d) => {
                  const entrada = d.tipo_movimento === "entrada";
                  return (
                    <tr key={d.id} className="align-top hover:bg-marca-50/40">
                      <td className="px-5 py-3 text-texto-suave">{formatarData(d.data_emissao)}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`${BASE}/${d.id}`}
                          className="flex items-center gap-2 font-medium text-texto hover:text-marca-700"
                        >
                          {entrada ? (
                            <ArrowUpCircle className="h-4 w-4 shrink-0 text-rose-500" />
                          ) : (
                            <ArrowDownCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                          )}
                          {d.fornecedor_cliente} · nº {d.numero}
                        </Link>
                        {d.descricao ? (
                          <p className="mt-0.5 line-clamp-1 pl-6 text-xs text-texto-suave">
                            {d.descricao}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <Etiqueta tom={d.condicao === "prazo" ? "marca" : "cinza"}>
                          {d.condicao === "prazo" ? "A prazo" : "À vista"}
                        </Etiqueta>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-texto">
                        {formatarMoeda(d.valor_total)}
                      </td>
                      {podeEditar ? (
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`${BASE}/${d.id}`}
                              aria-label="Ver documento"
                              title="Ver documento"
                              className="grid h-9 w-9 place-items-center rounded-full text-marca-700 hover:bg-marca-100"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            <BotaoExcluir
                              acao={excluir}
                              id={d.id}
                              rotulo="Excluir documento"
                              mensagem={`Excluir o documento ${d.numero} de ${d.fornecedor_cliente}? As duplicatas geradas por ele e as baixas já registradas serão apagadas junto. Esta ação não pode ser desfeita.`}
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
        filtros={{ q: busca, status: tipo, de, ate }}
      />
    </div>
  );
}
