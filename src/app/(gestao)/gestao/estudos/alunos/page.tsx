import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import { Campo, Cartao, CartaoCorpo, Etiqueta, Rotulo, AreaTexto, Vazio } from "@/components/ui";
import { CabecalhoLista, FiltrosLista } from "@/components/gestao/Lista";
import { FormularioSimples } from "@/components/gestao/Formulario";
import { exigirTela } from "@/lib/auth/permissoes";
import { listarAlunos } from "@/lib/gestao/estudos";
import { salvarAluno } from "@/lib/gestao/acoes-estudos";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Alunos" };

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
        />
      </div>

      {podeEditar ? (
        <Cartao className="mt-8">
          <CartaoCorpo className="sm:p-8">
            <h2 className="mb-5 font-semibold text-texto">Cadastrar aluno</h2>
            <FormularioSimples acao={salvarAluno} rotulo="Cadastrar" aoSalvar="Aluno cadastrado.">
              <input type="hidden" name="ativo" value="1" />
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Rotulo htmlFor="nome">Nome</Rotulo>
                  <Campo id="nome" name="nome" required />
                </div>
                <div>
                  <Rotulo htmlFor="email">E-mail</Rotulo>
                  <Campo id="email" name="email" type="email" />
                </div>
                <div>
                  <Rotulo htmlFor="telefone">Telefone</Rotulo>
                  <Campo id="telefone" name="telefone" />
                </div>
                <div className="sm:col-span-2">
                  <Rotulo htmlFor="observacoes">Observações</Rotulo>
                  <AreaTexto id="observacoes" name="observacoes" rows={2} />
                </div>
              </div>
            </FormularioSimples>
          </CartaoCorpo>
        </Cartao>
      ) : null}

      <div className="mt-8">
        <FiltrosLista
          base="/gestao/estudos/alunos"
          busca={busca}
          placeholder="Buscar por nome, e-mail ou telefone"
        />
      </div>

      {alunos.length === 0 ? (
        <div className="mt-8">
          <Vazio
            mensagem={busca ? "Nenhum aluno encontrado." : "Nenhum aluno cadastrado ainda."}
          />
        </div>
      ) : (
        <Cartao className="mt-8 divide-y divide-borda overflow-hidden">
          {alunos.map((a) => (
            <Link
              key={a.id}
              href={`/gestao/estudos/alunos/${a.id}`}
              className="flex flex-wrap items-center gap-4 px-5 py-4 transition-colors hover:bg-marca-50"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-texto">{a.nome}</p>
                <div className="mt-0.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-texto-suave">
                  {a.email ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" /> {a.email}
                    </span>
                  ) : null}
                  {a.telefone ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" /> {a.telefone}
                    </span>
                  ) : null}
                </div>
              </div>
              {!a.ativo ? <Etiqueta tom="cinza">Inativo</Etiqueta> : null}
            </Link>
          ))}
        </Cartao>
      )}
    </div>
  );
}
