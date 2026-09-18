import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { FormularioLogin } from "./FormularioLogin";

export const metadata: Metadata = { title: "Entrar" };

export default function PaginaEntrar() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-marca-100 via-marca-50 to-fundo px-5 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-marca-600 text-sm font-semibold text-white shadow-md shadow-marca-600/25">
            RB
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold text-texto">Casa Espírita</span>
            <span className="block text-sm text-marca-600">Rosa Branca</span>
          </span>
        </Link>

        <div className="rounded-3xl border border-borda bg-white p-8 shadow-lg shadow-marca-900/5">
          <h1 className="text-xl font-semibold text-texto">Área restrita</h1>
          <p className="mt-1 text-sm text-texto-suave">
            Acesso para diretoria, voluntários, alunos e membros.
          </p>

          <Suspense fallback={<div className="mt-6 h-48 animate-pulse rounded-xl bg-marca-50" />}>
            <FormularioLogin />
          </Suspense>

          <p className="mt-6 text-center text-xs text-texto-suave">
            O acesso é criado pela diretoria. Não há cadastro público.
          </p>
        </div>

        <p className="mt-6 text-center text-sm">
          <Link href="/" className="text-marca-700 hover:text-marca-800">
            Voltar ao site
          </Link>
        </p>
      </div>
    </div>
  );
}
