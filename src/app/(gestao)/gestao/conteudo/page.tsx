import Link from "next/link";
import type { Metadata } from "next";
import { Newspaper, MessageSquareQuote, CalendarDays, HeartHandshake, FileText, BookOpen } from "lucide-react";
import { Cartao, CartaoCorpo } from "@/components/ui";
import { exigirTela } from "@/lib/auth/permissoes";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Conteúdo do site" };

const SECOES = [
  { href: "/gestao/conteudo/noticias", titulo: "Notícias", texto: "Publique notícias e escolha o que aparece no carrossel.", Icone: Newspaper },
  { href: "/gestao/conteudo/mensagens", titulo: "Mensagem do dia", texto: "A mensagem exibida na página inicial.", Icone: MessageSquareQuote },
  { href: "/gestao/conteudo/eventos", titulo: "Eventos", texto: "Programação, palestras e cursos.", Icone: CalendarDays },
  { href: "/gestao/conteudo/projetos", titulo: "Projetos", texto: "Frentes de trabalho da casa.", Icone: HeartHandshake },
  { href: "/gestao/conteudo/paginas", titulo: "Páginas institucionais", texto: "A Casa, missão e valores, contato.", Icone: FileText },
  { href: "/gestao/conteudo/estudo", titulo: "Livro dos Médiuns", texto: "Questões, respostas e pareceres.", Icone: BookOpen },
];

export default async function PaginaConteudo() {
  await exigirTela("conteudo");

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-semibold tracking-tight text-texto">Conteúdo do site</h1>
      <p className="mt-1 text-texto-suave">
        Tudo o que os visitantes veem. Rascunhos não aparecem no site.
      </p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {SECOES.map(({ href, titulo, texto, Icone }) => (
          <Link key={href} href={href} className="group">
            <Cartao className="h-full group-hover:shadow-lg group-hover:shadow-azul-900/10">
              <CartaoCorpo>
                <Icone className="h-7 w-7 text-azul-600" />
                <h2 className="mt-3 font-semibold text-texto group-hover:text-azul-700">{titulo}</h2>
                <p className="mt-1 text-sm text-texto-suave">{texto}</p>
              </CartaoCorpo>
            </Cartao>
          </Link>
        ))}
      </div>
    </div>
  );
}
