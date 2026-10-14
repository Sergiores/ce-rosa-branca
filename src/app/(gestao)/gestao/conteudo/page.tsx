import Link from "next/link";
import type { Metadata } from "next";
import { Newspaper, MessageSquareQuote, CalendarDays, HeartHandshake, FileText, BookOpen } from "lucide-react";
import { Cartao, CartaoCorpo } from "@/components/ui";
import { exigirTela, type TelaKey } from "@/lib/auth/permissoes";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Conteúdo do site" };

const SECOES = [
  { tela: "conteudo_noticias" as TelaKey, href: "/gestao/conteudo/noticias", titulo: "Notícias", texto: "Publique notícias e escolha o que aparece no carrossel.", Icone: Newspaper },
  { tela: "conteudo_mensagens" as TelaKey, href: "/gestao/conteudo/mensagens", titulo: "Mensagem do dia", texto: "A mensagem exibida na página inicial.", Icone: MessageSquareQuote },
  { tela: "conteudo_eventos" as TelaKey, href: "/gestao/conteudo/eventos", titulo: "Eventos", texto: "Programação, palestras e cursos.", Icone: CalendarDays },
  { tela: "conteudo_projetos" as TelaKey, href: "/gestao/conteudo/projetos", titulo: "Projetos", texto: "Frentes de trabalho da casa.", Icone: HeartHandshake },
  { tela: "conteudo_paginas" as TelaKey, href: "/gestao/conteudo/paginas", titulo: "Páginas institucionais", texto: "A Casa, missão e valores, contato.", Icone: FileText },
  { tela: "conteudo_livro" as TelaKey, href: "/gestao/conteudo/estudo", titulo: "Livro dos Espíritos", texto: "Questões, respostas e pareceres.", Icone: BookOpen },
];

export default async function PaginaConteudo() {
  // "conteudo" e liberado para quem tiver qualquer tela daqui. Os cartoes
  // filtram tela por tela — mostrar os seis faria cinco deles barrarem.
  const sessao = await exigirTela("conteudo");
  const secoes = SECOES.filter((s) => sessao.podeVer(s.tela));

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-semibold tracking-tight text-texto">Conteúdo do site</h1>
      <p className="mt-1 text-texto-suave">
        Tudo o que os visitantes veem. Rascunhos não aparecem no site.
      </p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {secoes.map(({ href, titulo, texto, Icone }) => (
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
    </div>
  );
}
