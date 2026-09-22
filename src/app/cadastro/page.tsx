import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/site/Logo";
import { FormularioCadastro } from "./FormularioCadastro";

export const metadata: Metadata = { title: "Criar conta" };

export default function PaginaCadastro() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-marca-100 via-marca-50 to-fundo px-5 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex justify-center">
          <Logo />
        </Link>

        <div className="rounded-3xl border border-borda bg-white p-8 shadow-lg shadow-marca-900/5">
          <h1 className="text-xl font-semibold text-texto">Criar conta</h1>
          <p className="mt-1 text-sm text-texto-suave">
            Favorite questões e acompanhe sua leitura do Livro dos Espíritos.
          </p>

          <Suspense fallback={<div className="mt-6 h-64 animate-pulse rounded-xl bg-marca-50" />}>
            <FormularioCadastro />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-sm text-texto-suave">
          Já tem conta?{" "}
          <Link href="/entrar" className="font-medium text-marca-700 hover:text-marca-800">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
