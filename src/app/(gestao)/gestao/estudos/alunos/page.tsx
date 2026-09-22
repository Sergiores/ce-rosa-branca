import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Mail, Pencil, Phone } from "lucide-react";
import { Cartao, Etiqueta, Vazio } from "@/components/ui";
import { CabecalhoLista, FiltrosLista } from "@/components/gestao/Lista";
import { exigirTela } from "@/lib/auth/permissoes";
import { listarAlunos } from "@/lib/gestao/estudos";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Alunos" };

const BASE = "/gestao/estudos/alunos";

export default async function PaginaAlunos({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sessao = await exigirTela("estudos");
  const podeEditar = sessao.podeEditar("estudos");
  const { q } = await searchParams;
  const busca = q?.trim() ?? "";

  const alunos = await listarAlunos(busca);

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/gestao/estudos"
        className="inline-flex items-center gap-1 text-sm font-medium text-marca-700 hover:text-marca-800"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar às turmas
      </Link>

      <div className="mt-4">
        <CabecalhoLista
          titulo="Alunos"
          descricao="O cadastro é da pessoa, não da turma — é o que permite acompanhar o histórico de quem estuda aqui há anos."
          novoHref={`${BASE}/novo`}
          novoRotulo="Cadastrar aluno"
          podeEditar={podeEditar}
        />
      </div>

      <FiltrosLista base={BASE} busca={busca} placeholder="Nome, e-mail ou telefone do aluno" />

      {busca ? (
        <p className="mt-6 text-sm text-texto-suave">
          {alunos.length === 0
            ? `Nenhum aluno encontrado para “${busca}”.`
            : `${alunos.length} ${alunos.length === 1 ? "aluno encontrado" : "alunos encontrados"}.`}
        </p>
      ) : null}

      <div className="mt-6">
        {alunos.length === 0 ? (
          <Vazio
            mensagem={
              busca ? "Tente outro nome, e-mail ou telefone." : "Nenhum aluno cadastrado ainda."
            }
          />
        ) : (
          <Cartao className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-sm">
              <thead>
                <tr className="border-b border-borda bg-marca-50/60 text-left">
                  <th className="px-5 py-3 font-semibold text-texto">Aluno</th>
                  <th className="w-44 px-4 py-3 font-semibold text-texto">Situação</th>
                  {podeEditar ? <th className="w-20 px-4 py-3" /> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                {alunos.map((a) => (
                  <tr key={a.id} className="align-top hover:bg-marca-50/40">
                    <td className="px-5 py-3">
                      <Link
                        href={`${BASE}/${a.id}`}
                        className="font-medium text-texto hover:text-marca-700"
                      >
                        {a.nome}
                      </Link>
                      <div className="mt-0.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-texto-suave">
                        {a.email ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Mail className="h-3 w-3" /> {a.email}
                          </span>
                        ) : null}
                        {a.telefone ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Phone className="h-3 w-3" /> {a.telefone}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {a.profile_id ? <Etiqueta tom="verde">Conta vinculada</Etiqueta> : null}
                        {!a.ativo ? <Etiqueta tom="cinza">Inativo</Etiqueta> : null}
                      </div>
                    </td>
                    {podeEditar ? (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end">
                          <Link
                            href={`${BASE}/${a.id}/editar`}
                            aria-label="Editar"
                            title="Editar"
                            className="grid h-9 w-9 place-items-center rounded-full text-marca-700 hover:bg-marca-100"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </Cartao>
        )}
      </div>
    </div>
  );
}
