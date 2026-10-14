"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { alterarPapel, alternarAtivo } from "@/lib/gestao/acoes-usuarios";
import type { Resultado } from "@/lib/gestao/acoes-conteudo";

const PAPEIS = [
  { valor: "diretoria", rotulo: "Diretoria" },
  { valor: "voluntario", rotulo: "Voluntário" },
  { valor: "aluno", rotulo: "Aluno" },
  { valor: "membro", rotulo: "Membro" },
];

function Enviar({ rotulo, discreto }: { rotulo: string; discreto?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={
        discreto
          ? "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-texto-suave hover:bg-marca-50 disabled:opacity-50"
          : "ml-2 inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-marca-700 hover:bg-marca-50 disabled:opacity-50"
      }
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
      {rotulo}
    </button>
  );
}

/**
 * Trocar papel e ativar/desativar, com o resultado visível. Antes os dois
 * eram formulários sem retorno: se o banco recusasse, a linha só voltava ao
 * estado anterior, sem explicação.
 */
export function AcoesUsuario({
  id,
  papel,
  ativo,
}: {
  id: string;
  papel: string;
  ativo: boolean;
}) {
  const [estadoPapel, trocarPapel] = useActionState<Resultado, FormData>(alterarPapel, {});
  const [estadoAtivo, trocarAtivo] = useActionState<Resultado, FormData>(alternarAtivo, {});
  const erro = estadoPapel?.erro ?? estadoAtivo?.erro;

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        <form action={trocarPapel} className="flex items-center">
          <input type="hidden" name="id" value={id} />
          <select
            name="role"
            defaultValue={papel}
            className="rounded-xl border border-borda bg-white px-3 py-2 text-sm"
          >
            {/* "Visitante" nunca é destino — é papel de origem, do cadastro
                público. Aparece só quando já é o atual, para o select não
                cair sozinho na primeira opção e promover alguém por engano. */}
            {papel === "visitante" ? (
              <option value="visitante">Visitante (cadastro público)</option>
            ) : null}
            {PAPEIS.map((p) => (
              <option key={p.valor} value={p.valor}>
                {p.rotulo}
              </option>
            ))}
          </select>
          <Enviar rotulo="Salvar" />
        </form>

        <form action={trocarAtivo}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="ativo" value={ativo ? "0" : "1"} />
          <Enviar rotulo={ativo ? "Desativar" : "Ativar"} discreto />
        </form>
      </div>

      {erro ? (
        <p className="max-w-xs text-right text-xs text-rose-700">{erro}</p>
      ) : estadoPapel?.ok ? (
        <p className="text-xs text-emerald-700">Perfil alterado.</p>
      ) : null}
    </div>
  );
}
