import Link from "next/link";
import type { Metadata } from "next";
import { BookOpen } from "lucide-react";
import { Cartao, CartaoCorpo, Etiqueta, TituloSecao, Vazio } from "@/components/ui";
import { listarQuestoes } from "@/lib/conteudo";
import { registrarAcesso } from "@/lib/metricas";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Estudo do Livro dos Médiuns" };

export default async function PaginaEstudo() {
  await registrarAcesso("/estudo");
  const questoes = await listarQuestoes();

  const porCapitulo = new Map<string, typeof questoes>();
  for (const q of questoes) {
    const chave = q.capitulo ?? "Questões";
    porCapitulo.set(chave, [...(porCapitulo.get(chave) ?? []), q]);
  }

  return (
    <div className="container-site py-14">
      <div className="mb-10 flex items-start gap-4 rounded-2xl border border-azul-200 bg-gradient-to-br from-white to-azul-50 p-6 sm:p-8">
        <BookOpen className="mt-1 h-8 w-8 shrink-0 text-azul-600" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-texto sm:text-3xl">
            Estudo do Livro dos Médiuns
          </h1>
          <p className="mt-2 max-w-2xl text-texto-suave">
            Cada questão traz a pergunta, a resposta original da obra e o parecer dos médiuns da casa
            sobre o texto — fruto do estudo em grupo.
          </p>
        </div>
      </div>

      {questoes.length === 0 ? (
        <Vazio mensagem="As questões ainda estão sendo cadastradas." />
      ) : (
        <div className="space-y-10">
          {[...porCapitulo.entries()].map(([capitulo, lista]) => (
            <section key={capitulo}>
              <TituloSecao className="mb-5" titulo={capitulo} />
              <div className="grid gap-4 sm:grid-cols-2">
                {lista.map((q) => (
                  <Link key={q.id} href={`/estudo/${q.numero}`} className="group">
                    <Cartao className="h-full group-hover:shadow-lg group-hover:shadow-azul-900/10">
                      <CartaoCorpo>
                        <Etiqueta tom="azul">Questão {q.numero}</Etiqueta>
                        <p className="mt-3 line-clamp-3 text-base font-medium leading-snug text-texto group-hover:text-azul-700">
                          {q.pergunta}
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
