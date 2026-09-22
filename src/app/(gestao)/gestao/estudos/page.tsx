import Link from "next/link";
import type { Metadata } from "next";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { Cartao, CartaoCorpo, Etiqueta, Vazio } from "@/components/ui";
import { CabecalhoLista, FiltrosLista, type OpcaoFiltro } from "@/components/gestao/Lista";
import { exigirTela } from "@/lib/auth/permissoes";
import { listarTurmas } from "@/lib/gestao/estudos";
import { formatarData } from "@/lib/datas";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Área de estudos" };

const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const OPCOES_STATUS: OpcaoFiltro[] = [
  { valor: "", rotulo: "Todas" },
  { valor: "ativa", rotulo: "Em andamento" },
  { valor: "planejada", rotulo: "Planejadas" },
  { valor: "encerrada", rotulo: "Encerradas" },
];

const TOM_STATUS = {
  ativa: "verde",
  planejada: "ambar",
  encerrada: "cinza",
} as const;

const ROTULO_STATUS = {
  ativa: "Em andamento",
  planejada: "Planejada",
  encerrada: "Encerrada",
} as const;

export default async function PaginaEstudos({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sessao = await exigirTela("estudos");
  const podeEditar = sessao.podeEditar("estudos");
  const { status } = await searchParams;

  const turmas = await listarTurmas(status || undefined);

  return (
    <div className="mx-auto max-w-5xl">
      <CabecalhoLista
        titulo="Área de estudos"
        descricao="Turmas, planejamento das aulas, chamada e histórico dos alunos."
        novoHref="/gestao/estudos/nova"
        novoRotulo="Nova turma"
        podeEditar={podeEditar}
      />

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link
          href="/gestao/estudos/alunos"
          className="inline-flex items-center gap-2 rounded-full border border-marca-200 bg-white px-5 py-2.5 text-sm font-medium text-marca-700 hover:bg-marca-50"
        >
          <Users className="h-4 w-4" /> Alunos e históricos
        </Link>
      </div>

      <div className="mt-6">
        <FiltrosLista
          base="/gestao/estudos"
          busca=""
          status={status}
          opcoesStatus={OPCOES_STATUS}
          rotuloStatus="Situação"
        />
      </div>

      {turmas.length === 0 ? (
        <div className="mt-8">
          <Vazio
            mensagem={
              status
                ? "Nenhuma turma nesta situação."
                : "Nenhuma turma cadastrada. Comece criando a primeira."
            }
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {turmas.map((t) => (
            <Link key={t.id} href={`/gestao/estudos/${t.id}`} className="group block">
              <Cartao className="h-full transition-shadow group-hover:shadow-lg group-hover:shadow-marca-900/10">
                <CartaoCorpo>
                  <div className="flex flex-wrap items-center gap-2">
                    <Etiqueta tom={TOM_STATUS[t.status]}>{ROTULO_STATUS[t.status]}</Etiqueta>
                    <Etiqueta tom="marca">{t.nivel}</Etiqueta>
                  </div>

                  <h2 className="mt-3 text-lg font-semibold leading-snug text-texto group-hover:text-marca-700">
                    {t.nome}
                  </h2>

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

                  <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-texto-suave">
                    <span>
                      <strong className="font-semibold text-texto">{t.matriculados}</strong>{" "}
                      {t.matriculados === 1 ? "aluno" : "alunos"}
                    </span>
                    <span>
                      <strong className="font-semibold text-texto">{t.aulas}</strong>{" "}
                      {t.aulas === 1 ? "aula" : "aulas"}
                    </span>
                    {t.data_inicio ? <span>desde {formatarData(t.data_inicio)}</span> : null}
                  </p>
                </CartaoCorpo>
              </Cartao>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
