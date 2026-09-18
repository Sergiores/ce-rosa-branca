"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { AreaTexto, Botao, Campo, Rotulo, Selecao } from "@/components/ui";
import { formatarMoeda } from "@/lib/utils";
import { registrarBaixa } from "@/lib/gestao/acoes-financeiro";
import type { Resultado } from "@/lib/gestao/acoes-conteudo";
import type { TipoTitulo } from "@/lib/tipos";

function BotaoSalvar() {
  const { pending } = useFormStatus();
  return (
    <Botao type="submit" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {pending ? "Registrando..." : "Registrar baixa"}
    </Botao>
  );
}

export function FormularioBaixa({
  tituloId,
  tipo,
  saldo,
}: {
  tituloId: string;
  tipo: TipoTitulo;
  saldo: number;
}) {
  const [estado, executar] = useActionState<Resultado, FormData>(registrarBaixa, {});
  const [valor, setValor] = useState(saldo.toFixed(2).replace(".", ","));

  return (
    <form action={executar} className="space-y-5">
      <input type="hidden" name="titulo_id" value={tituloId} />
      <input type="hidden" name="tipo" value={tipo} />

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <Rotulo htmlFor="data">Data</Rotulo>
          <Campo
            id="data"
            name="data"
            type="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
          />
        </div>
        <div>
          <Rotulo htmlFor="valor">Valor</Rotulo>
          <Campo
            id="valor"
            name="valor"
            inputMode="decimal"
            required
            value={valor}
            onChange={(e) => setValor(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setValor(saldo.toFixed(2).replace(".", ","))}
            className="mt-1.5 text-xs font-medium text-marca-700 hover:text-marca-800"
          >
            usar o saldo total ({formatarMoeda(saldo)})
          </button>
        </div>
        <div>
          <Rotulo htmlFor="forma">Forma</Rotulo>
          <Selecao id="forma" name="forma" defaultValue="pix">
            <option value="pix">Pix</option>
            <option value="dinheiro">Dinheiro</option>
            <option value="transferencia">Transferência</option>
            <option value="boleto">Boleto</option>
            <option value="cartao">Cartão</option>
            <option value="outro">Outro</option>
          </Selecao>
        </div>
      </div>

      <div>
        <Rotulo htmlFor="observacao">Observação</Rotulo>
        <AreaTexto id="observacao" name="observacao" rows={2} />
      </div>

      {estado?.erro ? (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{estado.erro}</p>
      ) : null}
      {estado?.ok ? (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Baixa registrada.
        </p>
      ) : null}

      <BotaoSalvar />
    </form>
  );
}
