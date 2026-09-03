"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Plus, Trash2, Wand2 } from "lucide-react";
import { AreaTexto, Botao, Campo, Rotulo, Selecao } from "@/components/ui";
import { formatarMoeda } from "@/lib/utils";
import { lancarDocumento } from "@/lib/gestao/acoes-financeiro";
import type { Resultado } from "@/lib/gestao/acoes-conteudo";

type Item = { descricao: string; quantidade: string; valor: string };
type Parcela = { vencimento: string; valor: string };

const hoje = () => new Date().toISOString().slice(0, 10);

function paraNumero(v: string) {
  const n = Number(v.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function BotaoSalvar() {
  const { pending } = useFormStatus();
  return (
    <Botao type="submit" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {pending ? "Lançando..." : "Lançar documento"}
    </Botao>
  );
}

export function FormularioDocumento() {
  const [estado, executar] = useActionState<Resultado, FormData>(lancarDocumento, {});
  const [condicao, setCondicao] = useState<"avista" | "prazo">("avista");
  const [itens, setItens] = useState<Item[]>([{ descricao: "", quantidade: "1", valor: "" }]);
  const [parcelas, setParcelas] = useState<Parcela[]>([{ vencimento: hoje(), valor: "" }]);
  const [emissao, setEmissao] = useState(hoje());

  const total = useMemo(
    () => itens.reduce((s, i) => s + paraNumero(i.quantidade) * paraNumero(i.valor), 0),
    [itens],
  );

  const somaParcelas = useMemo(
    () => parcelas.reduce((s, p) => s + paraNumero(p.valor), 0),
    [parcelas],
  );

  const diferenca = Math.abs(somaParcelas - total) > 0.01;

  /** Divide o total em N parcelas mensais, jogando a sobra de centavos na primeira. */
  function dividirParcelas(quantidade: number) {
    if (total <= 0 || quantidade < 1) return;
    const base = Math.floor((total * 100) / quantidade) / 100;
    const sobra = Number((total - base * quantidade).toFixed(2));
    const inicio = new Date(`${emissao}T12:00:00`);

    setParcelas(
      Array.from({ length: quantidade }, (_, i) => {
        const d = new Date(inicio);
        d.setMonth(d.getMonth() + i + 1);
        return {
          vencimento: d.toISOString().slice(0, 10),
          valor: (i === 0 ? base + sobra : base).toFixed(2).replace(".", ","),
        };
      }),
    );
  }

  return (
    <form action={executar} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Rotulo htmlFor="tipo_movimento">Tipo de movimento</Rotulo>
          <Selecao id="tipo_movimento" name="tipo_movimento" defaultValue="entrada">
            <option value="entrada">Entrada — compra (gera contas a pagar)</option>
            <option value="saida">Saída — venda/receita (gera contas a receber)</option>
          </Selecao>
        </div>
        <div>
          <Rotulo htmlFor="condicao">Condição</Rotulo>
          <Selecao
            id="condicao"
            name="condicao"
            value={condicao}
            onChange={(e) => setCondicao(e.target.value as "avista" | "prazo")}
          >
            <option value="avista">À vista</option>
            <option value="prazo">A prazo (gera duplicatas)</option>
          </Selecao>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <Rotulo htmlFor="data_emissao">Data de emissão</Rotulo>
          <Campo
            id="data_emissao"
            name="data_emissao"
            type="date"
            required
            value={emissao}
            onChange={(e) => setEmissao(e.target.value)}
          />
        </div>
        <div>
          <Rotulo htmlFor="numero">Número do documento</Rotulo>
          <Campo id="numero" name="numero" required />
        </div>
        <div>
          <Rotulo htmlFor="fornecedor_cliente">Fornecedor / cliente</Rotulo>
          <Campo id="fornecedor_cliente" name="fornecedor_cliente" required />
        </div>
      </div>

      <div>
        <Rotulo htmlFor="descricao">Descrição do documento</Rotulo>
        <AreaTexto id="descricao" name="descricao" rows={2} />
      </div>

      {/* Itens */}
      <div className="rounded-2xl border border-borda bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-texto">Itens do documento</h3>
          <span className="text-sm font-medium text-azul-700">Total: {formatarMoeda(total)}</span>
        </div>

        <div className="space-y-3">
          {itens.map((item, i) => (
            <div key={i} className="grid gap-3 sm:grid-cols-[1fr_6rem_8rem_2.5rem]">
              <Campo
                name="item_descricao"
                placeholder="Descrição do produto"
                value={item.descricao}
                onChange={(e) =>
                  setItens((a) => a.map((x, k) => (k === i ? { ...x, descricao: e.target.value } : x)))
                }
              />
              <Campo
                name="item_quantidade"
                inputMode="decimal"
                placeholder="Qtd"
                value={item.quantidade}
                onChange={(e) =>
                  setItens((a) => a.map((x, k) => (k === i ? { ...x, quantidade: e.target.value } : x)))
                }
              />
              <Campo
                name="item_valor"
                inputMode="decimal"
                placeholder="Valor unit."
                value={item.valor}
                onChange={(e) =>
                  setItens((a) => a.map((x, k) => (k === i ? { ...x, valor: e.target.value } : x)))
                }
              />
              <button
                type="button"
                aria-label="Remover item"
                onClick={() => setItens((a) => (a.length > 1 ? a.filter((_, k) => k !== i) : a))}
                className="grid h-11 w-10 place-items-center rounded-xl text-rose-600 hover:bg-rose-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setItens((a) => [...a, { descricao: "", quantidade: "1", valor: "" }])}
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-azul-200 px-4 py-2 text-sm font-medium text-azul-700 hover:bg-azul-50"
        >
          <Plus className="h-4 w-4" /> Adicionar item
        </button>
      </div>

      {/* Pagamento */}
      {condicao === "avista" ? (
        <div className="sm:max-w-xs">
          <Rotulo htmlFor="vencimento_avista">Data do pagamento/recebimento</Rotulo>
          <Campo id="vencimento_avista" name="vencimento_avista" type="date" defaultValue={emissao} />
        </div>
      ) : (
        <div className="rounded-2xl border border-azul-200 bg-azul-50/60 p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-azul-800">Duplicatas</h3>
            <div className="flex items-center gap-2">
              {[2, 3, 4, 6, 12].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => dividirParcelas(n)}
                  className="rounded-full border border-azul-200 bg-white px-3 py-1.5 text-xs font-medium text-azul-700 hover:bg-azul-100"
                >
                  {n}x
                </button>
              ))}
              <Wand2 className="h-4 w-4 text-azul-500" />
            </div>
          </div>

          <div className="space-y-3">
            {parcelas.map((p, i) => (
              <div key={i} className="grid gap-3 sm:grid-cols-[2rem_1fr_10rem_2.5rem] sm:items-center">
                <span className="text-sm font-medium text-texto-suave">{i + 1}ª</span>
                <Campo
                  name="parcela_vencimento"
                  type="date"
                  value={p.vencimento}
                  onChange={(e) =>
                    setParcelas((a) =>
                      a.map((x, k) => (k === i ? { ...x, vencimento: e.target.value } : x)),
                    )
                  }
                />
                <Campo
                  name="parcela_valor"
                  inputMode="decimal"
                  placeholder="Valor"
                  value={p.valor}
                  onChange={(e) =>
                    setParcelas((a) => a.map((x, k) => (k === i ? { ...x, valor: e.target.value } : x)))
                  }
                />
                <button
                  type="button"
                  aria-label="Remover parcela"
                  onClick={() => setParcelas((a) => (a.length > 1 ? a.filter((_, k) => k !== i) : a))}
                  className="grid h-11 w-10 place-items-center rounded-xl text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setParcelas((a) => [...a, { vencimento: hoje(), valor: "" }])}
              className="inline-flex items-center gap-2 rounded-full border border-azul-200 bg-white px-4 py-2 text-sm font-medium text-azul-700 hover:bg-azul-100"
            >
              <Plus className="h-4 w-4" /> Adicionar parcela
            </button>

            <span className={diferenca ? "text-sm font-medium text-rose-700" : "text-sm font-medium text-emerald-700"}>
              Soma das parcelas: {formatarMoeda(somaParcelas)}
              {diferenca ? ` — difere do total (${formatarMoeda(total)})` : " ✓"}
            </span>
          </div>
        </div>
      )}

      {estado?.erro ? (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{estado.erro}</p>
      ) : null}

      <div className="border-t border-borda pt-5">
        <BotaoSalvar />
      </div>
    </form>
  );
}
