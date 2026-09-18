import Link from "next/link";
import type { Metadata } from "next";
import { BookOpen, Search, X } from "lucide-react";
import { Botao, Campo, Cartao, CartaoCorpo, Etiqueta, TituloSecao, Vazio } from "@/components/ui";
import { listarQuestoes } from "@/lib/conteudo";
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
  const questoes = await listarQuestoes(busca);

  const porCapitulo = new Map<string, typeof questoes>();
  for (const questao of questoes) {
    const chave = questao.capitulo ?? "Questões";
    porCapitulo.set(chave, [...(porCapitulo.get(chave) ?? []), questao]);
  }

  return (
    <div className="container-site py-14">
      <div className="mb-8 flex items-start gap-4 rounded-2xl border border-marca-200 bg-gradient-to-br from-white to-marca-50 p-6 sm:p-8">
        <BookOpen className="mt-1 h-8 w-8 shrink-0 text-marca-600" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-texto sm:text-3xl">
            Estudo do Livro dos Espíritos
          </h1>
          <p className="mt-2 max-w-2xl text-texto-suave">
            Cada questão traz a pergunta, a resposta original da obra e o parecer dos médiuns da casa
            sobre o texto — fruto do estudo em grupo.
          </p>
        </div>
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
        <div className="space-y-10">
          {[...porCapitulo.entries()].map(([capitulo, lista]) => (
            <section key={capitulo}>
              <TituloSecao className="mb-5" titulo={capitulo} />
              <div className="grid gap-4 sm:grid-cols-2">
                {lista.map((questao) => (
                  <Link key={questao.id} href={`/estudo/${questao.numero}`} className="group">
                    <Cartao className="h-full group-hover:shadow-lg group-hover:shadow-marca-900/10">
                      <CartaoCorpo>
                        <Etiqueta tom="marca">Questão {questao.numero}</Etiqueta>
                        <p className="mt-3 line-clamp-3 text-base font-medium leading-snug text-texto group-hover:text-marca-700">
                          {questao.pergunta}
                        </p>
                      </CartaoCorpo>
                    </Cartao>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
