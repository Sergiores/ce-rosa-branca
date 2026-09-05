import type { Metadata } from "next";
import {
  FiltrosTitulosBarra, IndicadoresTitulos, TabelaTitulos, carregarTitulos,
  type FiltrosTitulos,
} from "@/components/gestao/ListaTitulos";
import { CabecalhoLista } from "@/components/gestao/Lista";
import { exigirTela } from "@/lib/auth/permissoes";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Contas a pagar" };

const BASE = "/gestao/contas-pagar";

export default async function ContasPagar({
  searchParams,
}: {
  searchParams: Promise<FiltrosTitulos>;
}) {
  const sessao = await exigirTela("contas_pagar");
  const filtros = await searchParams;
  const titulos = await carregarTitulos("pagar", filtros);

  return (
    <div className="mx-auto max-w-5xl">
      <CabecalhoLista
        titulo="Contas a pagar"
        descricao="Duplicatas geradas pelos documentos de compra. Clique no título para dar baixa."
        novoHref="/gestao/compras/novo"
        novoRotulo="Lançar documento"
        podeEditar={sessao.podeEditar("compras")}
      />

      <IndicadoresTitulos titulos={titulos} />

      <FiltrosTitulosBarra base={BASE} filtros={filtros} />

      <div className="mt-6">
        <TabelaTitulos titulos={titulos} />
      </div>

      {titulos.length > 0 ? (
        <p className="mt-4 text-sm text-texto-suave">
          {titulos.length} título(s) listado(s).
        </p>
      ) : null}
    </div>
  );
}
