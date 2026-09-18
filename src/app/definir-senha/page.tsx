import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/site/Logo";
import { FormularioSenha } from "./FormularioSenha";

export const metadata: Metadata = { title: "Definir senha" };

export default function PaginaDefinirSenha() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-marca-100 via-marca-50 to-fundo px-5 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex justify-center">
          <Logo />
        </Link>

        <div className="rounded-3xl border border-borda bg-white p-8 shadow-lg shadow-marca-900/5">
          <h1 className="text-xl font-semibold text-texto">Definir senha</h1>
          <p className="mt-1 text-sm text-texto-suave">
            Escolha uma senha para acessar a área restrita.
          </p>
          <FormularioSenha />
        </div>
      </div>
    </div>
  );
}
