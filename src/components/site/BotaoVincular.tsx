"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Link2, Loader2 } from "lucide-react";
import { Botao } from "@/components/ui";
import { tentarVincularCadastro } from "@/lib/estudo/acoes-aluno";
import { cn } from "@/lib/utils";

/**
 * Liga a conta logada ao cadastro de aluno de mesmo e-mail. Quem decide se
 * existe correspondência é a função no banco — aqui só se mostra o
 * resultado.
 */
export function BotaoVincular({ className }: { className?: string }) {
  const router = useRouter();
  const [pendente, iniciarTransicao] = useTransition();
  const [semCadastro, setSemCadastro] = useState(false);

  function aoClicar() {
    setSemCadastro(false);
    iniciarTransicao(async () => {
      const id = await tentarVincularCadastro();
      if (id) {
        router.refresh();
        return;
      }
      setSemCadastro(true);
    });
  }

  return (
    <div className={cn(className)}>
      <Botao type="button" onClick={aoClicar} disabled={pendente}>
        {pendente ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
        {pendente ? "Procurando..." : "Ligar minha conta à matrícula"}
      </Botao>

      {semCadastro ? (
        <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Não encontrei nenhuma ficha de aluno com este e-mail esperando vínculo. Pode ser que a
          secretaria ainda não tenha cadastrado, ou que tenha usado outro endereço.
        </p>
      ) : null}
    </div>
  );
}
