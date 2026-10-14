"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { KeyRound, Loader2 } from "lucide-react";
import { Botao, Campo, Rotulo } from "@/components/ui";
import { redefinirSenha } from "@/lib/gestao/acoes-usuarios";
import type { Resultado } from "@/lib/gestao/acoes-conteudo";

function Enviar() {
  const { pending } = useFormStatus();
  return (
    <Botao type="submit" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
      {pending ? "Alterando..." : "Alterar senha"}
    </Botao>
  );
}

export function FormularioSenhaUsuario({ id }: { id: string }) {
  const [estado, executar] = useActionState<Resultado, FormData>(redefinirSenha, {});

  return (
    <form
      action={executar}
      className="space-y-5"
      onSubmit={(e) => {
        if (!window.confirm("Alterar a senha desta pessoa? Ela vai precisar da senha nova para entrar.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Rotulo htmlFor="senha">Nova senha</Rotulo>
          <Campo
            id="senha"
            name="senha"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>
        <div>
          <Rotulo htmlFor="confirmacao">Repita a senha</Rotulo>
          <Campo
            id="confirmacao"
            name="confirmacao"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>
      </div>

      {estado?.erro ? (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{estado.erro}</p>
      ) : null}

      <div className="border-t border-borda pt-5">
        <Enviar />
      </div>
    </form>
  );
}
