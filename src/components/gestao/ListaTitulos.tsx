import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock, Wallet } from "lucide-react";
import { Campo, Cartao, CartaoCorpo, Etiqueta, Rotulo, Vazio } from "@/components/ui";
import { FiltrosLista } from "@/components/gestao/Lista";
import { formatarData } from "@/lib/datas";
import { formatarMoeda } from "@/lib/utils";
import { criarClienteServidor } from "@/lib/supabase/server";
import type { StatusTitulo, TipoTitulo, TituloComSaldo } from "@/lib/tipos";

const TOM: Record<StatusTitulo, "verde" | "ambar" | "vermelho" | "azul" | "cinza"> = {
  pago: "verde",
  parcial: "azul",
  aberto: "ambar",
  vencido: "vermelho",
  cancelado: "cinza",
};

const ROTULO: Record<StatusTitulo, string> = {
  pago: "Pago",
  parcial: "Parcial",
  aberto: "Em aberto",
  vencido: "Vencido",
  cancelado: "Cancelado",
};

export type FiltrosTitulos = {
  q?: string;
  status?: string;
  de?: string;
  ate?: string;
  pagina?: string;
};

/**
 * Carrega os titulos do tipo pedido. O filtro por situacao e aplicado em
 * memoria porque o status e derivado na view, nao uma coluna armazenada.
 */
export async function carregarTitulos(tipo: TipoTitulo, filtros: FiltrosTitulos) {
  const supabase = await criarClienteServidor();
  let consulta = supabase
    .from("v_titulos_saldo")
    .select("*")
    .eq("tipo", tipo)
    .order("vencimento", { ascending: true })
    .limit(1000);

  if (filtros.de) consulta = consulta.gte("vencimento", filtros.de);
  if (filtros.ate) consulta = consulta.lte("vencimento", filtros.ate);

  const { data } = await consulta;
  let titulos = (data ?? []) as TituloComSaldo[];

  if (filtros.status) titulos = titulos.filter((t) => t.status === filtros.status);

  const busca = filtros.q?.trim();
  if (busca) {
    const alvo = busca.toLowerCase();
    titulos = titulos.filter((t) =>
      [t.descricao, t.fornecedor_cliente, t.membro_nome, t.documento_numero]
        .filter(Boolean)
        .some((c) => String(c).toLowerCase().includes(alvo)),
    );
  }

  return titulos;
}

export function IndicadoresTitulos({ titulos }: { titulos: TituloComSaldo[] }) {
  const ativos = titulos.filter((t) => t.status !== "cancelado");
  const emAberto = ativos.filter((t) => t.status !== "pago");
  const vencidos = ativos.filter((t) => t.status === "vencido");

  const hoje = new Date();
  const em30 = new Date(hoje.getTime() + 30 * 86400000);
  const proximos = emAberto.filter((t) => {
    const v = new Date(`${t.vencimento}T12:00:00`);
    return v >= hoje && v <= em30;
  });

  const totalPago = ativos.reduce((s, t) => s + Number(t.valor_pago), 0);

  return (
    <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <Indicador
        Icone={Wallet}
        rotulo="Em aberto"
        valor={emAberto.reduce((s, t) => s + Number(t.saldo), 0)}
      />
      <Indicador
        Icone={AlertTriangle}
        rotulo="Vencido"
        valor={vencidos.reduce((s, t) => s + Number(t.saldo), 0)}
        tom="vermelho"
      />
      <Indicador
        Icone={Clock}
        rotulo="Vence em 30 dias"
        valor={proximos.reduce((s, t) => s + Number(t.saldo), 0)}
      />
      <Indicador Icone={CheckCircle2} rotulo="Já baixado" valor={totalPago} tom="verde" />
    </div>
  );
}

function Indicador({
  Icone,
  rotulo,
  valor,
  tom = "azul",
}: {
  Icone: typeof Wallet;
  rotulo: string;
  valor: number;
  tom?: "azul" | "verde" | "vermelho";
}) {
  const cor =
    tom === "vermelho" ? "text-rose-600" : tom === "verde" ? "text-emerald-600" : "text-azul-600";
  return (
    <Cartao>
      <CartaoCorpo>
        <Icone className={`h-6 w-6 ${cor}`} />
        <p className="mt-3 text-sm text-texto-suave">{rotulo}</p>
        <p className="mt-1 text-2xl font-semibold text-texto">{formatarMoeda(valor)}</p>
      </CartaoCorpo>
    </Cartao>
  );
}

export function FiltrosTitulosBarra({
  base,
  filtros,
}: {
  base: string;
  filtros: FiltrosTitulos;
}) {
  return (
    <FiltrosLista
      base={base}
      busca={filtros.q ?? ""}
      status={filtros.status ?? ""}
      rotuloStatus="Situação"
      opcoesStatus={[
        { valor: "", rotulo: "Todas" },
        { valor: "aberto", rotulo: "Em aberto" },
        { valor: "parcial", rotulo: "Parcial" },
        { valor: "vencido", rotulo: "Vencido" },
        { valor: "pago", rotulo: "Pago" },
        { valor: "cancelado", rotulo: "Cancelado" },
      ]}
      placeholder="Fornecedor, membro, documento ou descrição"
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Rotulo htmlFor="de">Vencimento de</Rotulo>
          <Campo id="de" name="de" type="date" defaultValue={filtros.de ?? ""} />
        </div>
        <div>
          <Rotulo htmlFor="ate">até</Rotulo>
          <Campo id="ate" name="ate" type="date" defaultValue={filtros.ate ?? ""} />
        </div>
      </div>
    </FiltrosLista>
  );
}

export function TabelaTitulos({ titulos }: { titulos: TituloComSaldo[] }) {
  if (titulos.length === 0) {
    return <Vazio mensagem="Nenhum título para os filtros escolhidos." />;
  }

  return (
    <Cartao className="overflow-x-auto">
      <table className="w-full min-w-[46rem] text-sm">
        <thead>
          <tr className="border-b border-borda bg-azul-50/60 text-left">
            <th className="w-28 px-5 py-3 font-semibold text-texto">Vencimento</th>
            <th className="px-4 py-3 font-semibold text-texto">Descrição</th>
            <th className="px-4 py-3 font-semibold text-texto">Contraparte</th>
            <th className="w-28 px-4 py-3 text-right font-semibold text-texto">Valor</th>
            <th className="w-28 px-4 py-3 text-right font-semibold text-texto">Saldo</th>
            <th className="w-32 px-4 py-3 font-semibold text-texto">Situação</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-borda">
          {titulos.map((t) => (
            <tr key={t.id} className="align-top hover:bg-azul-50/40">
              <td className="whitespace-nowrap px-5 py-3">
                <Link href={`/gestao/titulos/${t.id}`} className="font-medium text-azul-700">
                  {formatarData(t.vencimento)}
                </Link>
              </td>
              <td className="px-4 py-3">
                <Link href={`/gestao/titulos/${t.id}`} className="text-texto hover:text-azul-700">
                  {t.descricao}
                  {t.total_parcelas > 1 ? ` (${t.parcela}/${t.total_parcelas})` : ""}
                </Link>
              </td>
              <td className="px-4 py-3 text-texto-suave">
                {t.membro_nome ?? t.fornecedor_cliente ?? "—"}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right text-texto">
                {formatarMoeda(t.valor)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-texto">
                {formatarMoeda(t.saldo)}
              </td>
              <td className="px-4 py-3">
                <Etiqueta tom={TOM[t.status]}>{ROTULO[t.status]}</Etiqueta>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Cartao>
  );
}
