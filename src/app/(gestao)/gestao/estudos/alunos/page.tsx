import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Mail, Phone, Plus } from "lucide-react";
import { Campo, Cartao, CartaoCorpo, Etiqueta, Rotulo, AreaTexto, Vazio } from "@/components/ui";
import { CabecalhoLista, FiltrosLista } from "@/components/gestao/Lista";
import { FormularioSimples } from "@/components/gestao/Formulario";
import { SeletorPessoa } from "@/components/gestao/SeletorPessoa";
import { exigirTela } from "@/lib/auth/permissoes";
import { listarAlunos, pessoasVinculaveis } from "@/lib/gestao/estudos";
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

  const [alunos, pessoas] = await Promise.all([
    listarAlunos(busca),
    podeEditar ? pessoasVinculaveis("aluno") : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/gestao/estudos"
        className="inline-flex items-center gap-1 text-sm font-medium text-marca-700 hover:text-marca-800"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar às turmas
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <CabecalhoLista
          titulo="Alunos"
          descricao="O cadastro é da pessoa, não da turma — é o que permite acompanhar o histórico de quem estuda aqui há anos."
        />
        {podeEditar ? (
          /* Âncora em vez de tela separada: a pessoa desce até o formulário,
             que fica depois da lista para ninguém cadastrar quem já existe. */
          <a
            href="#cadastrar"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-marca-600 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-marca-600/20 hover:bg-marca-700"
          >
            <Plus className="h-4 w-4" /> Cadastrar aluno
          </a>
        ) : null}
      </div>

      {/* Busca primeiro: procurar antes de cadastrar é o que evita duplicata. */}
      <div className="mt-8">
        <FiltrosLista
          base="/gestao/estudos/alunos"
          busca={busca}
          placeholder="Buscar por nome, e-mail ou telefone"
        />
      </div>

      {busca ? (
        <p className="mt-6 text-sm text-texto-suave">
          {alunos.length === 0
            ? `Nenhum aluno encontrado para “${busca}”.`
            : `${alunos.length} ${alunos.length === 1 ? "aluno encontrado" : "alunos encontrados"} para “${busca}”.`}
        </p>
      ) : null}

      {alunos.length === 0 ? (
        <div className="mt-6">
          <Vazio
            mensagem={
              busca
                ? "Tente outro nome, e-mail ou telefone — ou cadastre abaixo."
                : "Nenhum aluno cadastrado ainda. Cadastre o primeiro abaixo."
            }
          />
        </div>
      ) : (
        <Cartao className="mt-6 divide-y divide-borda overflow-hidden">
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
              {a.profile_id ? <Etiqueta tom="verde">Conta vinculada</Etiqueta> : null}
              {!a.ativo ? <Etiqueta tom="cinza">Inativo</Etiqueta> : null}
            </Link>
          ))}
        </Cartao>
      )}

      {/* Cadastro por último, de propósito. */}
      {podeEditar ? (
        <Cartao className="mt-10 scroll-mt-24" id="cadastrar">
          <CartaoCorpo className="sm:p-8">
            <h2 className="mb-1 font-semibold text-texto">Cadastrar aluno</h2>
            <p className="mb-5 text-sm text-texto-suave">
              Antes de cadastrar, confira na lista acima se a pessoa já não está aqui.
            </p>

            <FormularioSimples acao={salvarAluno} rotulo="Cadastrar" aoSalvar="Aluno cadastrado.">
              <input type="hidden" name="ativo" value="1" />

              <SeletorPessoa pessoas={pessoas} />

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
    </div>
  );
}
