"use client";

import { useFormStatus } from "react-dom";
import { Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

function Botao({
  rotulo,
  comTexto,
}: {
  rotulo: string;
  comTexto?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={rotulo}
      title={rotulo}
      className={cn(
        "inline-flex items-center gap-2 rounded-full text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50",
        comTexto ? "px-4 py-2 text-sm font-medium text-rose-700" : "h-9 w-9 justify-center",
      )}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      {comTexto}
    </button>
  );
}

/**
 * Exclusao com confirmacao. A acao so e enviada depois do "ok" do usuario —
 * sem isso, um clique errado ao lado do botao de editar apaga o registro.
 */
export function BotaoExcluir({
  acao,
  id,
  mensagem,
  rotulo = "Excluir",
  comTexto,
  campos,
}: {
  acao: (dados: FormData) => Promise<void>;
  id: string;
  mensagem: string;
  rotulo?: string;
  comTexto?: string;
  campos?: Record<string, string>;
}) {
  return (
    <form
      action={acao}
      onSubmit={(e) => {
        if (!window.confirm(mensagem)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      {Object.entries(campos ?? {}).map(([nome, valor]) => (
        <input key={nome} type="hidden" name={nome} value={valor} />
      ))}
      <Botao rotulo={rotulo} comTexto={comTexto} />
    </form>
  );
}
