import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, CalendarDays, Clock, MapPin } from "lucide-react";
import { formatarData, formatarDataLonga } from "@/lib/datas";
import { obterEvento } from "@/lib/conteudo";
import { registrarAcesso, registrarVisualizacao } from "@/lib/metricas";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

/** Mostra a faixa so quando o fim existe e e diferente do inicio: quem cadastra
 *  costuma repetir a hora, e "09:00 as 09:00" nao diz nada. */
function horario(inicio: string, fim: string | null) {
  const h = formatarData(inicio, "HH:mm");
  if (!fim) return h;
  const hf = formatarData(fim, "HH:mm");
  return hf === h ? h : `${h} às ${hf}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const evento = await obterEvento(id);
  if (!evento) return { title: "Evento não encontrado" };
  return {
    title: evento.titulo,
    description: evento.descricao?.slice(0, 160) ?? undefined,
    openGraph: { images: evento.imagem_url ? [evento.imagem_url] : undefined },
  };
}

export default async function PaginaEvento({ params }: Props) {
  const { id } = await params;
  const evento = await obterEvento(id);
  if (!evento) notFound();

  await Promise.all([
    registrarAcesso(`/eventos/${id}`),
    registrarVisualizacao("evento", evento.id),
  ]);

  return (
    <article className="pb-16">
      {evento.imagem_url ? (
        /* A arte do evento costuma ser um cartaz vertical: mostramos inteira,
           sem recorte, sobre um fundo da propria paleta. */
        <div className="bg-marca-50">
          <div className="container-site flex justify-center py-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={evento.imagem_url}
              alt={evento.titulo}
              className="max-h-[70vh] w-auto max-w-full rounded-2xl border border-borda object-contain shadow-sm shadow-marca-900/10"
            />
          </div>
        </div>
      ) : null}

      <div className="container-site max-w-3xl pt-10">
        <Link
          href="/eventos"
          className="inline-flex items-center gap-1 text-sm font-medium text-marca-700 hover:text-marca-800"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar à agenda
        </Link>

        <h1 className="mt-6 text-3xl font-semibold leading-tight tracking-tight text-texto sm:text-4xl">
          {evento.titulo}
        </h1>

        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-texto-suave">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4 text-marca-600" />
            <span className="first-letter:uppercase">{formatarDataLonga(evento.inicio)}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-marca-600" />
            {horario(evento.inicio, evento.fim)}
          </span>
          {evento.local ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-marca-600" />
              {evento.local}
            </span>
          ) : null}
        </div>

        {evento.descricao ? (
          <div className="mt-8 space-y-4 text-base leading-relaxed text-texto">
            {evento.descricao
              .split(/\n{2,}/)
              .filter(Boolean)
              .map((paragrafo, i) => (
                <p key={i}>{paragrafo}</p>
              ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}
