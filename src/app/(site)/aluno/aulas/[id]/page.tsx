import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, CalendarDays, ExternalLink, FileText, Link2, Video } from "lucide-react";
import { Cartao, CartaoCorpo, Etiqueta, Vazio } from "@/components/ui";
import { BotaoOuvir } from "@/components/site/BotaoOuvir";
import { formatarDataLonga } from "@/lib/datas";
import { emParagrafos } from "@/lib/utils";
import { criarClienteServidor } from "@/lib/supabase/server";
import { materiaisDaAula, minhaAula, minhaTurma } from "@/lib/estudo/aluno";
import { registrarAcesso } from "@/lib/metricas";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Aula" };

const ICONE = { video: Video, link: Link2, texto: FileText };
const ROTULO_TIPO = { video: "Vídeo", link: "Link", texto: "Anotação" };

export default async function PaginaMinhaAula({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { id } = await params;

  if (!user) redirect(`/entrar?redirecionar=/aluno/aulas/${id}`);

  // Sem matrícula na turma da aula, o RLS não devolve a linha.
  const aula = await minhaAula(id);
  if (!aula) notFound();

  await registrarAcesso(`/aluno/aulas/${id}`);

  const [materiais, turma] = await Promise.all([materiaisDaAula(id), minhaTurma(aula.turma_id)]);

  const paragrafosPlano = aula.plano ? emParagrafos(aula.plano) : [];

  // Leitura em voz alta do plano, como já existe no estudo do Livro.
  const textoCompleto = [`Aula ${aula.numero}. ${aula.titulo}.`, aula.plano ?? ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="container-site max-w-3xl py-14">
      <Link
        href={`/aluno/turmas/${aula.turma_id}`}
        className="inline-flex items-center gap-1 text-sm font-medium text-marca-700 hover:text-marca-800"
      >
        <ArrowLeft className="h-4 w-4" /> {turma?.nome ?? "Voltar à turma"}
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Etiqueta tom="marca">Aula {aula.numero}</Etiqueta>
        {aula.status === "cancelada" ? <Etiqueta tom="cinza">Cancelada</Etiqueta> : null}
        {aula.status === "planejada" ? <Etiqueta tom="ambar">A realizar</Etiqueta> : null}
      </div>

      <h1 className="mt-3 text-2xl font-semibold leading-snug tracking-tight text-texto sm:text-3xl">
        {aula.titulo}
      </h1>

      <p className="mt-2 inline-flex items-center gap-1.5 text-texto-suave">
        <CalendarDays className="h-4 w-4" />
        <span className="first-letter:uppercase">{formatarDataLonga(aula.data)}</span>
      </p>

      {paragrafosPlano.length > 0 ? (
        <>
          <BotaoOuvir className="mt-5" rotulo="Ouvir o plano da aula" texto={textoCompleto} />

          <Cartao className="mt-6 border-marca-200 bg-gradient-to-br from-white to-marca-50">
            <CartaoCorpo className="sm:p-8">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-marca-700">
                Plano da aula
              </h2>
              <div className="mt-3 space-y-3 text-base leading-relaxed text-texto">
                {paragrafosPlano.map((p, i) => (
                  <p key={i} className="whitespace-pre-line">
                    {p}
                  </p>
                ))}
              </div>
            </CartaoCorpo>
          </Cartao>
        </>
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

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-texto">Materiais complementares</h2>

        {materiais.length === 0 ? (
          <div className="mt-5">
            <Vazio mensagem="Esta aula ainda não tem materiais." />
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {materiais.map((m) => {
              const Icone = ICONE[m.tipo];
              const conteudo = (
                <CartaoCorpo className="flex items-start gap-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-marca-50 text-marca-600">
                    <Icone className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-texto-suave">
                      {ROTULO_TIPO[m.tipo]}
                    </p>
                    <p className="mt-1 font-semibold text-texto">{m.titulo}</p>
                    {m.descricao ? (
                      <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-texto-suave">
                        {m.descricao}
                      </p>
                    ) : null}
                    {m.url ? (
                      <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-marca-700">
                        Abrir <ExternalLink className="h-3.5 w-3.5" />
                      </span>
                    ) : null}
                  </div>
                </CartaoCorpo>
              );

              return m.url ? (
                <a
                  key={m.id}
                  href={m.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block"
                >
                  <Cartao className="transition-shadow group-hover:shadow-lg group-hover:shadow-marca-900/10">
                    {conteudo}
                  </Cartao>
                </a>
              ) : (
                <Cartao key={m.id}>{conteudo}</Cartao>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
