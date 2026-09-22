"use client";

import { useState } from "react";
import { UserCheck, X } from "lucide-react";
import { Rotulo, Selecao } from "@/components/ui";

export type PessoaVinculavel = {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  papel: string;
};

const ROTULO_PAPEL: Record<string, string> = {
  diretoria: "Diretoria",
  voluntario: "Voluntário",
  aluno: "Aluno",
  membro: "Membro",
  visitante: "Visitante",
};

/**
 * Traz os dados de uma conta já existente para o formulário, em vez de
 * exigir que se redigite nome, e-mail e telefone.
 *
 * Preenche os campos pelo `form.elements`, e não por estado: assim as telas
 * de aluno e de membro continuam sendo server components com inputs
 * comuns, e só este pedaço é cliente.
 *
 * Vincular é opcional de propósito. Muita gente que estuda ou é membro da
 * casa não tem e-mail nem login — exigir conta transformaria o cadastro
 * dessas pessoas em convite por e-mail que elas nunca vão abrir.
 */
export function SeletorPessoa({
  pessoas,
  rotulo = "Trazer de um usuário já cadastrado",
}: {
  pessoas: PessoaVinculavel[];
  rotulo?: string;
}) {
  const [escolhida, setEscolhida] = useState<PessoaVinculavel | null>(null);

  function preencher(form: HTMLFormElement, pessoa: PessoaVinculavel | null) {
    const escrever = (nome: string, valor: string) => {
      const campo = form.elements.namedItem(nome);
      if (campo instanceof HTMLInputElement) campo.value = valor;
    };
    escrever("nome", pessoa?.nome ?? "");
    escrever("email", pessoa?.email ?? "");
    escrever("telefone", pessoa?.telefone ?? "");
  }

  function aoEscolher(e: React.ChangeEvent<HTMLSelectElement>) {
    const pessoa = pessoas.find((p) => p.id === e.target.value) ?? null;
    setEscolhida(pessoa);
    if (e.target.form) preencher(e.target.form, pessoa);
  }

  function limpar(botao: HTMLButtonElement) {
    setEscolhida(null);
    if (botao.form) preencher(botao.form, null);
  }

  if (pessoas.length === 0) {
    return (
      <input type="hidden" name="profile_id" value="" />
    );
  }

  return (
    <div className="rounded-2xl border border-marca-200 bg-marca-50/60 p-4 sm:p-5">
      <input type="hidden" name="profile_id" value={escolhida?.id ?? ""} />

      <Rotulo htmlFor="seletor-pessoa">{rotulo}</Rotulo>
      <p className="mb-2 text-sm text-texto-suave">
        Escolha alguém que já tem conta no site e os dados vêm preenchidos. Quem não tem conta,
        cadastre direto nos campos abaixo.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <Selecao
            id="seletor-pessoa"
            value={escolhida?.id ?? ""}
            onChange={aoEscolher}
            aria-label={rotulo}
          >
            <option value="">— cadastrar sem vincular a uma conta —</option>
            {pessoas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome || p.email || "(sem nome)"}
                {p.papel ? ` · ${ROTULO_PAPEL[p.papel] ?? p.papel}` : ""}
              </option>
            ))}
          </Selecao>
        </div>

        {escolhida ? (
          <button
            type="button"
            onClick={(e) => limpar(e.currentTarget)}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-texto-suave hover:bg-white"
          >
            <X className="h-4 w-4" /> Desvincular
          </button>
        ) : null}
      </div>

      {escolhida ? (
        <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-marca-700">
          <UserCheck className="h-4 w-4" />
          Vai ficar ligado à conta de {escolhida.nome || escolhida.email}
        </p>
      ) : null}
    </div>
  );
}
