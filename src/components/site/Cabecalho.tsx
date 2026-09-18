"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", rotulo: "Início" },
  { href: "/noticias", rotulo: "Notícias" },
  { href: "/eventos", rotulo: "Eventos" },
  { href: "/projetos", rotulo: "Projetos" },
  { href: "/estudo", rotulo: "Estudo" },
  { href: "/sobre", rotulo: "A Casa" },
  { href: "/contato", rotulo: "Contato" },
];

export function Cabecalho({ lojaUrl }: { lojaUrl?: string }) {
  const [aberto, setAberto] = useState(false);
  const path = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-borda/70 bg-white/85 backdrop-blur-md">
      <div className="container-site flex h-18 items-center justify-between py-3">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-marca-600 text-sm font-semibold text-white shadow-md shadow-marca-600/25">
            RB
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold text-texto">Casa Espírita</span>
            <span className="block text-sm text-marca-600">Rosa Branca</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => {
            const ativo = item.href === "/" ? path === "/" : path.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  ativo ? "bg-marca-100 text-marca-800" : "text-texto-suave hover:bg-marca-50 hover:text-marca-700",
                )}
              >
                {item.rotulo}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {lojaUrl ? (
            <a
              href={lojaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-2 rounded-full bg-marca-600 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-marca-600/20 transition-all hover:bg-marca-700 hover:shadow-lg sm:inline-flex"
            >
              <ShoppingBag className="h-4 w-4" />
              Loja
            </a>
          ) : null}
          <Link
            href="/entrar"
            className="hidden rounded-full border border-marca-200 px-5 py-2.5 text-sm font-medium text-marca-700 transition-colors hover:bg-marca-50 sm:inline-flex"
          >
            Entrar
          </Link>
          <button
            type="button"
            aria-label="Abrir menu"
            onClick={() => setAberto((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-full text-marca-700 hover:bg-marca-50 lg:hidden"
          >
            {aberto ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {aberto ? (
        <div className="border-t border-borda bg-white lg:hidden">
          <nav className="container-site flex flex-col py-3">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setAberto(false)}
                className="rounded-xl px-3 py-3 text-sm font-medium text-texto-suave hover:bg-marca-50 hover:text-marca-700"
              >
                {item.rotulo}
              </Link>
            ))}
            <Link
              href="/entrar"
              onClick={() => setAberto(false)}
              className="mt-2 rounded-xl bg-marca-100 px-3 py-3 text-center text-sm font-medium text-marca-800"
            >
              Entrar na área restrita
            </Link>
            {lojaUrl ? (
              <a
                href={lojaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 rounded-xl bg-marca-600 px-3 py-3 text-center text-sm font-medium text-white"
              >
                Loja online
              </a>
            ) : null}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
