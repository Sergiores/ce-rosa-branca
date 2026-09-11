import type { Metadata } from "next";
import { Cartao, CartaoCorpo, Etiqueta, Vazio } from "@/components/ui";
import { GraficoFinanceiro } from "./GraficoFinanceiro";
import { formatarData } from "@/lib/datas";
import { formatarMoeda } from "@/lib/utils";
import { exigirTela } from "@/lib/auth/permissoes";
import { criarClienteServidor } from "@/lib/supabase/server";
import type { TituloComSaldo } from "@/lib/tipos";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Relatórios" };

const FAIXAS = [
  { chave: "a_vencer", rotulo: "A vencer" },
  { chave: "ate_30", rotulo: "Vencido até 30 dias" },
  { chave: "ate_60", rotulo: "31 a 60 dias" },
  { chave: "ate_90", rotulo: "61 a 90 dias" },
  { chave: "acima_90", rotulo: "Mais de 90 dias" },
] as const;

type Faixa = (typeof FAIXAS)[number]["chave"];

function faixaDe(vencimento: string): Faixa {
  const dias = Math.floor(
    (Date.now() - new Date(`${vencimento}T12:00:00`).getTime()) / 86400000,
  );
  if (dias <= 0) return "a_vencer";
  if (dias <= 30) return "ate_30";
  if (dias <= 60) return "ate_60";
  if (dias <= 90) return "ate_90";
  return "acima_90";
}

function competencia(data: string) {
  return data.slice(0, 7);
}

/** A API devolve no maximo 1000 linhas por requisicao, e este relatorio soma
 *  a carteira inteira. Percorremos em blocos com `.range()` em vez de pedir
 *  um `.limit()` maior, que truncaria em silencio. */
const BLOCO = 1000;
const MAX_BLOCOS = 50;

async function carregarCarteira(
  supabase: Awaited<ReturnType<typeof criarClienteServidor>>,
): Promise<{ titulos: TituloComSaldo[]; truncado: boolean }> {
  const titulos: TituloComSaldo[] = [];

  for (let bloco = 0; bloco < MAX_BLOCOS; bloco++) {
    const { data, error } = await supabase
      .from("v_titulos_saldo")
      .select("*")
      .order("vencimento", { ascending: true })
      .order("id", { ascending: true })
      .range(bloco * BLOCO, (bloco + 1) * BLOCO - 1);

    if (error) break;
    const pagina = (data ?? []) as TituloComSaldo[];
    titulos.push(...pagina);
    if (pagina.length < BLOCO) return { titulos, truncado: false };
  }

  return { titulos, truncado: true };
}

export default async function PaginaRelatorios() {
  await exigirTela("relatorios");
  const supabase = await criarClienteServidor();

  const { titulos, truncado } = await carregarCarteira(supabase);
  const todos = titulos.filter((t) => !t.cancelado);

  const emAberto = todos.filter((t) => Number(t.saldo) > 0.005);
  const pagar = emAberto.filter((t) => t.tipo === "pagar");
  const receber = emAberto.filter((t) => t.tipo === "receber");

  // Aging por faixa de vencimento
  const aging = FAIXAS.map((f) => ({
    faixa: f.rotulo,
    pagar: pagar.filter((t) => faixaDe(t.vencimento) === f.chave).reduce((s, t) => s + Number(t.saldo), 0),
    receber: receber.filter((t) => faixaDe(t.vencimento) === f.chave).reduce((s, t) => s + Number(t.saldo), 0),
  }));

  // Série mensal por vencimento (12 meses ao redor de hoje)
  const meses = new Map<string, { mes: string; pagar: number; receber: number }>();
  for (const t of todos) {
    const chave = competencia(t.vencimento);
    const atual = meses.get(chave) ?? { mes: chave, pagar: 0, receber: 0 };
    if (t.tipo === "pagar") atual.pagar += Number(t.valor);
    else atual.receber += Number(t.valor);
    meses.set(chave, atual);
  }
  const serie = [...meses.values()]
    .sort((a, b) => a.mes.localeCompare(b.mes))
    .slice(-12)
    .map((m) => ({ ...m, mes: formatarData(`${m.mes}-01`, "MMM/yy") }));

  // Extrato por contraparte
  const porContraparte = new Map<string, { nome: string; pagar: number; receber: number }>();
  for (const t of emAberto) {
    const nome = t.membro_nome ?? t.fornecedor_cliente ?? "—";
    const atual = porContraparte.get(nome) ?? { nome, pagar: 0, receber: 0 };
    if (t.tipo === "pagar") atual.pagar += Number(t.saldo);
    else atual.receber += Number(t.saldo);
    porContraparte.set(nome, atual);
  }
  const contrapartes = [...porContraparte.values()]
    .sort((a, b) => b.pagar + b.receber - (a.pagar + a.receber))
    .slice(0, 20);

  const totalPagar = pagar.reduce((s, t) => s + Number(t.saldo), 0);
  const totalReceber = receber.reduce((s, t) => s + Number(t.saldo), 0);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-semibold tracking-tight text-texto">Relatórios financeiros</h1>
      <p className="mt-1 text-texto-suave">
        Posição por vencimento, série mensal e extrato por contraparte.
      </p>

      {truncado && (
        <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          A carteira passou de {(MAX_BLOCOS * BLOCO).toLocaleString("pt-BR")} títulos e o
          relatório mostra apenas os mais antigos. Os totais abaixo estão incompletos.
        </p>
      )}

      <div className="mt-8 grid gap-5 sm:grid-cols-3">
        <Cartao>
          <CartaoCorpo>
            <p className="text-sm text-texto-suave">Total a pagar em aberto</p>
            <p className="mt-1 text-2xl font-semibold text-rose-600">{formatarMoeda(totalPagar)}</p>
          </CartaoCorpo>
        </Cartao>
        <Cartao>
          <CartaoCorpo>
            <p className="text-sm text-texto-suave">Total a receber em aberto</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-600">
              {formatarMoeda(totalReceber)}
            </p>
          </CartaoCorpo>
        </Cartao>
        <Cartao>
          <CartaoCorpo>
            <p className="text-sm text-texto-suave">Resultado projetado</p>
            <p
              className={
                totalReceber - totalPagar >= 0
                  ? "mt-1 text-2xl font-semibold text-emerald-600"
                  : "mt-1 text-2xl font-semibold text-rose-600"
              }
            >
              {formatarMoeda(totalReceber - totalPagar)}
            </p>
          </CartaoCorpo>
        </Cartao>
      </div>

      <Cartao className="mt-6">
        <CartaoCorpo>
          <h2 className="mb-5 font-semibold text-texto">Movimento por mês de vencimento</h2>
          {serie.length === 0 ? (
            <Vazio mensagem="Sem títulos lançados." />
          ) : (
            <GraficoFinanceiro dados={serie} />
          )}
        </CartaoCorpo>
      </Cartao>

      <Cartao className="mt-6 overflow-x-auto">
        <CartaoCorpo className="p-0">
          <h2 className="border-b border-borda px-6 py-4 font-semibold text-texto">
            Posição por faixa de vencimento
          </h2>
          <table className="w-full min-w-[34rem] text-sm">
            <thead>
              <tr className="border-b border-borda bg-azul-50/60 text-left">
                <th className="px-6 py-3 font-semibold text-texto">Faixa</th>
                <th className="px-4 py-3 text-right font-semibold text-texto">A pagar</th>
                <th className="px-4 py-3 text-right font-semibold text-texto">A receber</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borda">
              {aging.map((f) => (
                <tr key={f.faixa}>
                  <td className="px-6 py-3 text-texto">{f.faixa}</td>
                  <td className="px-4 py-3 text-right text-texto">{formatarMoeda(f.pagar)}</td>
                  <td className="px-4 py-3 text-right text-texto">{formatarMoeda(f.receber)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CartaoCorpo>
      </Cartao>

      <Cartao className="mt-6 overflow-x-auto">
        <CartaoCorpo className="p-0">
          <h2 className="border-b border-borda px-6 py-4 font-semibold text-texto">
            Saldos em aberto por fornecedor / membro
          </h2>
          {contrapartes.length === 0 ? (
            <div className="p-6">
              <Vazio mensagem="Nada em aberto." />
            </div>
          ) : (
            <table className="w-full min-w-[34rem] text-sm">
              <thead>
                <tr className="border-b border-borda bg-azul-50/60 text-left">
                  <th className="px-6 py-3 font-semibold text-texto">Contraparte</th>
                  <th className="px-4 py-3 text-right font-semibold text-texto">A pagar</th>
                  <th className="px-4 py-3 text-right font-semibold text-texto">A receber</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                {contrapartes.map((c) => (
                  <tr key={c.nome}>
                    <td className="px-6 py-3 text-texto">{c.nome}</td>
                    <td className="px-4 py-3 text-right text-texto">
                      {c.pagar > 0 ? formatarMoeda(c.pagar) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-texto">
                      {c.receber > 0 ? formatarMoeda(c.receber) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CartaoCorpo>
      </Cartao>

      <p className="mt-6">
        <Etiqueta tom="cinza">
          Saldos calculados a partir das baixas — nenhum valor é armazenado como saldo fixo.
        </Etiqueta>
      </p>
    </div>
  );
}
