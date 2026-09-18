import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { Cartao, CartaoCorpo } from "@/components/ui";
import { FormularioDocumento } from "../FormularioDocumento";
import { exigirTela } from "@/lib/auth/permissoes";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Lançar documento" };

export default async function NovoDocumento() {
  await exigirTela("compras", true);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/gestao/compras"
        className="inline-flex items-center gap-1 text-sm font-medium text-marca-700 hover:text-marca-800"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar aos documentos
      </Link>

      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-texto">Lançar documento</h1>
      <p className="mt-1 text-texto-suave">
        Entrada gera contas a pagar; saída gera contas a receber. A prazo, as duplicatas são
        criadas junto com o documento.
      </p>

      <Cartao className="mt-6">
        <CartaoCorpo className="sm:p-8">
          <FormularioDocumento />
        </CartaoCorpo>
      </Cartao>
    </div>
  );
}
