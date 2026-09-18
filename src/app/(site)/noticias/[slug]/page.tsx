import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { formatarDataLonga } from "@/lib/datas";
import { emParagrafos } from "@/lib/utils";
import { obterNoticia } from "@/lib/conteudo";
import { registrarAcesso, registrarVisualizacao } from "@/lib/metricas";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const noticia = await obterNoticia(slug);
  if (!noticia) return { title: "Notícia não encontrada" };
  return {
    title: noticia.titulo,
    description: noticia.resumo ?? undefined,
    openGraph: { images: noticia.imagem_url ? [noticia.imagem_url] : undefined },
  };
}

export default async function PaginaNoticia({ params }: Props) {
  const { slug } = await params;
  const noticia = await obterNoticia(slug);
  if (!noticia) notFound();

  await Promise.all([
    registrarAcesso(`/noticias/${slug}`),
    registrarVisualizacao("noticia", noticia.id),
  ]);

  return (
    <article className="pb-16">
      {noticia.imagem_url ? (
        <div
          className="h-64 w-full bg-marca-100 bg-cover bg-center sm:h-96"
          style={{ backgroundImage: `url(${noticia.imagem_url})` }}
        />
      ) : null}

      <div className="container-site max-w-3xl pt-10">
        <Link
          href="/noticias"
          className="inline-flex items-center gap-1 text-sm font-medium text-marca-700 hover:text-marca-800"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar às notícias
        </Link>

        <p className="mt-6 text-sm text-texto-suave">
          {formatarDataLonga(noticia.publicado_em ?? noticia.criado_em)}
        </p>
        <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-tight text-texto sm:text-4xl">
          {noticia.titulo}
        </h1>
        {noticia.resumo ? (
          <p className="mt-4 text-lg leading-relaxed text-texto-suave">{noticia.resumo}</p>
        ) : null}

        <div className="mt-8 space-y-4 text-base leading-relaxed text-texto">
          {emParagrafos(noticia.corpo).map((paragrafo, i) => (
            <p key={i} className="whitespace-pre-line">
              {paragrafo}
            </p>
          ))}
        </div>
      </div>
    </article>
  );
}
