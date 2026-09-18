"use client";

import { useFormStatus } from "react-dom";
import { Ban, Loader2, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";

const ICONES = { cancelar: Ban, estornar: Undo2 };

function Botao({
  rotulo,
  icone,
  discreto,
}: {
  rotulo: string;
  icone: keyof typeof ICONES;
  discreto?: boolean;
}) {
  const { pending } = useFormStatus();
  const Icone = ICONES[icone];

  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium transition-colors disabled:opacity-50",
        discreto
          ? "px-3 py-1.5 text-xs text-texto-suave hover:bg-marca-50 hover:text-marca-700"
          : "px-4 py-2 text-sm text-rose-700 hover:bg-rose-50",
      )}
    >
      {pending ? (
        <Loader2 className={discreto ? "h-3.5 w-3.5 animate-spin" : "h-4 w-4 animate-spin"} />
      ) : (
        <Icone className={discreto ? "h-3.5 w-3.5" : "h-4 w-4"} />
      )}
      {rotulo}
    </button>
  );
}

/**
 * Ação de efeito difícil de desfazer (cancelar título, estornar baixa),
 * confirmada antes de chegar ao servidor.
 */
export function BotaoConfirmar({
  acao,
  id,
  mensagem,
  rotulo,
  icone,
  discreto,
  nomeCampoId = "id",
  campos,
}: {
  acao: (dados: FormData) => Promise<void>;
  id: string;
  mensagem: string;
  rotulo: string;
  icone: keyof typeof ICONES;
  discreto?: boolean;
  nomeCampoId?: string;
  campos?: Record<string, string>;
}) {
  return (
    <form
      action={acao}
      onSubmit={(e) => {
        if (!window.confirm(mensagem)) e.preventDefault();
      }}
    >
      <input type="hidden" name={nomeCampoId} value={id} />
      {Object.entries(campos ?? {}).map(([nome, valor]) => (
        <input key={nome} type="hidden" name={nome} value={valor} />
      ))}
      <Botao rotulo={rotulo} icone={icone} discreto={discreto} />
    </form>
  );
}
