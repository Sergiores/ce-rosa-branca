import Link from "next/link";
import type { Metadata } from "next";
import { HeartHandshake, BookOpen, Users } from "lucide-react";
import { Cartao, CartaoCorpo, TituloSecao } from "@/components/ui";
import { obterPagina } from "@/lib/conteudo";
import { registrarAcesso, registrarVisualizacao } from "@/lib/metricas";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "A Casa" };

const TEXTO_PADRAO = `A Casa Espírita Rosa Branca é um centro de estudo, oração e trabalho voluntário, dedicado à difusão da doutrina espírita codificada por Allan Kardec.

Nossas portas estão abertas a todos os que buscam consolo, esclarecimento e um lugar para servir.`;

export default async function PaginaSobre() {
  await Promise.all([registrarAcesso("/sobre"), registrarVisualizacao("pagina", "sobre")]);
  const pagina = await obterPagina("sobre");

  const corpo = pagina?.corpo?.trim() ? pagina.corpo : TEXTO_PADRAO;

  return (
    <div className="container-site max-w-4xl py-14">
      <TituloSecao
        titulo={pagina?.titulo ?? "A Casa Espírita Rosa Branca"}
        descricao="Quem somos e o que fazemos."
      />

      <div className="space-y-4 text-base leading-relaxed text-texto">
        {corpo
          .split(/\n{2,}/)
          .filter(Boolean)
          .map((p, i) => (
            <p key={i}>{p}</p>
          ))}
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        <Cartao>
          <CartaoCorpo>
            <BookOpen className="h-7 w-7 text-marca-600" />
            <h3 className="mt-3 font-semibold text-texto">Estudo</h3>
            <p className="mt-1 text-sm text-texto-suave">
              Grupos de estudo sistematizado da doutrina espírita.
            </p>
          </CartaoCorpo>
        </Cartao>
        <Cartao>
          <CartaoCorpo>
            <HeartHandshake className="h-7 w-7 text-marca-600" />
            <h3 className="mt-3 font-semibold text-texto">Assistência</h3>
            <p className="mt-1 text-sm text-texto-suave">
              Atendimento fraterno, passes e amparo às famílias.
            </p>
          </CartaoCorpo>
        </Cartao>
        <Cartao>
          <CartaoCorpo>
            <Users className="h-7 w-7 text-marca-600" />
            <h3 className="mt-3 font-semibold text-texto">Voluntariado</h3>
            <p className="mt-1 text-sm text-texto-suave">
              Frentes de trabalho abertas a quem deseja servir.
            </p>
          </CartaoCorpo>
        </Cartao>
      </div>

      <div className="mt-12">
        <Link
          href="/sobre/missao"
          className="inline-flex rounded-full bg-marca-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-marca-700"
        >
          Missão, visão e valores
        </Link>
      </div>
    </div>
  );
}
