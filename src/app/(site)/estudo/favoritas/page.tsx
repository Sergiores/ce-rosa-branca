import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, CheckCircle2, Heart } from "lucide-react";
import { Cartao, CartaoCorpo, Etiqueta, Vazio } from "@/components/ui";
import { BotaoFavoritar } from "@/components/site/BotaoFavoritar";
import { listarQuestoesFavoritas, obterInteracoes } from "@/lib/estudo/leitura";
import { criarClienteServidor } from "@/lib/supabase/server";
import { registrarAcesso } from "@/lib/metricas";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Minhas questões favoritas" };

export default async function PaginaFavoritas() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Favoritar é por pessoa — sem sessão não há o que mostrar.
  if (!user) redirect("/entrar?redirecionar=/estudo/favoritas");

  await registrarAcesso("/estudo/favoritas");

  const questoes = await listarQuestoesFavoritas();
  const { lidas } = await obterInteracoes(questoes.map((q) => q.id));

  return (
    <div className="container-site py-14">
      <Link
        href="/estudo"
        className="inline-flex items-center gap-1 text-sm font-medium text-marca-700 hover:text-marca-800"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar ao estudo
      </Link>

      <div className="mt-6 flex items-start gap-4">
        <Heart className="mt-1 h-8 w-8 shrink-0 text-marca-600" fill="currentColor" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-texto sm:text-3xl">
            Minhas questões favoritas
          </h1>
          <p className="mt-2 max-w-2xl text-texto-suave">
            As questões que você marcou para voltar a estudar.
          </p>
        </div>
      </div>

      {questoes.length === 0 ? (
        <div className="mt-10">
          <Vazio mensagem="Você ainda não favoritou nenhuma questão. Toque no coração em qualquer questão do estudo." />
        </div>
      ) : (
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {questoes.map((questao) => (
            <Cartao key={questao.id} className="group h-full hover:shadow-lg hover:shadow-marca-900/10">
              <CartaoCorpo className="flex items-start justify-between gap-3">
                <Link href={`/estudo/${questao.numero}`} className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Etiqueta tom="marca">Questão {questao.numero}</Etiqueta>
                    {questao.capitulo ? <Etiqueta tom="cinza">{questao.capitulo}</Etiqueta> : null}
                    {lidas.has(questao.id) ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-marca-600">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Lida
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-3 line-clamp-3 text-base font-medium leading-snug text-texto group-hover:text-marca-700">
                    {questao.pergunta}
                  </p>
                </Link>
                <BotaoFavoritar questaoId={questao.id} favoritadaInicial tamanho="sm" />
              </CartaoCorpo>
            </Cartao>
          ))}
        </div>
      )}
    </div>
  );
}
