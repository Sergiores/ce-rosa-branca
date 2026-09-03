import type { Metadata } from "next";
import { Compass, Eye, Gem } from "lucide-react";
import { Cartao, CartaoCorpo, TituloSecao } from "@/components/ui";
import { obterPagina } from "@/lib/conteudo";
import { registrarAcesso, registrarVisualizacao } from "@/lib/metricas";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Missão, visão e valores" };

const PADRAO = {
  missao:
    "Acolher, consolar e esclarecer à luz do Evangelho de Jesus e da doutrina espírita, promovendo o estudo, a prática da caridade e o desenvolvimento moral de todos.",
  visao:
    "Ser uma casa de referência no acolhimento fraterno e no estudo sério da doutrina espírita em nossa comunidade.",
  valores: [
    "Caridade em pensamento, palavra e ação",
    "Respeito à liberdade de consciência",
    "Estudo contínuo e responsável",
    "Trabalho voluntário e gratuito",
    "Transparência na gestão da casa",
  ],
};

export default async function PaginaMissao() {
  await Promise.all([
    registrarAcesso("/sobre/missao"),
    registrarVisualizacao("pagina", "missao"),
  ]);
  const pagina = await obterPagina("missao");

  return (
    <div className="container-site max-w-4xl py-14">
      <TituloSecao titulo="Missão, visão e valores" descricao="O que orienta o nosso trabalho." />

      {pagina?.corpo?.trim() ? (
        <div className="space-y-4 text-base leading-relaxed text-texto">
          {pagina.corpo
            .split(/\n{2,}/)
            .filter(Boolean)
            .map((p, i) => (
              <p key={i}>{p}</p>
            ))}
        </div>
      ) : (
        <div className="grid gap-6">
          <Cartao className="border-azul-200 bg-gradient-to-br from-white to-azul-50">
            <CartaoCorpo className="sm:p-8">
              <Compass className="h-7 w-7 text-azul-600" />
              <h2 className="mt-3 text-xl font-semibold text-texto">Missão</h2>
              <p className="mt-2 leading-relaxed text-texto-suave">{PADRAO.missao}</p>
            </CartaoCorpo>
          </Cartao>

          <Cartao>
            <CartaoCorpo className="sm:p-8">
              <Eye className="h-7 w-7 text-azul-600" />
              <h2 className="mt-3 text-xl font-semibold text-texto">Visão</h2>
              <p className="mt-2 leading-relaxed text-texto-suave">{PADRAO.visao}</p>
            </CartaoCorpo>
          </Cartao>

          <Cartao>
            <CartaoCorpo className="sm:p-8">
              <Gem className="h-7 w-7 text-azul-600" />
              <h2 className="mt-3 text-xl font-semibold text-texto">Valores</h2>
              <ul className="mt-3 space-y-2">
                {PADRAO.valores.map((v) => (
                  <li key={v} className="flex items-start gap-2 text-texto-suave">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-azul-400" />
                    {v}
                  </li>
                ))}
              </ul>
            </CartaoCorpo>
          </Cartao>
        </div>
      )}
    </div>
  );
}
