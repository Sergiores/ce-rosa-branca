import { Suspense } from "react";
import Link from "next/link";
import { Logo } from "@/components/site/Logo";
import type { Metadata } from "next";
import { FormularioLogin } from "./FormularioLogin";

export const metadata: Metadata = { title: "Entrar" };

export default async function PaginaEntrar({
  searchParams,
}: {
  searchParams: Promise<{ redirecionar?: string }>;
}) {
  const { redirecionar } = await searchParams;
  const linkCadastro = redirecionar
    ? `/cadastro?redirecionar=${encodeURIComponent(redirecionar)}`
    : "/cadastro";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-marca-100 via-marca-50 to-fundo px-5 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex justify-center">
          <Logo />
        </Link>

        <div className="rounded-3xl border border-borda bg-white p-8 shadow-lg shadow-marca-900/5">
          <h1 className="text-xl font-semibold text-texto">Entrar</h1>
          <p className="mt-1 text-sm text-texto-suave">
            Diretoria, voluntários, alunos e membros entram com a conta convidada pela casa.
          </p>

          <Suspense fallback={<div className="mt-6 h-48 animate-pulse rounded-xl bg-marca-50" />}>
            <FormularioLogin />
          </Suspense>

          <p className="mt-6 text-center text-sm text-texto-suave">
            Só quer favoritar questões do estudo?{" "}
            <Link href={linkCadastro} className="font-medium text-marca-700 hover:text-marca-800">
              Crie uma conta gratuita
            </Link>
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
