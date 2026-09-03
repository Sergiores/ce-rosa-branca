"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Send } from "lucide-react";
import { Botao, Campo, Rotulo, Selecao } from "@/components/ui";
import { convidarUsuario } from "@/lib/gestao/acoes-usuarios";
import type { Resultado } from "@/lib/gestao/acoes-conteudo";

function BotaoEnviar() {
  const { pending } = useFormStatus();
  return (
    <Botao type="submit" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
      {pending ? "Enviando convite..." : "Enviar convite"}
    </Botao>
  );
}

export function FormularioConvite() {
  const [estado, executar] = useActionState<Resultado, FormData>(convidarUsuario, {});

  return (
    <form action={executar} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Rotulo htmlFor="nome">Nome</Rotulo>
          <Campo id="nome" name="nome" required />
        </div>
        <div>
          <Rotulo htmlFor="email">E-mail</Rotulo>
          <Campo id="email" name="email" type="email" required />
        </div>
      </div>

      <div className="sm:max-w-xs">
        <Rotulo htmlFor="role">Perfil de acesso</Rotulo>
        <Selecao id="role" name="role" defaultValue="membro">
          <option value="diretoria">Diretoria</option>
          <option value="voluntario">Voluntário</option>
          <option value="aluno">Aluno</option>
          <option value="membro">Membro</option>
        </Selecao>
      </div>

      {estado?.erro ? (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{estado.erro}</p>
      ) : null}
      {estado?.ok ? (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Convite enviado. O usuário define a senha pelo link recebido por e-mail.
        </p>
      ) : null}

      <BotaoEnviar />
    </form>
  );
}
