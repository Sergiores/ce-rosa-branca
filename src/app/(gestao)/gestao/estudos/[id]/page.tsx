import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  MapPin,
  Pencil,
  Plus,
  UserPlus,
} from "lucide-react";
import { Cartao, Etiqueta, Selecao, Vazio } from "@/components/ui";
import { BotaoExcluir } from "@/components/gestao/BotaoExcluir";
import { formatarData } from "@/lib/datas";
import { exigirTela } from "@/lib/auth/permissoes";
import {
  frequenciaDaTurma,
  listarAulas,
  listarMatriculas,
  obterTurma,
} from "@/lib/gestao/estudos";
import {
  alterarStatusMatricula,
  excluirTurma,
  removerMatricula,
} from "@/lib/gestao/acoes-estudos";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Turma" };

const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const TOM_AULA = { planejada: "ambar", realizada: "verde", cancelada: "cinza" } as const;
const ROTULO_AULA = {
  planejada: "Planejada",
  realizada: "Realizada",
  cancelada: "Cancelada",
} as const;
const TOM_TURMA = { ativa: "verde", planejada: "ambar", encerrada: "cinza" } as const;
const ROTULO_TURMA = {
  ativa: "Em andamento",
  planejada: "Planejada",
  encerrada: "Encerrada",
} as const;
const ROTULO_MATRICULA = {
  matriculado: "Cursando",
  concluido: "Concluiu",
  desistente: "Desistiu",
} as const;
const TOM_MATRICULA = { matriculado: "marca", concluido: "verde", desistente: "cinza" } as const;

export default async function PaginaTurma({ params }: { params: Promise<{ id: string }> }) {
  const sessao = await exigirTela("estudos");
  const { id } = await params;
  const podeEditar = sessao.podeEditar("estudos");

  const turma = await obterTurma(id);
  if (!turma) notFound();

  const [matriculas, aulas, frequencias] = await Promise.all([
    listarMatriculas(id),
    listarAulas(id),
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

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-texto">{turma.nome}</h1>
            <Etiqueta tom={TOM_TURMA[turma.status]}>{ROTULO_TURMA[turma.status]}</Etiqueta>
            <Etiqueta tom="marca">{turma.nivel}</Etiqueta>
          </div>

          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-texto-suave">
            {turma.dia_semana !== null ? (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                {DIAS[turma.dia_semana]}
                {turma.horario ? ` · ${turma.horario.slice(0, 5)}` : ""}
              </span>
            ) : null}
            {turma.local ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {turma.local}
              </span>
            ) : null}
            {turma.data_inicio ? <span>desde {formatarData(turma.data_inicio)}</span> : null}
          </div>

          {turma.descricao ? (
            <p className="mt-3 max-w-2xl leading-relaxed text-texto">{turma.descricao}</p>
          ) : null}
        </div>

        {podeEditar ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Link
              href={`/gestao/estudos/${id}/editar`}
              className="inline-flex items-center gap-2 rounded-full border border-marca-200 bg-white px-5 py-2.5 text-sm font-medium text-marca-700 hover:bg-marca-50"
            >
              <Pencil className="h-4 w-4" /> Editar
            </Link>
            <BotaoExcluir
              acao={excluir}
              id={id}
              mensagem="Excluir esta turma apaga também as aulas, matrículas, materiais e a chamada registrada. Essa ação não pode ser desfeita. Confirma?"
            />
          </div>
        ) : null}
      </div>

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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-texto">Alunos da turma</h2>
          {podeEditar ? (
            <Link
              href={`/gestao/estudos/${id}/matricular`}
              className="inline-flex items-center gap-2 rounded-full bg-marca-600 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-marca-600/20 hover:bg-marca-700"
            >
              <UserPlus className="h-4 w-4" /> Matricular aluno
            </Link>
          ) : null}
        </div>

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

                  <Etiqueta tom={TOM_MATRICULA[m.status]}>{ROTULO_MATRICULA[m.status]}</Etiqueta>

                  {podeEditar ? (
                    <div className="flex items-center gap-2">
                      {/* Mudar a situação é um clique só — não vale uma tela própria. */}
                      <form action={alterarStatusMatricula} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={m.id} />
                        <input type="hidden" name="turma_id" value={id} />
                        <Selecao name="status" defaultValue={m.status} className="h-9 py-0 text-sm">
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
      </section>
    </div>
  );
}
