import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, CalendarDays, Check, MapPin, Minus, X } from "lucide-react";
import { Cartao, CartaoCorpo, Etiqueta, Vazio } from "@/components/ui";
import { formatarData } from "@/lib/datas";
import { criarClienteServidor } from "@/lib/supabase/server";
import { aulasDaTurma, minhaTurma, minhasPresencas } from "@/lib/estudo/aluno";
import { registrarAcesso } from "@/lib/metricas";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Minha turma" };

const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export default async function PaginaMinhaTurma({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { id } = await params;

  if (!user) redirect(`/entrar?redirecionar=/aluno/turmas/${id}`);

  // O RLS já limita ao que é do aluno: se ele não estiver matriculado aqui,
  // a turma simplesmente não vem.
  const turma = await minhaTurma(id);
  if (!turma) notFound();

  await registrarAcesso(`/aluno/turmas/${id}`);

  const [aulas, presencas] = await Promise.all([aulasDaTurma(id), minhasPresencas(id)]);

  const realizadas = aulas.filter((a) => a.status === "realizada");
  const presentes = realizadas.filter((a) => presencas.get(a.id)?.presente).length;

  return (
    <div className="container-site max-w-3xl py-14">
      <Link
        href="/aluno"
        className="inline-flex items-center gap-1 text-sm font-medium text-marca-700 hover:text-marca-800"
      >
        <ArrowLeft className="h-4 w-4" /> Minha área de estudos
      </Link>

      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-texto sm:text-3xl">
        {turma.nome}
      </h1>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-texto-suave">
        <Etiqueta tom="marca">{turma.nivel}</Etiqueta>
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
      </div>

      {turma.descricao ? (
        <p className="mt-5 leading-relaxed text-texto">{turma.descricao}</p>
      ) : null}

      {realizadas.length > 0 ? (
        <Cartao className="mt-8">
          <CartaoCorpo>
            <p className="text-sm text-texto-suave">
              Você esteve em{" "}
              <strong className="font-semibold text-texto">
                {presentes} de {realizadas.length}
              </strong>{" "}
              {realizadas.length === 1 ? "aula dada" : "aulas dadas"}.
            </p>
          </CartaoCorpo>
        </Cartao>
      ) : null}

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-texto">Aulas</h2>

        {aulas.length === 0 ? (
          <div className="mt-5">
            <Vazio mensagem="Nenhuma aula publicada nesta turma ainda." />
          </div>
        ) : (
          <Cartao className="mt-5 divide-y divide-borda overflow-hidden">
            {aulas.map((a) => {
              const p = presencas.get(a.id);
              const cancelada = a.status === "cancelada";

              return (
                <Link
                  key={a.id}
                  href={`/aluno/aulas/${a.id}`}
                  className="flex flex-wrap items-center gap-4 px-5 py-4 transition-colors hover:bg-marca-50"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-marca-50 text-sm font-semibold text-marca-700">
                    {a.numero}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p
                      className={
                        cancelada
                          ? "truncate font-medium text-texto-suave line-through"
                          : "truncate font-medium text-texto"
                      }
                    >
                      {a.titulo}
                    </p>
                    <p className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-texto-suave">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {formatarData(a.data)}
                    </p>
                  </div>

                  {/* Só faz sentido falar de presença em aula que aconteceu. */}
                  {a.status === "realizada" ? (
                    p?.presente ? (
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                        <Check className="h-4 w-4" /> Presente
                      </span>
                    ) : p ? (
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-texto-suave">
                        <X className="h-4 w-4" /> Faltou
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-sm text-texto-suave">
                        <Minus className="h-4 w-4" /> Sem registro
                      </span>
                    )
                  ) : cancelada ? (
                    <Etiqueta tom="cinza">Cancelada</Etiqueta>
                  ) : (
                    <Etiqueta tom="ambar">A realizar</Etiqueta>
                  )}
                </Link>
              );
            })}
          </Cartao>
        )}
      </section>
    </div>
  );
}
