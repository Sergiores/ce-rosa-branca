import Link from "next/link";
import type { Metadata } from "next";
import { Newspaper, FileText, Users, ArrowUpCircle, ArrowDownCircle, Eye } from "lucide-react";
import { Cartao, CartaoCorpo, Etiqueta } from "@/components/ui";
import { exigirSessao, type TelaKey } from "@/lib/auth/permissoes";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Painel" };

const ATALHOS: { tela: TelaKey; href: string; titulo: string; texto: string; Icone: typeof Newspaper }[] = [
  { tela: "conteudo", href: "/gestao/conteudo", titulo: "Conteúdo do site", texto: "Notícias, mensagem do dia, eventos e projetos.", Icone: Newspaper },
  { tela: "atas", href: "/gestao/atas", titulo: "Atas de reunião", texto: "Registro das reuniões e deliberações.", Icone: FileText },
  { tela: "membros", href: "/gestao/membros", titulo: "Membros", texto: "Cadastro e configuração de mensalidades.", Icone: Users },
  { tela: "contas_pagar", href: "/gestao/contas-pagar", titulo: "Contas a pagar", texto: "Duplicatas em aberto e baixas.", Icone: ArrowUpCircle },
  { tela: "contas_receber", href: "/gestao/contas-receber", titulo: "Contas a receber", texto: "Mensalidades e recebimentos.", Icone: ArrowDownCircle },
  { tela: "audiencia", href: "/gestao/audiencia", titulo: "Audiência do site", texto: "Acessos e conteúdos mais vistos.", Icone: Eye },
];

export default async function PainelGestao({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const sessao = await exigirSessao();
  const { erro } = await searchParams;
  const atalhos = ATALHOS.filter((a) => sessao.podeVer(a.tela));

  return (
    <div className="mx-auto max-w-5xl">
      {erro === "sem-permissao" ? (
        <p className="mb-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Você não tem permissão para acessar aquela tela.
        </p>
      ) : null}

      <h1 className="text-2xl font-semibold tracking-tight text-texto">
        Olá, {sessao.perfil.nome?.split(" ")[0] || "bem-vindo"}.
      </h1>
      <p className="mt-1 text-texto-suave">Este é o painel de gestão da Casa Espírita Rosa Branca.</p>

      {atalhos.length === 0 ? (
        <Cartao className="mt-8">
          <CartaoCorpo>
            <Etiqueta tom="cinza">Acesso limitado</Etiqueta>
            <p className="mt-3 text-sm text-texto-suave">
              Seu perfil ainda não tem telas liberadas. Fale com a diretoria.
            </p>
          </CartaoCorpo>
        </Cartao>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {atalhos.map(({ href, titulo, texto, Icone }) => (
            <Link key={href} href={href} className="group">
              <Cartao className="h-full group-hover:shadow-lg group-hover:shadow-marca-900/10">
                <CartaoCorpo>
                  <Icone className="h-7 w-7 text-marca-600" />
                  <h2 className="mt-3 font-semibold text-texto group-hover:text-marca-700">{titulo}</h2>
                  <p className="mt-1 text-sm text-texto-suave">{texto}</p>
                </CartaoCorpo>
              </Cartao>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
