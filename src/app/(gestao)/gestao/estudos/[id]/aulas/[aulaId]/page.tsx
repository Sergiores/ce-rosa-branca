import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ClipboardList,
  ExternalLink,
  FileText,
  Link2,
  Pencil,
  Plus,
  Video,
  X,
} from "lucide-react";
import { Cartao, CartaoCorpo, Etiqueta, Vazio } from "@/components/ui";
import { BotaoExcluir } from "@/components/gestao/BotaoExcluir";
import { emParagrafos } from "@/lib/utils";
import { formatarData } from "@/lib/datas";
import { exigirTela } from "@/lib/auth/permissoes";
import {
  listarMateriais,
  listarMatriculas,
  obterAula,
  obterPresencas,
  obterTurma,
} from "@/lib/gestao/estudos";
import { excluirAula, excluirMaterial } from "@/lib/gestao/acoes-estudos";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Aula" };

const ICONE_MATERIAL = { video: Video, link: Link2, texto: FileText };
const TOM_AULA = { planejada: "ambar", realizada: "verde", cancelada: "cinza" } as const;
const ROTULO_AULA = {
  planejada: "Planejada",
  realizada: "Realizada",
  cancelada: "Cancelada",
} as const;

export default async function PaginaAula({
  params,
}: {
  params: Promise<{ id: string; aulaId: string }>;
}) {
  const sessao = await exigirTela("estudos");
  const { id, aulaId } = await params;
  const podeEditar = sessao.podeEditar("estudos");

  const [turma, aula] = await Promise.all([obterTurma(id), obterAula(aulaId)]);
  if (!turma || !aula || aula.turma_id !== id) notFound();

  const [materiais, matriculas, presencas] = await Promise.all([
    listarMateriais(aulaId),
    listarMatriculas(id),
    obterPresencas(aulaId),
  ]);

  const chamada = matriculas.filter((m) => m.status !== "desistente");
  const presentes = chamada.filter((m) => presencas.get(m.aluno_id)?.presente).length;

  async function excluir(dados: FormData) {
    "use server";
    await excluirAula(dados);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={`/gestao/estudos/${id}`}
        className="inline-flex items-center gap-1 text-sm font-medium text-marca-700 hover:text-marca-800"
      >
        <ArrowLeft className="h-4 w-4" /> {turma.nome}
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-texto">
              Aula {aula.numero} — {aula.titulo}
            </h1>
            <Etiqueta tom={TOM_AULA[aula.status]}>{ROTULO_AULA[aula.status]}</Etiqueta>
          </div>
          <p className="mt-1 inline-flex items-center gap-1.5 text-texto-suave">
            <CalendarDays className="h-4 w-4" />
            {formatarData(aula.data)}
          </p>
        </div>

        {podeEditar ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Link
              href={`/gestao/estudos/${id}/aulas/${aulaId}/editar`}
              className="inline-flex items-center gap-2 rounded-full border border-marca-200 bg-white px-5 py-2.5 text-sm font-medium text-marca-700 hover:bg-marca-50"
            >
              <Pencil className="h-4 w-4" /> Editar
            </Link>
            <BotaoExcluir
              acao={excluir}
              id={aulaId}
              campos={{ turma_id: id }}
              mensagem="Excluir esta aula apaga o plano, os materiais e a chamada dela. Confirma?"
            />
          </div>
        ) : null}
      </div>

      {/* Plano */}
      {aula.plano ? (
        <Cartao className="mt-6 border-marca-200 bg-gradient-to-br from-white to-marca-50">
          <CartaoCorpo className="sm:p-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-marca-700">
              Planejamento
            </h2>
            <div className="mt-3 space-y-3 text-base leading-relaxed text-texto">
              {emParagrafos(aula.plano).map((p, i) => (
                <p key={i} className="whitespace-pre-line">
                  {p}
                </p>
              ))}
            </div>
          </CartaoCorpo>
        </Cartao>
      ) : null}

      {aula.observacoes ? (
        <Cartao className="mt-6">
          <CartaoCorpo>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-texto-suave">
              Observações
            </h2>
            <p className="mt-2 whitespace-pre-line leading-relaxed text-texto">
              {aula.observacoes}
            </p>
          </CartaoCorpo>
        </Cartao>
      ) : null}

      {/* Materiais */}
      <section className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-texto">Materiais complementares</h2>
          {podeEditar ? (
            <Link
              href={`/gestao/estudos/${id}/aulas/${aulaId}/materiais/novo`}
              className="inline-flex items-center gap-2 rounded-full bg-marca-600 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-marca-600/20 hover:bg-marca-700"
            >
              <Plus className="h-4 w-4" /> Acrescentar
            </Link>
          ) : null}
        </div>

        {materiais.length === 0 ? (
          <div className="mt-5">
            <Vazio mensagem="Nenhum material nesta aula ainda." />
          </div>
        ) : (
          <Cartao className="mt-5 divide-y divide-borda overflow-hidden">
            {materiais.map((m) => {
              const Icone = ICONE_MATERIAL[m.tipo];
              return (
                <div key={m.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                  <Icone className="h-5 w-5 shrink-0 text-marca-600" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-texto">{m.titulo}</p>
                    {m.descricao ? (
                      <p className="mt-0.5 text-sm text-texto-suave">{m.descricao}</p>
                    ) : null}
                    {m.url ? (
                      <a
                        href={m.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-sm text-marca-700 hover:text-marca-800"
                      >
                        Abrir <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : null}
                  </div>
                  {podeEditar ? (
                    <BotaoExcluir
                      acao={excluirMaterial}
                      id={m.id}
                      campos={{ aula_id: aulaId, turma_id: id }}
                      mensagem={`Excluir o material "${m.titulo}"?`}
                    />
                  ) : null}
                </div>
              );
            })}
          </Cartao>
        )}
      </section>

      {/* Chamada — aqui só o resultado; marcar presença tem tela própria */}
      <section className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-texto">Chamada</h2>
            {presencas.size > 0 ? (
              <p className="mt-1 text-sm text-texto-suave">
                {presentes} de {chamada.length} presentes
              </p>
            ) : null}
          </div>
          {podeEditar && chamada.length > 0 ? (
            <Link
              href={`/gestao/estudos/${id}/aulas/${aulaId}/chamada`}
              className="inline-flex items-center gap-2 rounded-full bg-marca-600 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-marca-600/20 hover:bg-marca-700"
            >
              <ClipboardList className="h-4 w-4" />
              {presencas.size > 0 ? "Refazer chamada" : "Fazer chamada"}
            </Link>
          ) : null}
        </div>

        {chamada.length === 0 ? (
          <div className="mt-5">
            <Vazio mensagem="Nenhum aluno matriculado nesta turma." />
          </div>
        ) : presencas.size === 0 ? (
          <div className="mt-5">
            <Vazio mensagem="Chamada ainda não registrada para esta aula." />
          </div>
        ) : (
          <Cartao className="mt-5 divide-y divide-borda overflow-hidden">
            {chamada.map((m) => {
              const p = presencas.get(m.aluno_id);
              return (
                <div key={m.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <span
                    className={
                      p?.presente
                        ? "grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700"
                        : "grid h-8 w-8 shrink-0 place-items-center rounded-full bg-marca-50 text-texto-suave"
                    }
                  >
                    {p?.presente ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                  </span>
                  <span
                    className={
                      p?.presente
                        ? "min-w-0 flex-1 truncate font-medium text-texto"
                        : "min-w-0 flex-1 truncate font-medium text-texto-suave"
                    }
                  >
                    {m.aluno.nome}
                  </span>
                  {!p?.presente && p?.justificativa ? (
                    <span className="text-sm text-texto-suave">{p.justificativa}</span>
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
