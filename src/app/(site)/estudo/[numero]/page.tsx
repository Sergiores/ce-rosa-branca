import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, MessageSquareQuote } from "lucide-react";
import { Cartao, CartaoCorpo, Etiqueta } from "@/components/ui";
import { obterQuestaoComPareceres } from "@/lib/conteudo";
import { registrarAcesso } from "@/lib/metricas";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ numero: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { numero } = await params;
  return { title: `Questão ${numero} — Livro dos Espíritos` };
}

export default async function PaginaQuestao({ params }: Props) {
  const { numero } = await params;
  const n = Number(numero);
  if (!Number.isInteger(n)) notFound();

  const { questao, pareceres } = await obterQuestaoComPareceres(n);
  if (!questao) notFound();

  await registrarAcesso(`/estudo/${numero}`);

  return (
    <div className="container-site max-w-3xl py-14">
      <Link
        href="/estudo"
        className="inline-flex items-center gap-1 text-sm font-medium text-azul-700 hover:text-azul-800"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar ao estudo
      </Link>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Etiqueta tom="azul">Questão {questao.numero}</Etiqueta>
        {questao.parte ? <Etiqueta tom="cinza">{questao.parte}</Etiqueta> : null}
        {questao.capitulo ? <Etiqueta tom="cinza">{questao.capitulo}</Etiqueta> : null}
      </div>

      <h1 className="mt-4 text-2xl font-semibold leading-snug tracking-tight text-texto sm:text-3xl">
        {questao.pergunta}
      </h1>

      <Cartao className="mt-8 border-azul-200 bg-gradient-to-br from-white to-azul-50">
        <CartaoCorpo className="sm:p-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-azul-700">Resposta</h2>
          <div className="mt-3 space-y-3 text-base leading-relaxed text-texto">
            {questao.resposta
              .split(/\n{2,}/)
              .filter(Boolean)
              .map((p, i) => (
                <p key={i}>{p}</p>
              ))}
          </div>
        </CartaoCorpo>
      </Cartao>

      <section className="mt-10">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-texto">
          <MessageSquareQuote className="h-5 w-5 text-azul-600" />
          Parecer dos médiuns
        </h2>

        {pareceres.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-borda bg-white/60 px-6 py-8 text-center text-sm text-texto-suave">
            Ainda não há parecer publicado para esta questão.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {pareceres.map((p) => (
              <Cartao key={p.id}>
                <CartaoCorpo>
                  <div className="space-y-3 text-base leading-relaxed text-texto">
                    {p.texto
                      .split(/\n{2,}/)
                      .filter(Boolean)
                      .map((par, i) => (
                        <p key={i}>{par}</p>
                      ))}
                  </div>
                  {p.autor_nome ? (
                    <p className="mt-4 text-sm text-texto-suave">— {p.autor_nome}</p>
                  ) : null}
                </CartaoCorpo>
              </Cartao>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
