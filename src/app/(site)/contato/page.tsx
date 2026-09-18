import type { Metadata } from "next";
import { Mail, MapPin, Phone, Clock } from "lucide-react";
import { Cartao, CartaoCorpo, TituloSecao } from "@/components/ui";
import { obterPagina } from "@/lib/conteudo";
import { registrarAcesso, registrarVisualizacao } from "@/lib/metricas";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Contato" };

export default async function PaginaContato() {
  await Promise.all([registrarAcesso("/contato"), registrarVisualizacao("pagina", "contato")]);
  const pagina = await obterPagina("contato");

  return (
    <div className="container-site max-w-4xl py-14">
      <TituloSecao
        titulo="Fale com a casa"
        descricao="Estamos à disposição para acolher, orientar e receber sua visita."
      />

      {pagina?.corpo?.trim() ? (
        <div className="mb-10 space-y-4 text-base leading-relaxed text-texto">
          {pagina.corpo
            .split(/\n{2,}/)
            .filter(Boolean)
            .map((p, i) => (
              <p key={i}>{p}</p>
            ))}
        </div>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <Cartao>
          <CartaoCorpo>
            <MapPin className="h-6 w-6 text-marca-600" />
            <h3 className="mt-3 font-semibold text-texto">Endereço</h3>
            <p className="mt-1 text-sm text-texto-suave">A definir — atualize esta página na gestão.</p>
          </CartaoCorpo>
        </Cartao>
        <Cartao>
          <CartaoCorpo>
            <Clock className="h-6 w-6 text-marca-600" />
            <h3 className="mt-3 font-semibold text-texto">Horários</h3>
            <p className="mt-1 text-sm text-texto-suave">
              Consulte a página de eventos para a programação da semana.
            </p>
          </CartaoCorpo>
        </Cartao>
        <Cartao>
          <CartaoCorpo>
            <Phone className="h-6 w-6 text-marca-600" />
            <h3 className="mt-3 font-semibold text-texto">Telefone</h3>
            <p className="mt-1 text-sm text-texto-suave">A definir.</p>
          </CartaoCorpo>
        </Cartao>
        <Cartao>
          <CartaoCorpo>
            <Mail className="h-6 w-6 text-marca-600" />
            <h3 className="mt-3 font-semibold text-texto">E-mail</h3>
            <p className="mt-1 text-sm text-texto-suave">A definir.</p>
          </CartaoCorpo>
        </Cartao>
      </div>
    </div>
  );
}
