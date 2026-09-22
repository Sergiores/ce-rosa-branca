import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight, CalendarDays, GraduationCap, MapPin } from "lucide-react";
import { Cartao, CartaoCorpo, Etiqueta, Vazio } from "@/components/ui";
import { BotaoVincular } from "@/components/site/BotaoVincular";
import { formatarData, formatarDataLonga } from "@/lib/datas";
import { criarClienteServidor } from "@/lib/supabase/server";
import { meuAlunoId, minhaFrequencia, minhasTurmas, proximaAula } from "@/lib/estudo/aluno";
import { registrarAcesso } from "@/lib/metricas";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Minha área de estudos" };

const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const ROTULO_MATRICULA = {
  matriculado: "Cursando",
  concluido: "Concluiu",
  desistente: "Encerrada",
} as const;
const TOM_MATRICULA = { matriculado: "marca", concluido: "verde", desistente: "cinza" } as const;

export default async function PaginaAluno() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/entrar?redirecionar=/aluno");

  await registrarAcesso("/aluno");

  const alunoId = await meuAlunoId();

  // Conta sem cadastro de aluno vinculado: pode ser que exista um cadastro
  // com este mesmo e-mail esperando. O botão tenta ligar os dois.
  if (!alunoId) {
    return (
      <div className="container-site max-w-2xl py-14">
        <div className="flex items-start gap-4">
          <GraduationCap className="mt-1 h-8 w-8 shrink-0 text-marca-600" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-texto sm:text-3xl">
              Minha área de estudos
            </h1>
            <p className="mt-2 text-texto-suave">
              Sua conta ainda não está ligada a uma matrícula.
            </p>
          </div>
        </div>

        <Cartao className="mt-8">
          <CartaoCorpo className="sm:p-8">
            <p className="text-texto">
              Se você já estuda em alguma turma da casa, a secretaria precisa ter cadastrado o
              seu e-mail — <strong>{user.email}</strong> — na sua ficha de aluno. Quando isso
              estiver feito, o botão abaixo liga as duas coisas.
            </p>

            <BotaoVincular className="mt-6" />

            <p className="mt-6 border-t border-borda pt-5 text-sm text-texto-suave">
              Se não funcionar, fale com a secretaria e confirme qual e-mail está na sua ficha.
              Precisa ser exatamente o mesmo com que você entrou aqui.
            </p>
          </CartaoCorpo>
        </Cartao>
      </div>
    );
  }

  const [frequencias, turmas, proxima] = await Promise.all([
    minhaFrequencia(),
    minhasTurmas(),
    proximaAula(),
  ]);

  const turmaPorId = new Map(turmas.map((t) => [t.id, t]));
  const emCurso = frequencias.filter((f) => f.matricula_status === "matriculado");
  const encerradas = frequencias.filter((f) => f.matricula_status !== "matriculado");

  return (
    <div className="container-site max-w-3xl py-14">
      <div className="flex items-start gap-4">
        <GraduationCap className="mt-1 h-8 w-8 shrink-0 text-marca-600" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-texto sm:text-3xl">
            Minha área de estudos
          </h1>
          <p className="mt-2 text-texto-suave">
            Suas turmas, o planejamento das aulas e sua frequência.
          </p>
        </div>
      </div>

      {/* Próxima aula */}
      {proxima ? (
        <Cartao className="mt-8 border-marca-200 bg-gradient-to-br from-white to-marca-50">
          <CartaoCorpo className="sm:p-8">
            <Etiqueta tom="marca">Próxima aula</Etiqueta>
            <h2 className="mt-4 text-xl font-semibold text-texto">
              Aula {proxima.numero} — {proxima.titulo}
            </h2>
            <p className="mt-2 inline-flex items-center gap-1.5 text-texto-suave">
              <CalendarDays className="h-4 w-4" />
              <span className="first-letter:uppercase">{formatarDataLonga(proxima.data)}</span>
            </p>
            {proxima.turma_nome ? (
              <p className="mt-1 text-sm text-texto-suave">{proxima.turma_nome}</p>
            ) : null}
            <Link
              href={`/aluno/aulas/${proxima.id}`}
              className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-marca-700 hover:text-marca-800"
            >
              Ver o plano e os materiais <ArrowRight className="h-4 w-4" />
            </Link>
          </CartaoCorpo>
        </Cartao>
      ) : null}

      {/* Turmas em curso */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-texto">Minhas turmas</h2>

        {emCurso.length === 0 ? (
          <div className="mt-5">
            <Vazio mensagem="Você não está cursando nenhuma turma no momento." />
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {emCurso.map((f) => {
              const t = turmaPorId.get(f.turma_id);
              return (
                <Link key={f.matricula_id} href={`/aluno/turmas/${f.turma_id}`} className="group block">
                  <Cartao className="transition-shadow group-hover:shadow-lg group-hover:shadow-marca-900/10">
                    <CartaoCorpo>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-texto group-hover:text-marca-700">
                            {f.turma_nome}
                          </h3>
                          <p className="mt-0.5 text-sm text-texto-suave">{f.turma_nivel}</p>
                        </div>
                        <Etiqueta tom={TOM_MATRICULA[f.matricula_status]}>
                          {ROTULO_MATRICULA[f.matricula_status]}
                        </Etiqueta>
                      </div>

                      {t && (t.dia_semana !== null || t.local) ? (
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-texto-suave">
                          {t.dia_semana !== null ? (
                            <span className="inline-flex items-center gap-1.5">
                              <CalendarDays className="h-3.5 w-3.5" />
                              {DIAS[t.dia_semana]}
                              {t.horario ? ` · ${t.horario.slice(0, 5)}` : ""}
                            </span>
                          ) : null}
                          {t.local ? (
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5" />
                              {t.local}
                            </span>
                          ) : null}
                        </div>
                      ) : null}

                      {f.aulas_realizadas > 0 ? (
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-texto-suave">
                              Você esteve em {f.presencas} de {f.aulas_realizadas}{" "}
                              {f.aulas_realizadas === 1 ? "aula" : "aulas"}
                            </span>
                            <span className="font-semibold text-texto">{f.frequencia_pct}%</span>
                          </div>
                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-marca-100">
                            <div
                              className="h-full rounded-full bg-marca-600"
                              style={{ width: `${f.frequencia_pct ?? 0}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <p className="mt-4 text-sm text-texto-suave">
                          As aulas desta turma ainda não começaram.
                        </p>
                      )}
                    </CartaoCorpo>
                  </Cartao>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Histórico */}
      {encerradas.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-texto">Turmas que já fiz</h2>
          <Cartao className="mt-5 divide-y divide-borda overflow-hidden">
            {encerradas.map((f) => (
              <Link
                key={f.matricula_id}
                href={`/aluno/turmas/${f.turma_id}`}
                className="flex flex-wrap items-center gap-4 px-5 py-4 transition-colors hover:bg-marca-50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-texto">{f.turma_nome}</p>
                  <p className="mt-0.5 text-sm text-texto-suave">
                    {f.turma_nivel}
                    {f.concluido_em ? ` · concluída em ${formatarData(f.concluido_em)}` : ""}
                    {f.aulas_realizadas > 0 ? ` · ${f.frequencia_pct}% de presença` : ""}
                  </p>
                </div>
                <Etiqueta tom={TOM_MATRICULA[f.matricula_status]}>
                  {ROTULO_MATRICULA[f.matricula_status]}
                </Etiqueta>
              </Link>
            ))}
          </Cartao>
        </section>
      ) : null}
    </div>
  );
}
