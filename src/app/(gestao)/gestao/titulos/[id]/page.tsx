import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { Cartao, CartaoCorpo, Etiqueta, Vazio } from "@/components/ui";
import { FormularioBaixa } from "./FormularioBaixa";
import { CobrancaPix } from "./CobrancaPix";
import { BotaoConfirmar } from "@/components/gestao/BotaoConfirmar";
import { formatarData, formatarDataHora } from "@/lib/datas";
import { formatarMoeda } from "@/lib/utils";
import { exigirTela } from "@/lib/auth/permissoes";
import { criarClienteServidor } from "@/lib/supabase/server";
import { cancelarTitulo, estornarBaixa } from "@/lib/gestao/acoes-financeiro";
import type { Baixa, StatusTitulo, TituloComSaldo } from "@/lib/tipos";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Título" };

const TOM: Record<StatusTitulo, "verde" | "ambar" | "vermelho" | "marca" | "cinza"> = {
  pago: "verde", parcial: "marca", aberto: "ambar", vencido: "vermelho", cancelado: "cinza",
};
const ROTULO: Record<StatusTitulo, string> = {
  pago: "Pago", parcial: "Parcial", aberto: "Em aberto", vencido: "Vencido", cancelado: "Cancelado",
};

export default async function PaginaTitulo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await criarClienteServidor();

  const { data } = await supabase.from("v_titulos_saldo").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const titulo = data as TituloComSaldo;

  const tela = titulo.tipo === "pagar" ? "contas_pagar" : "contas_receber";
  const sessao = await exigirTela(tela);
  const podeEditar = sessao.podeEditar(tela);

  const { data: dadosBaixas } = await supabase
    .from("baixas")
    .select("*")
    .eq("titulo_id", id)
    .order("data");
  const baixas = (dadosBaixas ?? []) as Baixa[];

  const voltarPara = titulo.tipo === "pagar" ? "/gestao/contas-pagar" : "/gestao/contas-receber";
  const quitado = Number(titulo.saldo) <= 0.005 || titulo.cancelado;

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={voltarPara}
        className="inline-flex items-center gap-1 text-sm font-medium text-marca-700 hover:text-marca-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar a contas a {titulo.tipo === "pagar" ? "pagar" : "receber"}
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-texto">{titulo.descricao}</h1>
          <Etiqueta tom={TOM[titulo.status]}>{ROTULO[titulo.status]}</Etiqueta>
        </div>
        {podeEditar && !quitado ? (
          /* O formulario fica depois do historico, para quem baixa ver antes o
             que ja foi baixado. A ancora evita rolar quando nao precisa. */
          <a
            href="#baixar"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-marca-600 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-marca-600/20 hover:bg-marca-700"
          >
            Registrar {titulo.tipo === "pagar" ? "pagamento" : "recebimento"}
          </a>
        ) : null}
      </div>

      <Cartao className="mt-6">
        <CartaoCorpo className="grid gap-5 sm:grid-cols-3 sm:p-8">
          <Dado rotulo="Vencimento" valor={formatarData(titulo.vencimento)} />
          <Dado rotulo="Valor do título" valor={formatarMoeda(titulo.valor)} />
          <Dado rotulo="Saldo devedor" valor={formatarMoeda(titulo.saldo)} destaque />
          <Dado
            rotulo="Contraparte"
            valor={titulo.membro_nome ?? titulo.fornecedor_cliente ?? "—"}
          />
          <Dado
            rotulo="Documento"
            valor={titulo.documento_numero ? `nº ${titulo.documento_numero}` : "—"}
          />
          <Dado
            rotulo="Parcela"
            valor={titulo.total_parcelas > 1 ? `${titulo.parcela} de ${titulo.total_parcelas}` : "única"}
          />
        </CartaoCorpo>
      </Cartao>

      {titulo.tipo === "receber" && !quitado ? (
        <CobrancaPix
          valor={Number(titulo.saldo)}
          identificador={titulo.id.replace(/-/g, "").slice(0, 20)}
          descricao={titulo.descricao}
        />
      ) : null}

      <Cartao className="mt-6">
        <CartaoCorpo className="sm:p-8">
          <h2 className="mb-5 font-semibold text-texto">Histórico de baixas</h2>

          {baixas.length === 0 ? (
            <Vazio mensagem="Nenhuma baixa registrada." />
          ) : (
            <ul className="divide-y divide-borda">
              {baixas.map((b) => {
                const estorno = Number(b.valor) < 0;
                return (
                  <li key={b.id} className="flex flex-wrap items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-texto">
                        {formatarData(b.data)} · {b.forma}
                      </p>
                      {b.observacao ? (
                        <p className="text-xs text-texto-suave">{b.observacao}</p>
                      ) : null}
                    </div>
                    <span
                      className={
                        estorno ? "font-medium text-rose-700" : "font-medium text-emerald-700"
                      }
                    >
                      {formatarMoeda(b.valor)}
                    </span>
                    {podeEditar && !estorno ? (
                      <BotaoConfirmar
                        acao={estornarBaixa}
                        id={b.id}
                        nomeCampoId="baixa_id"
                        campos={{ tipo: titulo.tipo }}
                        rotulo="estornar"
                        icone="estornar"
                        discreto
                        mensagem={`Estornar a baixa de ${formatarMoeda(b.valor)}? Será lançado um valor negativo; a baixa original continua no histórico.`}
                      />
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}

          <p className="mt-5 border-t border-borda pt-4 text-sm text-texto-suave">
            Baixas não são editadas nem apagadas — a correção é lançada como estorno, preservando o
            histórico.
          </p>
        </CartaoCorpo>
      </Cartao>

      {podeEditar && !quitado ? (
        <Cartao className="mt-6 scroll-mt-24" id="baixar">
          <CartaoCorpo className="sm:p-8">
            <h2 className="mb-5 font-semibold text-texto">
              Registrar {titulo.tipo === "pagar" ? "pagamento" : "recebimento"}
            </h2>
            <FormularioBaixa
              tituloId={titulo.id}
              tipo={titulo.tipo}
              saldo={Number(titulo.saldo)}
            />
          </CartaoCorpo>
        </Cartao>
      ) : null}

      {podeEditar && !titulo.cancelado && Number(titulo.valor_pago) === 0 ? (
        <div className="mt-6">
          <BotaoConfirmar
            acao={cancelarTitulo}
            id={titulo.id}
            campos={{ tipo: titulo.tipo }}
            rotulo="Cancelar este título"
            icone="cancelar"
            mensagem="Cancelar este título? Ele deixa de contar nos saldos e relatórios."
          />
        </div>
      ) : null}

      <p className="mt-6 text-xs text-texto-suave">
        Criado em {formatarDataHora(titulo.criado_em)}.
      </p>
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
      <p className={destaque ? "mt-1 text-xl font-semibold text-marca-700" : "mt-1 font-medium text-texto"}>
        {valor}
      </p>
    </div>
  );
}
