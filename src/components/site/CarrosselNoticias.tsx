"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatarDataLonga } from "@/lib/datas";
import type { Noticia } from "@/lib/tipos";

export function CarrosselNoticias({ noticias }: { noticias: Noticia[] }) {
  const [emblaRef, embla] = useEmblaCarousel({ loop: true, align: "start" });
  const [atual, setAtual] = useState(0);

  const aoSelecionar = useCallback(() => {
    if (embla) setAtual(embla.selectedScrollSnap());
  }, [embla]);

  useEffect(() => {
    if (!embla) return;
    aoSelecionar();
    embla.on("select", aoSelecionar);
    const timer = setInterval(() => embla.scrollNext(), 7000);
    return () => {
      clearInterval(timer);
      embla.off("select", aoSelecionar);
    };
  }, [embla, aoSelecionar]);

  if (noticias.length === 0) return null;

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-3xl" ref={emblaRef}>
        <div className="flex">
          {noticias.map((n) => (
            <article key={n.id} className="relative min-w-0 flex-[0_0_100%]">
              <div
                className="relative flex min-h-[22rem] flex-col justify-end bg-marca-800 bg-cover bg-center p-8 sm:min-h-[26rem] sm:p-12"
                style={n.imagem_url ? { backgroundImage: `url(${n.imagem_url})` } : undefined}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-marca-900/90 via-marca-900/55 to-marca-900/10" />
                <div className="relative max-w-2xl text-white">
                  <p className="text-xs font-medium uppercase tracking-wider text-marca-200">
                    {formatarDataLonga(n.publicado_em ?? n.criado_em)}
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold leading-tight sm:text-4xl">
                    {n.titulo}
                  </h2>
                  {n.resumo ? (
                    <p className="mt-3 line-clamp-3 text-sm text-white/85 sm:text-base">{n.resumo}</p>
                  ) : null}
                  <Link
                    href={`/noticias/${n.slug}`}
                    className="mt-6 inline-flex rounded-full bg-white px-6 py-2.5 text-sm font-medium text-marca-800 transition-transform hover:scale-[1.02]"
                  >
                    Ler notícia
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {noticias.length > 1 ? (
        <>
          <button
            type="button"
            aria-label="Anterior"
            onClick={() => embla?.scrollPrev()}
            className="absolute left-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-marca-800 shadow-lg transition-transform hover:scale-105 sm:grid"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Próxima"
            onClick={() => embla?.scrollNext()}
            className="absolute right-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-marca-800 shadow-lg transition-transform hover:scale-105 sm:grid"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
            {noticias.map((n, i) => (
              <button
                key={n.id}
                type="button"
                aria-label={`Ir para a notícia ${i + 1}`}
                onClick={() => embla?.scrollTo(i)}
                className={cn(
                  "h-2 rounded-full transition-all",
                  i === atual ? "w-7 bg-white" : "w-2 bg-white/50 hover:bg-white/80",
                )}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
