import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowDownCircle, ArrowLeft, ArrowUpCircle } from "lucide-react";
import { Cartao, CartaoCorpo, Etiqueta, Vazio } from "@/components/ui";
import { Anexos } from "@/components/gestao/Anexos";
import { BotaoExcluir } from "@/components/gestao/BotaoExcluir";
import { formatarData } from "@/lib/datas";
import { formatarMoeda } from "@/lib/utils";
import { exigirTela } from "@/lib/auth/permissoes";
import { criarClienteServidor } from "@/lib/supabase/server";
import { excluirDocumento } from "@/lib/gestao/acoes-financeiro";
import type { StatusTitulo, TituloComSaldo } from "@/lib/tipos";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Documento" };

const TOM: Record<StatusTitulo, "verde" | "ambar" | "vermelho" | "azul" | "cinza"> = {
  pago: "verde", parcial: "azul", aberto: "ambar", vencido: "vermelho", cancelado: "cinza",
};
const ROTULO: Record<StatusTitulo, string> = {
  pago: "Pago", parcial: "Parcial", aberto: "Em aberto", vencido: "Vencido", cancelado: "Cancelado",
};

type Documento = {
  id: string;
  tipo_movimento: "entrada" | "saida";
  data_emissao: string;
  numero: string;
  fornecedor_cliente: string;
  descricao: string | null;
  valor_total: number;
  condicao: "avista" | "prazo";
  criado_em: string;
};

type Item = {
  id: string;
  descricao_produto: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
};

export default async function DetalheDocumento({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ salvo?: string }>;
}) {
  const sessao = await exigirTela("compras");
  const podeEditar = sessao.podeEditar("compras");
  const { id } = await params;
  const { salvo } = await searchParams;

  const supabase = await criarClienteServidor();
  const { data } = await supabase.from("documentos").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const documento = data as Documento;

  const [{ data: dadosItens }, { data: dadosTitulos }] = await Promise.all([
    supabase.from("documento_itens").select("*").eq("documento_id", id),
    supabase.from("v_titulos_saldo").select("*").eq("documento_id", id).order("parcela"),
  ]);

  const itens = (dadosItens ?? []) as Item[];
  const titulos = (dadosTitulos ?? []) as TituloComSaldo[];
  const entrada = documento.tipo_movimento === "entrada";

  async function excluir(dados: FormData) {
    "use server";
    await excluirDocumento(dados);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/gestao/compras"
        className="inline-flex items-center gap-1 text-sm font-medium text-azul-700 hover:text-azul-800"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar aos documentos
      </Link>

      {salvo ? (
        <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Documento lançado. {titulos.length > 1
            ? `${titulos.length} duplicatas foram geradas.`
            : "A duplicata foi gerada."}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {entrada ? (
          <ArrowUpCircle className="h-6 w-6 text-rose-500" />
        ) : (
          <ArrowDownCircle className="h-6 w-6 text-emerald-500" />
        )}
        <h1 className="text-2xl font-semibold tracking-tight text-texto">
          {documento.fornecedor_cliente} · nº {documento.numero}
        </h1>
        <Etiqueta tom={documento.condicao === "prazo" ? "azul" : "cinza"}>
          {documento.condicao === "prazo" ? "A prazo" : "À vista"}
        </Etiqueta>
      </div>

      <Cartao className="mt-6">
        <CartaoCorpo className="grid gap-5 sm:grid-cols-3 sm:p-8">
          <Dado rotulo="Emissão" valor={formatarData(documento.data_emissao)} />
          <Dado rotulo="Movimento" valor={entrada ? "Entrada (compra)" : "Saída (venda)"} />
          <Dado rotulo="Valor total" valor={formatarMoeda(documento.valor_total)} destaque />
          {documento.descricao ? (
            <div className="sm:col-span-3">
              <p className="text-sm text-texto-suave">Descrição</p>
              <p className="mt-1 text-texto">{documento.descricao}</p>
            </div>
          ) : null}
        </CartaoCorpo>
      </Cartao>

      {/* Itens */}
      <Cartao className="mt-6 overflow-x-auto">
        <CartaoCorpo className="p-0">
          <h2 className="border-b border-borda px-6 py-4 font-semibold text-texto">Itens</h2>
          {itens.length === 0 ? (
            <div className="p-6">
              <Vazio mensagem="Documento sem itens." />
            </div>
          ) : (
            <table className="w-full min-w-[34rem] text-sm">
              <thead>
                <tr className="border-b border-borda bg-azul-50/60 text-left">
                  <th className="px-6 py-3 font-semibold text-texto">Produto</th>
                  <th className="w-24 px-4 py-3 text-right font-semibold text-texto">Qtd.</th>
                  <th className="w-32 px-4 py-3 text-right font-semibold text-texto">Unitário</th>
                  <th className="w-32 px-4 py-3 text-right font-semibold text-texto">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                {itens.map((i) => (
                  <tr key={i.id}>
                    <td className="px-6 py-3 text-texto">{i.descricao_produto}</td>
                    <td className="px-4 py-3 text-right text-texto-suave">{i.quantidade}</td>
                    <td className="px-4 py-3 text-right text-texto-suave">
                      {formatarMoeda(i.valor_unitario)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-texto">
                      {formatarMoeda(i.valor_total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CartaoCorpo>
      </Cartao>

      {/* Duplicatas geradas */}
      <Cartao className="mt-6 overflow-x-auto">
        <CartaoCorpo className="p-0">
          <h2 className="border-b border-borda px-6 py-4 font-semibold text-texto">
            {entrada ? "Contas a pagar geradas" : "Contas a receber geradas"}
          </h2>
          {titulos.length === 0 ? (
            <div className="p-6">
              <Vazio mensagem="Nenhuma duplicata vinculada." />
            </div>
          ) : (
            <table className="w-full min-w-[34rem] text-sm">
              <thead>
                <tr className="border-b border-borda bg-azul-50/60 text-left">
                  <th className="w-24 px-6 py-3 font-semibold text-texto">Parcela</th>
                  <th className="px-4 py-3 font-semibold text-texto">Vencimento</th>
                  <th className="w-32 px-4 py-3 text-right font-semibold text-texto">Valor</th>
                  <th className="w-32 px-4 py-3 text-right font-semibold text-texto">Saldo</th>
                  <th className="w-32 px-4 py-3 font-semibold text-texto">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                {titulos.map((t) => (
                  <tr key={t.id} className="hover:bg-azul-50/40">
                    <td className="px-6 py-3">
                      <Link href={`/gestao/titulos/${t.id}`} className="font-medium text-azul-700">
                        {t.parcela}/{t.total_parcelas}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-texto">{formatarData(t.vencimento)}</td>
                    <td className="px-4 py-3 text-right text-texto">{formatarMoeda(t.valor)}</td>
                    <td className="px-4 py-3 text-right font-medium text-texto">
                      {formatarMoeda(t.saldo)}
                    </td>
                    <td className="px-4 py-3">
                      <Etiqueta tom={TOM[t.status]}>{ROTULO[t.status]}</Etiqueta>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CartaoCorpo>
      </Cartao>

      {/* Anexos */}
      <Cartao className="mt-6">
        <CartaoCorpo className="sm:p-8">
          <Anexos entidade="documento" entidadeId={documento.id} somenteLeitura={!podeEditar} />
        </CartaoCorpo>
      </Cartao>

      <p className="mt-6 text-xs text-texto-suave">
        O documento não é editável depois de lançado, porque as duplicatas já foram geradas a partir
        dele. Para corrigir, exclua e lance novamente — a auditoria guarda o registro anterior.
      </p>

      {podeEditar ? (
        <div className="mt-3">
          <BotaoExcluir
            acao={excluir}
            id={documento.id}
            comTexto="Excluir este documento"
            mensagem={`Excluir o documento ${documento.numero} de ${documento.fornecedor_cliente}? As ${titulos.length} duplicata(s) e as baixas já registradas serão apagadas junto. Esta ação não pode ser desfeita.`}
          />
        </div>
      ) : null}
    </div>
  );
}

function Dado({
  rotulo,
  valor,
  destaque,
}: {
  rotulo: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <div>
      <p className="text-sm text-texto-suave">{rotulo}</p>
      <p className={destaque ? "mt-1 text-xl font-semibold text-azul-700" : "mt-1 font-medium text-texto"}>
        {valor}
      </p>
    </div>
  );
}
