import Link from "next/link";
import type { Metadata } from "next";
import { BookOpen, CheckCircle2, Heart, Search, X } from "lucide-react";
import { Botao, Campo, Cartao, CartaoCorpo, Etiqueta, Vazio } from "@/components/ui";
import { BotaoFavoritar } from "@/components/site/BotaoFavoritar";
import { listarQuestoes } from "@/lib/conteudo";
import { obterInteracoes } from "@/lib/estudo/leitura";
import { criarClienteServidor } from "@/lib/supabase/server";
import { registrarAcesso } from "@/lib/metricas";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Estudo do Livro dos Espíritos" };

export default async function PaginaEstudo({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await registrarAcesso("/estudo");
  const { q } = await searchParams;
  const busca = q?.trim() ?? "";

  // listarQuestoes já ordena pela mais recente publicada primeiro.
  const questoes = await listarQuestoes(busca);

  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const logado = Boolean(user);

  const { lidas, favoritas } = await obterInteracoes(questoes.map((q) => q.id));

  return (
    <div className="container-site py-14">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-6 rounded-2xl border border-marca-200 bg-gradient-to-br from-white to-marca-50 p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <BookOpen className="mt-1 h-8 w-8 shrink-0 text-marca-600" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-texto sm:text-3xl">
              Estudo do Livro dos Espíritos
            </h1>
            <p className="mt-2 max-w-2xl text-texto-suave">
              Cada questão traz a pergunta, a resposta original da obra e o parecer dos médiuns da casa
              sobre o texto — fruto do estudo em grupo. As mais recentes aparecem primeiro.
            </p>
          </div>
        </div>

        <Link
          href={logado ? "/estudo/favoritas" : "/entrar?redirecionar=/estudo/favoritas"}
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-marca-200 bg-white px-5 py-2.5 text-sm font-medium text-marca-700 hover:bg-marca-50"
        >
          <Heart className="h-4 w-4" />
          Minhas favoritas
        </Link>
      </div>

      {/* Busca */}
      <form className="mb-10 flex flex-wrap gap-3">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-texto-suave" />
          <Campo
            name="q"
            defaultValue={busca}
            placeholder="Buscar pelo número da questão ou por uma palavra"
            className="h-12 pl-11"
            aria-label="Buscar questão"
          />
        </div>
        <Botao type="submit" tamanho="lg">
          Buscar
        </Botao>
        {busca ? (
          <Link
            href="/estudo"
            className="inline-flex h-13 items-center gap-2 rounded-full border border-marca-200 bg-white px-6 text-sm font-medium text-marca-700 hover:bg-marca-50"
          >
            <X className="h-4 w-4" /> Limpar
          </Link>
        ) : null}
      </form>

      {busca ? (
        <p className="mb-6 text-sm text-texto-suave">
          {questoes.length === 0
            ? `Nenhuma questão encontrada para “${busca}”.`
            : `${questoes.length} ${questoes.length === 1 ? "questão encontrada" : "questões encontradas"} para “${busca}”.`}
        </p>
      ) : null}

      {questoes.length === 0 ? (
        <Vazio
          mensagem={
            busca
              ? "Tente outro número ou outra palavra."
              : "As questões ainda estão sendo cadastradas."
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {questoes.map((questao) => {
            const lida = lidas.has(questao.id);
            const favoritada = favoritas.has(questao.id);

            return (
              <Cartao key={questao.id} className="group h-full hover:shadow-lg hover:shadow-marca-900/10">
                <CartaoCorpo className="flex items-start justify-between gap-3">
                  <Link href={`/estudo/${questao.numero}`} className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Etiqueta tom="marca">Questão {questao.numero}</Etiqueta>
                      {questao.capitulo ? <Etiqueta tom="cinza">{questao.capitulo}</Etiqueta> : null}
                      {lida ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-marca-600">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Lida
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-3 line-clamp-3 text-base font-medium leading-snug text-texto group-hover:text-marca-700">
                      {questao.pergunta}
                    </p>
                  </Link>

                  {logado ? (
                    <BotaoFavoritar
                      questaoId={questao.id}
                      favoritadaInicial={favoritada}
                      tamanho="sm"
                    />
                  ) : (
                    <Link
                      href={`/entrar?redirecionar=/estudo`}
                      aria-label="Entre para favoritar"
                      title="Entre para favoritar"
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-borda bg-white text-texto-suave hover:border-marca-200 hover:text-marca-600"
                    >
                      <Heart className="h-4 w-4" />
                    </Link>
                  )}
                </CartaoCorpo>
              </Cartao>
            );
          })}
        </div>
      )}
    </div>
  );
}
