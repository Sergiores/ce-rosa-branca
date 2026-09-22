import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Heart, MessageSquareQuote } from "lucide-react";
import { Cartao, CartaoCorpo, Etiqueta } from "@/components/ui";
import { BotaoOuvir } from "@/components/site/BotaoOuvir";
import { BotaoFavoritar } from "@/components/site/BotaoFavoritar";
import { obterQuestaoComPareceres } from "@/lib/conteudo";
import { obterInteracoes } from "@/lib/estudo/leitura";
import { marcarQuestaoLida } from "@/lib/estudo/acoes";
import { criarClienteServidor } from "@/lib/supabase/server";
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

  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const logado = Boolean(user);

  await Promise.all([
    registrarAcesso(`/estudo/${numero}`),
    // Marca automática de leitura, best-effort: quem abriu, leu.
    marcarQuestaoLida(questao.id),
  ]);

  const { favoritas } = await obterInteracoes([questao.id]);
  const favoritada = favoritas.has(questao.id);

  // Texto lido em voz alta: pergunta, resposta da obra e pareceres publicados.
  const textoCompleto = [
    `Questão ${questao.numero}.`,
    questao.pergunta,
    "Resposta.",
    questao.resposta,
    ...pareceres.flatMap((p) => [
      p.autor_nome ? `Parecer de ${p.autor_nome}.` : "Parecer da casa.",
      p.texto,
    ]),
  ].join(" ");

  return (
    <div className="container-site max-w-3xl py-14">
      <Link
        href="/estudo"
        className="inline-flex items-center gap-1 text-sm font-medium text-marca-700 hover:text-marca-800"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar ao estudo
      </Link>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Etiqueta tom="marca">Questão {questao.numero}</Etiqueta>
        {questao.parte ? <Etiqueta tom="cinza">{questao.parte}</Etiqueta> : null}
        {questao.capitulo ? <Etiqueta tom="cinza">{questao.capitulo}</Etiqueta> : null}
      </div>

      <div className="mt-4 flex items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold leading-snug tracking-tight text-texto sm:text-3xl">
          {questao.pergunta}
        </h1>

        {logado ? (
          <BotaoFavoritar questaoId={questao.id} favoritadaInicial={favoritada} />
        ) : (
          <Link
            href={`/entrar?redirecionar=/estudo/${numero}`}
            aria-label="Entre para favoritar"
            title="Entre para favoritar"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-borda bg-white text-texto-suave hover:border-marca-200 hover:text-marca-600"
          >
            <Heart className="h-[18px] w-[18px]" />
          </Link>
        )}
      </div>

      {/* Leitura em voz alta da questao inteira, incluindo os pareceres. */}
      <BotaoOuvir className="mt-5" rotulo="Ouvir esta questão" texto={textoCompleto} />

      <Cartao className="mt-8 border-marca-200 bg-gradient-to-br from-white to-marca-50">
        <CartaoCorpo className="sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-marca-700">Resposta</h2>
            <BotaoOuvir rotulo="Ouvir só a resposta" texto={questao.resposta} />
          </div>
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
          <MessageSquareQuote className="h-5 w-5 text-marca-600" />
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
