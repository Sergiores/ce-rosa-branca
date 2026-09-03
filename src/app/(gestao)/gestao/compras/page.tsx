import Link from "next/link";
import type { Metadata } from "next";
import { Trash2, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { Cartao, CartaoCorpo, Etiqueta, Vazio } from "@/components/ui";
import { FormularioDocumento } from "./FormularioDocumento";
import { formatarData } from "@/lib/datas";
import { formatarMoeda } from "@/lib/utils";
import { exigirTela } from "@/lib/auth/permissoes";
import { criarClienteServidor } from "@/lib/supabase/server";
import { excluirDocumento } from "@/lib/gestao/acoes-financeiro";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Documentos" };

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

export default async function PaginaCompras() {
  const sessao = await exigirTela("compras");
  const podeEditar = sessao.podeEditar("compras");

  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("documentos")
    .select("*")
    .order("data_emissao", { ascending: false })
    .limit(100);
  const documentos = (data ?? []) as Documento[];

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold tracking-tight text-texto">Documentos</h1>
      <p className="mt-1 text-texto-suave">
        Notas de compra e de venda. A prazo, o lançamento já gera as duplicatas.
      </p>

      {podeEditar ? (
        <Cartao className="mt-8">
          <CartaoCorpo className="sm:p-8">
            <h2 className="mb-6 font-semibold text-texto">Lançar documento</h2>
            <FormularioDocumento />
          </CartaoCorpo>
        </Cartao>
      ) : null}

      <h2 className="mb-4 mt-10 font-semibold text-texto">Documentos lançados</h2>

      {documentos.length === 0 ? (
        <Vazio mensagem="Nenhum documento lançado." />
      ) : (
        <Cartao className="divide-y divide-borda overflow-hidden">
          {documentos.map((d) => (
            <div key={d.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
              {d.tipo_movimento === "entrada" ? (
                <ArrowUpCircle className="h-5 w-5 shrink-0 text-rose-500" />
              ) : (
                <ArrowDownCircle className="h-5 w-5 shrink-0 text-emerald-500" />
              )}

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium text-texto">
                    {d.fornecedor_cliente} · doc {d.numero}
                  </p>
                  <Etiqueta tom={d.condicao === "prazo" ? "azul" : "cinza"}>
                    {d.condicao === "prazo" ? "A prazo" : "À vista"}
                  </Etiqueta>
                </div>
                <p className="text-xs text-texto-suave">
                  Emissão {formatarData(d.data_emissao)}
                  {d.descricao ? ` · ${d.descricao}` : ""}
                </p>
              </div>

              <span className="font-semibold text-texto">{formatarMoeda(d.valor_total)}</span>

              <Link
                href={
                  d.tipo_movimento === "entrada" ? "/gestao/contas-pagar" : "/gestao/contas-receber"
                }
                className="rounded-full px-4 py-2 text-sm font-medium text-azul-700 hover:bg-azul-50"
              >
                Ver títulos
              </Link>

              {podeEditar ? (
                <form action={excluirDocumento}>
                  <input type="hidden" name="id" value={d.id} />
                  <button
                    type="submit"
                    aria-label="Excluir documento e suas duplicatas"
                    className="grid h-9 w-9 place-items-center rounded-full text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </form>
              ) : null}
            </div>
          ))}
        </Cartao>
      )}
    </div>
  );
}
