import type { Metadata } from "next";
import { CalendarPlus } from "lucide-react";
import { Botao, Campo, Cartao, CartaoCorpo, Rotulo } from "@/components/ui";
import {
  FiltrosBarra, IndicadoresTitulos, TabelaTitulos, carregarTitulos, type FiltrosTitulos,
} from "@/components/gestao/ListaTitulos";
import { exigirTela } from "@/lib/auth/permissoes";
import { gerarMensalidades } from "@/lib/gestao/acoes-financeiro";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Contas a receber" };

export default async function ContasReceber({
  searchParams,
}: {
  searchParams: Promise<FiltrosTitulos>;
}) {
  const sessao = await exigirTela("contas_receber");
  const podeEditar = sessao.podeEditar("contas_receber");
  const filtros = await searchParams;
  const titulos = await carregarTitulos("receber", filtros);

  const competencia = new Date().toISOString().slice(0, 7);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-semibold tracking-tight text-texto">Contas a receber</h1>
      <p className="mt-1 text-texto-suave">
        Mensalidades dos membros e recebimentos. Clique no título para dar baixa ou gerar o Pix.
      </p>

      <div className="mt-8">
        <IndicadoresTitulos titulos={titulos} />
      </div>

      {podeEditar ? (
        <Cartao className="mt-6 border-azul-200 bg-azul-50/60">
          <CartaoCorpo>
            <form action={gerarMensalidades} className="flex flex-wrap items-end gap-4">
              <div>
                <Rotulo htmlFor="competencia">Gerar mensalidades da competência</Rotulo>
                <Campo
                  id="competencia"
                  name="competencia"
                  type="month"
                  defaultValue={competencia}
                  className="sm:w-56"
                />
              </div>
              <Botao type="submit">
                <CalendarPlus className="h-4 w-4" /> Gerar
              </Botao>
              <p className="text-xs text-texto-suave">
                Pode ser executado mais de uma vez — não duplica mensalidades já geradas.
              </p>
            </form>
          </CartaoCorpo>
        </Cartao>
      ) : null}

      <FiltrosBarra filtros={filtros} />

      <div className="mt-6">
        <TabelaTitulos titulos={titulos} />
      </div>
    </div>
  );
}
