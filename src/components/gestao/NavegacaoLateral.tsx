"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Newspaper, FileText, Users, ShieldCheck, UserCog,
  ShoppingCart, ArrowDownCircle, ArrowUpCircle, BarChart3, History, Eye, Menu, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TelaKey } from "@/lib/auth/permissoes";

const ITENS: { tela: TelaKey; href: string; rotulo: string; Icone: typeof LayoutDashboard }[] = [
  { tela: "painel", href: "/gestao", rotulo: "Painel", Icone: LayoutDashboard },
  { tela: "conteudo", href: "/gestao/conteudo", rotulo: "Conteúdo do site", Icone: Newspaper },
  { tela: "atas", href: "/gestao/atas", rotulo: "Atas de reunião", Icone: FileText },
  { tela: "membros", href: "/gestao/membros", rotulo: "Membros", Icone: Users },
  { tela: "compras", href: "/gestao/compras", rotulo: "Documentos", Icone: ShoppingCart },
  { tela: "contas_pagar", href: "/gestao/contas-pagar", rotulo: "Contas a pagar", Icone: ArrowUpCircle },
  { tela: "contas_receber", href: "/gestao/contas-receber", rotulo: "Contas a receber", Icone: ArrowDownCircle },
  { tela: "relatorios", href: "/gestao/relatorios", rotulo: "Relatórios", Icone: BarChart3 },
  { tela: "usuarios", href: "/gestao/usuarios", rotulo: "Usuários", Icone: UserCog },
  { tela: "permissoes", href: "/gestao/permissoes", rotulo: "Permissões", Icone: ShieldCheck },
  { tela: "auditoria", href: "/gestao/auditoria", rotulo: "Auditoria", Icone: History },
  { tela: "audiencia", href: "/gestao/audiencia", rotulo: "Audiência do site", Icone: Eye },
];

export function NavegacaoLateral({ telasVisiveis }: { telasVisiveis: TelaKey[] }) {
  const path = usePathname();
  const [aberto, setAberto] = useState(false);
  const itens = ITENS.filter((i) => telasVisiveis.includes(i.tela));

  const lista = (
    <nav className="space-y-1">
      {itens.map(({ href, rotulo, Icone }) => {
        const ativo = href === "/gestao" ? path === "/gestao" : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setAberto(false)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              ativo
                ? "bg-azul-600 text-white shadow-md shadow-azul-600/20"
                : "text-texto-suave hover:bg-azul-50 hover:text-azul-700",
            )}
          >
            <Icone className="h-4 w-4 shrink-0" />
            {rotulo}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-label="Abrir menu da gestão"
        className="fixed bottom-5 right-5 z-50 grid h-12 w-12 place-items-center rounded-full bg-azul-600 text-white shadow-lg lg:hidden"
      >
        {aberto ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <aside className="hidden w-64 shrink-0 border-r border-borda bg-white p-4 lg:block">
        {lista}
      </aside>

      {aberto ? (
        <div className="fixed inset-0 z-40 bg-texto/30 lg:hidden" onClick={() => setAberto(false)}>
          <div
            className="absolute bottom-0 left-0 right-0 max-h-[75vh] overflow-y-auto rounded-t-3xl bg-white p-5"
            onClick={(e) => e.stopPropagation()}
          >
            {lista}
          </div>
        </div>
      ) : null}
    </>
  );
}
