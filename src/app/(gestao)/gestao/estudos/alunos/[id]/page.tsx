import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, GraduationCap } from "lucide-react";
import {
  AreaTexto,
  Campo,
  Cartao,
  CartaoCorpo,
  Etiqueta,
  Rotulo,
  Selecao,
  Vazio,
} from "@/components/ui";
import { FormularioSimples } from "@/components/gestao/Formulario";
import { formatarData } from "@/lib/datas";
import { exigirTela } from "@/lib/auth/permissoes";
import { historicoDoAluno, obterAluno } from "@/lib/gestao/estudos";
import { salvarAluno } from "@/lib/gestao/acoes-estudos";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Aluno" };

const ROTULO_MATRICULA = {
  matriculado: "Cursando",
  concluido: "Concluiu",
  desistente: "Desistiu",
} as const;
const TOM_MATRICULA = { matriculado: "marca", concluido: "verde", desistente: "cinza" } as const;

export default async function PaginaAluno({ params }: { params: Promise<{ id: string }> }) {
  const sessao = await exigirTela("estudos");
  const { id } = await params;
  const podeEditar = sessao.podeEditar("estudos");

  const aluno = await obterAluno(id);
  if (!aluno) notFound();

  const historico = await historicoDoAluno(id);
  const concluidos = historico.filter((h) => h.matricula_status === "concluido").length;

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/gestao/estudos/alunos"
        className="inline-flex items-center gap-1 text-sm font-medium text-marca-700 hover:text-marca-800"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar aos alunos
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-texto">{aluno.nome}</h1>
        {aluno.profile_id ? (
          <Etiqueta tom="verde">Conta vinculada</Etiqueta>
        ) : (
          <Etiqueta tom="cinza">Sem conta vinculada</Etiqueta>
        )}
      </div>
      {historico.length > 0 ? (
        <p className="mt-1 text-texto-suave">
          {historico.length} {historico.length === 1 ? "turma" : "turmas"}
          {concluidos > 0
            ? ` · ${concluidos} ${concluidos === 1 ? "concluída" : "concluídas"}`
            : ""}
        </p>
      ) : null}

      {/* Histórico — a frequência vem da view, nunca de coluna armazenada */}
      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-texto">
          <GraduationCap className="h-5 w-5 text-marca-600" />
          Histórico de estudos
        </h2>

        {historico.length === 0 ? (
          <div className="mt-5">
            <Vazio mensagem="Este aluno ainda não foi matriculado em nenhuma turma." />
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {historico.map((h) => (
              <Cartao key={h.matricula_id}>
                <CartaoCorpo>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/gestao/estudos/${h.turma_id}`}
                        className="font-semibold text-texto hover:text-marca-700"
                      >
                        {h.turma_nome}
                      </Link>
                      <p className="mt-0.5 text-sm text-texto-suave">
                        {h.turma_nivel} · matriculado em {formatarData(h.matriculado_em)}
                        {h.concluido_em ? ` · concluiu em ${formatarData(h.concluido_em)}` : ""}
                      </p>
                    </div>
                    <Etiqueta tom={TOM_MATRICULA[h.matricula_status]}>
                      {ROTULO_MATRICULA[h.matricula_status]}
                    </Etiqueta>
                  </div>

                  {h.aulas_realizadas > 0 ? (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-texto-suave">
                          Presença em {h.presencas} de {h.aulas_realizadas}{" "}
                          {h.aulas_realizadas === 1 ? "aula dada" : "aulas dadas"}
                        </span>
                        <span className="font-semibold text-texto">{h.frequencia_pct}%</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-marca-100">
                        <div
                          className="h-full rounded-full bg-marca-600"
                          style={{ width: `${h.frequencia_pct ?? 0}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-texto-suave">
                      Nenhuma aula realizada nesta turma ainda.
                    </p>
                  )}
                </CartaoCorpo>
              </Cartao>
            ))}
          </div>
        )}
      </section>

      {/* Cadastro */}
      <section className="mt-10">
        <h2 className="mb-2 text-lg font-semibold text-texto">Dados do aluno</h2>
        <p className="mb-5 text-sm text-texto-suave">
          {aluno.profile_id
            ? "Este aluno já entra na área do aluno com a conta dele."
            : "Para o aluno acessar a área dele no site, o e-mail aqui precisa ser o MESMO com que ele cria a conta. Ele mesmo faz o vínculo, em /aluno."}
        </p>
        <Cartao>
          <CartaoCorpo className="sm:p-8">
            <FormularioSimples acao={salvarAluno} aoSalvar="Dados salvos.">
              <input type="hidden" name="id" value={id} />
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Rotulo htmlFor="nome">Nome</Rotulo>
                  <Campo
                    id="nome"
                    name="nome"
                    required
                    defaultValue={aluno.nome}
                    disabled={!podeEditar}
                  />
                </div>
                <div>
                  <Rotulo htmlFor="email">E-mail</Rotulo>
                  <Campo
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={aluno.email ?? ""}
                    disabled={!podeEditar}
                  />
                </div>
                <div>
                  <Rotulo htmlFor="telefone">Telefone</Rotulo>
                  <Campo
                    id="telefone"
                    name="telefone"
                    defaultValue={aluno.telefone ?? ""}
                    disabled={!podeEditar}
                  />
                </div>
                <div>
                  <Rotulo htmlFor="ativo">Situação</Rotulo>
                  <Selecao
                    id="ativo"
                    name="ativo"
                    defaultValue={aluno.ativo ? "1" : "0"}
                    disabled={!podeEditar}
                  >
                    <option value="1">Ativo</option>
                    <option value="0">Inativo</option>
                  </Selecao>
                </div>
                <div className="sm:col-span-2">
                  <Rotulo htmlFor="observacoes">Observações</Rotulo>
                  <AreaTexto
                    id="observacoes"
                    name="observacoes"
                    rows={3}
                    defaultValue={aluno.observacoes ?? ""}
                    disabled={!podeEditar}
                  />
                </div>
              </div>
            </FormularioSimples>
          </CartaoCorpo>
        </Cartao>
      </section>
    </div>
  );
}
