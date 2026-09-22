"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, Loader2, X } from "lucide-react";
import { Botao, Campo, Cartao } from "@/components/ui";
import { cn } from "@/lib/utils";

export type AlunoChamada = {
  id: string;
  nome: string;
  presente: boolean;
  justificativa: string;
};

function BotaoSalvar() {
  const { pending } = useFormStatus();
  return (
    <Botao type="submit" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {pending ? "Gravando..." : "Gravar chamada"}
    </Botao>
  );
}

/**
 * Lista de chamada. Todo aluno matriculado vira uma linha no formulário,
 * presente ou não — ausência registrada vale mais que ausência de registro
 * na hora de conferir o histórico. Por isso o campo de cada aluno vai junto
 * mesmo quando desmarcado, e `alunos` carrega a lista de ids esperados.
 */
export function Chamada({
  acao,
  aulaId,
  turmaId,
  alunos,
  podeEditar,
}: {
  acao: (dados: FormData) => Promise<void>;
  aulaId: string;
  turmaId: string;
  alunos: AlunoChamada[];
  podeEditar: boolean;
}) {
  const [estado, setEstado] = useState(alunos);

  function alternar(id: string, presente: boolean) {
    setEstado((atual) => atual.map((a) => (a.id === id ? { ...a, presente } : a)));
  }

  function todos(presente: boolean) {
    setEstado((atual) => atual.map((a) => ({ ...a, presente })));
  }

  const presentes = estado.filter((a) => a.presente).length;

  return (
    <form action={acao} className="mt-5">
      <input type="hidden" name="aula_id" value={aulaId} />
      <input type="hidden" name="turma_id" value={turmaId} />
      <input type="hidden" name="alunos" value={estado.map((a) => a.id).join(",")} />

      <Cartao className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-borda bg-marca-50/60 px-5 py-3">
          <p className="text-sm font-medium text-texto">
            {presentes} de {estado.length} presentes
          </p>
          {podeEditar ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => todos(true)}
                className="rounded-full px-3 py-1.5 text-xs font-medium text-marca-700 hover:bg-white"
              >
                Marcar todos
              </button>
              <button
                type="button"
                onClick={() => todos(false)}
                className="rounded-full px-3 py-1.5 text-xs font-medium text-texto-suave hover:bg-white"
              >
                Desmarcar todos
              </button>
            </div>
          ) : null}
        </div>

        <div className="divide-y divide-borda">
          {estado.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                {/* O checkbox real fica escondido: o visual é o botão ao lado,
                    grande o bastante para marcar presença no celular. */}
                <input
                  type="checkbox"
                  name={`presente:${a.id}`}
                  checked={a.presente}
                  onChange={(e) => alternar(a.id, e.target.checked)}
                  disabled={!podeEditar}
                  className="sr-only"
                />
                <span
                  aria-hidden
                  className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-colors",
                    a.presente
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-borda bg-white text-texto-suave",
                  )}
                >
                  {a.presente ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                </span>
                <span
                  className={cn(
                    "truncate font-medium",
                    a.presente ? "text-texto" : "text-texto-suave",
                  )}
                >
                  {a.nome}
                </span>
              </label>

              {!a.presente ? (
                <Campo
                  name={`justificativa:${a.id}`}
                  defaultValue={a.justificativa}
                  placeholder="Justificativa (opcional)"
                  disabled={!podeEditar}
                  className="h-9 w-full text-sm sm:w-60"
                />
              ) : null}
            </div>
          ))}
        </div>
      </Cartao>

      {podeEditar ? (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <BotaoSalvar />
          <p className="text-sm text-texto-suave">Gravar a chamada marca a aula como realizada.</p>
        </div>
      ) : null}
    </form>
  );
}
