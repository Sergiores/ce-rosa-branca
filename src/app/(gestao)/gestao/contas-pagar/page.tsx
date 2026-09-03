import type { Metadata } from "next";
import {
  FiltrosBarra, IndicadoresTitulos, TabelaTitulos, carregarTitulos, type FiltrosTitulos,
} from "@/components/gestao/ListaTitulos";
import { exigirTela } from "@/lib/auth/permissoes";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Contas a pagar" };

export default async function ContasPagar({
  searchParams,
}: {
  searchParams: Promise<FiltrosTitulos>;
}) {
  await exigirTela("contas_pagar");
  const filtros = await searchParams;
  const titulos = await carregarTitulos("pagar", filtros);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-semibold tracking-tight text-texto">Contas a pagar</h1>
      <p className="mt-1 text-texto-suave">
        Duplicatas geradas pelos documentos de compra. Clique no título para dar baixa.
      </p>

      <div className="mt-8">
        <IndicadoresTitulos titulos={titulos} />
      </div>

      <FiltrosBarra filtros={filtros} />

      <div className="mt-6">
        <TabelaTitulos titulos={titulos} />
      </div>
    </div>
  );
}
