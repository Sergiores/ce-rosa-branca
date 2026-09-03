"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Botao } from "@/components/ui";
import type { Resultado } from "@/lib/gestao/acoes-conteudo";

type Acao = (estado: Resultado, dados: FormData) => Promise<Resultado>;

function BotaoAcao({
  valor,
  rotulo,
  variante,
}: {
  valor: string;
  rotulo: string;
  variante?: "primario" | "contorno";
}) {
  const { pending } = useFormStatus();
  return (
    <Botao type="submit" name="acao" value={valor} variante={variante} disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {rotulo}
    </Botao>
  );
}

/**
 * Formulário com o par rascunho/publicar.
 * O botão acionado envia `acao=rascunho` ou `acao=publicar` para a server action.
 */
export function FormularioConteudo({
  acao,
  children,
  rotuloPublicar = "Publicar",
  mostrarRascunho = true,
}: {
  acao: Acao;
  children: React.ReactNode;
  rotuloPublicar?: string;
  mostrarRascunho?: boolean;
}) {
  const [estado, executar] = useActionState<Resultado, FormData>(acao, {});

  return (
    <form action={executar} className="space-y-5">
      {children}

      {estado?.erro ? (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{estado.erro}</p>
      ) : null}

      <div className="flex flex-wrap gap-3 border-t border-borda pt-5">
        <BotaoAcao valor="publicar" rotulo={rotuloPublicar} />
        {mostrarRascunho ? (
          <BotaoAcao valor="rascunho" rotulo="Salvar como rascunho" variante="contorno" />
        ) : null}
      </div>
    </form>
  );
}
