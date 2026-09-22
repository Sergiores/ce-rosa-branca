import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Cartao, CartaoCorpo } from "@/components/ui";

/**
 * Moldura das telas de manutenção: voltar, título e o formulário num cartão.
 * Consulta e manutenção vivem em telas separadas — esta é sempre a segunda.
 */
export function PaginaManutencao({
  voltarHref,
  voltarRotulo,
  titulo,
  descricao,
  children,
  acoes,
}: {
  voltarHref: string;
  voltarRotulo: string;
  titulo: string;
  descricao?: string;
  children: React.ReactNode;
  acoes?: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={voltarHref}
        className="inline-flex items-center gap-1 text-sm font-medium text-marca-700 hover:text-marca-800"
      >
        <ArrowLeft className="h-4 w-4" /> {voltarRotulo}
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-texto">{titulo}</h1>
          {descricao ? <p className="mt-1 text-texto-suave">{descricao}</p> : null}
        </div>
        {acoes}
      </div>

      <Cartao className="mt-6">
        <CartaoCorpo className="sm:p-8">{children}</CartaoCorpo>
      </Cartao>
    </div>
  );
}
