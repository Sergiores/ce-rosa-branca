import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, CalendarDays, CheckCircle2, Plus, UserPlus } from "lucide-react";
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
import { BotaoExcluir } from "@/components/gestao/BotaoExcluir";
import { formatarData } from "@/lib/datas";
import { exigirTela } from "@/lib/auth/permissoes";
import {
  alunosDisponiveis,
  frequenciaDaTurma,
  listarAulas,
  listarMatriculas,
  obterTurma,
} from "@/lib/gestao/estudos";
import {
  alterarStatusMatricula,
  excluirTurma,
  matricularAluno,
  removerMatricula,
  salvarTurma,
} from "@/lib/gestao/acoes-estudos";
import type { Turma } from "@/lib/tipos";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Turma" };

const DIAS = [
  { valor: "", rotulo: "—" },
  { valor: "0", rotulo: "Domingo" },
  { valor: "1", rotulo: "Segunda-feira" },
  { valor: "2", rotulo: "Terça-feira" },
  { valor: "3", rotulo: "Quarta-feira" },
  { valor: "4", rotulo: "Quinta-feira" },
  { valor: "5", rotulo: "Sexta-feira" },
  { valor: "6", rotulo: "Sábado" },
];

const TOM_AULA = { planejada: "ambar", realizada: "verde", cancelada: "cinza" } as const;
const ROTULO_AULA = { planejada: "Planejada", realizada: "Realizada", cancelada: "Cancelada" } as const;
const ROTULO_MATRICULA = {
  matriculado: "Cursando",
  concluido: "Concluiu",
  desistente: "Desistiu",
} as const;
const TOM_MATRICULA = { matriculado: "marca", concluido: "verde", desistente: "cinza" } as const;

export default async function PaginaTurma({ params }: { params: Promise<{ id: string }> }) {
  const sessao = await exigirTela("estudos");
  const { id } = await params;
  const nova = id === "nova";
  const podeEditar = sessao.podeEditar("estudos");

  let turma: Turma | null = null;
  if (!nova) {
    turma = await obterTurma(id);
    if (!turma) notFound();
  }

  const [matriculas, aulas, disponiveis, frequencias] = nova
    ? [[], [], [], []]
    : await Promise.all([
        listarMatriculas(id),
        listarAulas(id),
        alunosDisponiveis(id),
        frequenciaDaTurma(id),
      ]);

  const freqPorAluno = new Map(frequencias.map((f) => [f.aluno_id, f]));
  const proximoNumero = aulas.length > 0 ? Math.max(...aulas.map((a) => a.numero)) + 1 : 1;

  async function excluir(dados: FormData) {
    "use server";
    await excluirTurma(dados);
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/gestao/estudos"
        className="inline-flex items-center gap-1 text-sm font-medium text-marca-700 hover:text-marca-800"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar às turmas
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-texto">
          {nova ? "Nova turma" : turma!.nome}
        </h1>
        {!nova && podeEditar ? (
          <BotaoExcluir
            acao={excluir}
            id={id}
            comTexto="Excluir turma"
            mensagem="Excluir esta turma apaga também as aulas, matrículas, materiais e a chamada registrada. Essa ação não pode ser desfeita. Confirma?"
          />
        ) : null}
      </div>

      {/* Dados da turma */}
      <Cartao className="mt-6">
        <CartaoCorpo className="sm:p-8">
          <FormularioSimples acao={salvarTurma} aoSalvar="Turma salva.">
            <input type="hidden" name="id" value={nova ? "" : id} />

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Rotulo htmlFor="nome">Nome da turma</Rotulo>
                <Campo
                  id="nome"
                  name="nome"
                  required
                  defaultValue={turma?.nome ?? ""}
                  placeholder="Ex.: Estudo do Evangelho — quartas"
                  disabled={!podeEditar}
                />
              </div>

              <div>
                <Rotulo htmlFor="nivel">Nível</Rotulo>
                <Campo
                  id="nivel"
                  name="nivel"
                  required
                  defaultValue={turma?.nivel ?? "Introdutório"}
                  placeholder="Ex.: Introdutório, Aprofundamento"
                  disabled={!podeEditar}
                />
              </div>

              <div>
                <Rotulo htmlFor="status">Situação</Rotulo>
                <Selecao
                  id="status"
                  name="status"
                  defaultValue={turma?.status ?? "planejada"}
                  disabled={!podeEditar}
                >
                  <option value="planejada">Planejada</option>
                  <option value="ativa">Em andamento</option>
                  <option value="encerrada">Encerrada</option>
                </Selecao>
              </div>

              <div>
                <Rotulo htmlFor="dia_semana">Dia da semana</Rotulo>
                <Selecao
                  id="dia_semana"
                  name="dia_semana"
                  defaultValue={turma?.dia_semana?.toString() ?? ""}
                  disabled={!podeEditar}
                >
                  {DIAS.map((d) => (
                    <option key={d.valor} value={d.valor}>
                      {d.rotulo}
                    </option>
                  ))}
                </Selecao>
              </div>

              <div>
                <Rotulo htmlFor="horario">Horário</Rotulo>
                <Campo
                  id="horario"
                  name="horario"
                  type="time"
                  defaultValue={turma?.horario?.slice(0, 5) ?? ""}
                  disabled={!podeEditar}
                />
              </div>

              <div className="sm:col-span-2">
                <Rotulo htmlFor="local">Local</Rotulo>
                <Campo
                  id="local"
                  name="local"
                  defaultValue={turma?.local ?? ""}
                  disabled={!podeEditar}
                />
              </div>

              <div>
                <Rotulo htmlFor="data_inicio">Início</Rotulo>
                <Campo
                  id="data_inicio"
                  name="data_inicio"
                  type="date"
                  defaultValue={turma?.data_inicio ?? ""}
                  disabled={!podeEditar}
                />
              </div>

              <div>
                <Rotulo htmlFor="data_fim">Término previsto</Rotulo>
                <Campo
                  id="data_fim"
                  name="data_fim"
                  type="date"
                  defaultValue={turma?.data_fim ?? ""}
                  disabled={!podeEditar}
                />
              </div>

              <div className="sm:col-span-2">
                <Rotulo htmlFor="descricao">Descrição</Rotulo>
                <AreaTexto
                  id="descricao"
                  name="descricao"
                  rows={3}
                  defaultValue={turma?.descricao ?? ""}
                  disabled={!podeEditar}
                />
              </div>
            </div>
          </FormularioSimples>
        </CartaoCorpo>
      </Cartao>

      {nova ? (
        <p className="mt-6 text-sm text-texto-suave">
          Salve a turma para começar a matricular alunos e planejar as aulas.
        </p>
      ) : (
        <>
          {/* Aulas */}
          <section className="mt-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-texto">Calendário de aulas</h2>
              {podeEditar ? (
                <Link
                  href={`/gestao/estudos/${id}/aulas/nova?numero=${proximoNumero}`}
                  className="inline-flex items-center gap-2 rounded-full bg-marca-600 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-marca-600/20 hover:bg-marca-700"
                >
                  <Plus className="h-4 w-4" /> Nova aula
                </Link>
              ) : null}
            </div>

            {aulas.length === 0 ? (
              <div className="mt-5">
                <Vazio mensagem="Nenhuma aula planejada ainda." />
              </div>
            ) : (
              <Cartao className="mt-5 divide-y divide-borda overflow-hidden">
                {aulas.map((a) => (
                  <Link
                    key={a.id}
                    href={`/gestao/estudos/${id}/aulas/${a.id}`}
                    className="flex flex-wrap items-center gap-4 px-5 py-4 transition-colors hover:bg-marca-50"
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-marca-50 text-sm font-semibold text-marca-700">
                      {a.numero}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-texto">{a.titulo}</p>
                      <p className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-texto-suave">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatarData(a.data)}
                      </p>
                    </div>
                    <Etiqueta tom={TOM_AULA[a.status]}>{ROTULO_AULA[a.status]}</Etiqueta>
                  </Link>
                ))}
              </Cartao>
            )}
          </section>

          {/* Alunos matriculados */}
          <section className="mt-10">
            <h2 className="text-lg font-semibold text-texto">Alunos da turma</h2>

            {matriculas.length === 0 ? (
              <div className="mt-5">
                <Vazio mensagem="Nenhum aluno matriculado nesta turma." />
              </div>
            ) : (
              <Cartao className="mt-5 divide-y divide-borda overflow-hidden">
                {matriculas.map((m) => {
                  const f = freqPorAluno.get(m.aluno_id);
                  return (
                    <div key={m.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/gestao/estudos/alunos/${m.aluno_id}`}
                          className="truncate font-medium text-texto hover:text-marca-700"
                        >
                          {m.aluno.nome}
                        </Link>
                        {f && f.aulas_realizadas > 0 ? (
                          <p className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-texto-suave">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {f.presencas} de {f.aulas_realizadas} aulas
                            {f.frequencia_pct !== null ? ` · ${f.frequencia_pct}%` : ""}
                          </p>
                        ) : null}
                      </div>

                      <Etiqueta tom={TOM_MATRICULA[m.status]}>
                        {ROTULO_MATRICULA[m.status]}
                      </Etiqueta>

                      {podeEditar ? (
                        <div className="flex items-center gap-2">
                          <form action={alterarStatusMatricula} className="flex items-center gap-2">
                            <input type="hidden" name="id" value={m.id} />
                            <input type="hidden" name="turma_id" value={id} />
                            <Selecao
                              name="status"
                              defaultValue={m.status}
                              className="h-9 py-0 text-sm"
                            >
                              <option value="matriculado">Cursando</option>
                              <option value="concluido">Concluiu</option>
                              <option value="desistente">Desistiu</option>
                            </Selecao>
                            <button
                              type="submit"
                              className="rounded-full px-3 py-2 text-sm font-medium text-marca-700 hover:bg-marca-50"
                            >
                              Salvar
                            </button>
                          </form>

                          <BotaoExcluir
                            acao={removerMatricula}
                            id={m.id}
                            campos={{ turma_id: id }}
                            rotulo="Remover da turma"
                            mensagem={`Remover ${m.aluno.nome} desta turma? A presença já registrada nas aulas continua no histórico do aluno.`}
                          />
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </Cartao>
            )}

            {podeEditar ? (
              <Cartao className="mt-5">
                <CartaoCorpo>
                  {disponiveis.length === 0 ? (
                    <p className="text-sm text-texto-suave">
                      Todos os alunos cadastrados já estão nesta turma.{" "}
                      <Link
                        href="/gestao/estudos/alunos"
                        className="font-medium text-marca-700 hover:text-marca-800"
                      >
                        Cadastrar novo aluno
                      </Link>
                    </p>
                  ) : (
                    <form action={matricularAluno} className="flex flex-wrap items-end gap-3">
                      <input type="hidden" name="turma_id" value={id} />
                      <div className="min-w-0 flex-1">
                        <Rotulo htmlFor="aluno_id">Matricular aluno</Rotulo>
                        <Selecao id="aluno_id" name="aluno_id" required>
                          {disponiveis.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.nome}
                            </option>
                          ))}
                        </Selecao>
                      </div>
                      <button
                        type="submit"
                        className="inline-flex h-11 items-center gap-2 rounded-full bg-marca-600 px-5 text-sm font-medium text-white hover:bg-marca-700"
                      >
                        <UserPlus className="h-4 w-4" /> Matricular
                      </button>
                    </form>
                  )}
                </CartaoCorpo>
              </Cartao>
            ) : null}
          </section>
        </>
      )}
    </div>
  );
}
