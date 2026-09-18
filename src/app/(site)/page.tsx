import Link from "next/link";
import Image from "next/image";
import {
  CalendarDays,
  Store,
  HeartHandshake,
  BookOpen,
  Sparkles,
  ArrowRight,
  MapPin,
  Clock,
} from "lucide-react";
import { CarrosselNoticias } from "@/components/site/CarrosselNoticias";
import { Calendario } from "@/components/site/Calendario";
import { Cartao, CartaoCorpo, Etiqueta, TituloSecao, Vazio } from "@/components/ui";
import { formatarData, formatarDataLonga } from "@/lib/datas";
import {
  listarDestaques,
  listarEventosDoMes,
  listarNoticias,
  listarProjetos,
  listarProximosEventos,
  obterMensagemDoDia,
} from "@/lib/conteudo";
import { registrarAcesso } from "@/lib/metricas";

export const dynamic = "force-dynamic";

/** Le `?mes=AAAA-MM` da URL; fora disso, o mes corrente. */
function mesPedido(valor: string | undefined, hoje: Date) {
  const casa = /^(\d{4})-(\d{2})$/.exec(valor ?? "");
  if (casa) {
    const ano = Number(casa[1]);
    const mes = Number(casa[2]);
    if (ano >= 2000 && ano <= 2100 && mes >= 1 && mes <= 12) return { ano, mes };
  }
  return { ano: hoje.getFullYear(), mes: hoje.getMonth() + 1 };
}

export default async function PaginaInicial({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  await registrarAcesso("/");

  const hoje = new Date();
  const { mes: mesParam } = await searchParams;
  const { ano, mes } = mesPedido(mesParam, hoje);

  const [destaques, noticias, mensagem, eventos, eventosDoMes, projetos] = await Promise.all([
    listarDestaques(),
    listarNoticias(6),
    obterMensagemDoDia(),
    listarProximosEventos(4),
    listarEventosDoMes(ano, mes),
    listarProjetos(),
  ]);

  const carrossel = destaques.length > 0 ? destaques : noticias.slice(0, 3);
  const lojaUrl = process.env.NEXT_PUBLIC_LOJA_URL;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-marca-100 via-marca-50 to-fundo">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-marca-200/50 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-24 h-80 w-80 rounded-full bg-marca-100/70 blur-3xl" />

        <div className="container-site relative grid items-center gap-8 py-10 sm:py-16 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:py-20">
          <div className="animar-surgir">
            <Etiqueta tom="marca">
              <Sparkles className="h-3.5 w-3.5" />
              No poder de Deus, tudo é possível
            </Etiqueta>

            <h1 className="mt-5 font-marca text-4xl leading-[1.05] text-texto sm:text-5xl lg:text-6xl">
              <span className="block text-[0.32em] uppercase tracking-[0.34em] text-marca-600">
                Casa Espírita
              </span>
              <span className="mt-2 block sm:mt-3">Rosa Branca</span>
            </h1>

            <p className="mt-5 max-w-xl leading-relaxed text-texto-suave sm:text-lg">
              Uma casa de acolhimento, estudo e oração. Aqui você encontra a agenda da semana,
              nossas mensagens, os projetos sociais e o estudo da doutrina espírita.
            </p>
          </div>

          {/* A foto e a propria arte da casa, recortada sem o texto gravado para
              nao competir com o titulo. */}
          <div className="animar-surgir relative">
            <div className="overflow-hidden rounded-3xl border border-white/70 shadow-xl shadow-marca-900/10">
              <Image
                src="/marca/hero.webp"
                alt="Mão erguida em prece diante de uma rosa branca iluminada pelo sol"
                width={980}
                height={912}
                priority
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Carrossel */}
      {carrossel.length > 0 ? (
        <section className="container-site -mt-8 sm:-mt-12">
          <CarrosselNoticias noticias={carrossel} />
        </section>
      ) : null}

      {/* Mensagem do dia */}
      <section className="container-site mt-16">
        <Cartao className="overflow-hidden border-marca-200 bg-gradient-to-br from-white to-marca-50">
          <CartaoCorpo className="sm:p-10">
            <Etiqueta tom="marca">Mensagem do dia</Etiqueta>
            {mensagem ? (
              <>
                <blockquote className="mt-5 text-xl leading-relaxed text-texto sm:text-2xl">
                  “{mensagem.texto}”
                </blockquote>
                <p className="mt-4 text-sm text-texto-suave">
                  {mensagem.autor ? `${mensagem.autor} — ` : ""}
                  {formatarDataLonga(mensagem.data)}
                </p>
              </>
            ) : (
              <p className="mt-5 text-texto-suave">
                A mensagem de hoje ainda não foi publicada. Volte em instantes.
              </p>
            )}
          </CartaoCorpo>
        </Cartao>
      </section>

      {/* Agenda: calendario do mes + proximos encontros, lado a lado */}
      <section id="agenda" className="container-site mt-20 scroll-mt-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <TituloSecao
            className="mb-0"
            titulo="Agenda da casa"
            descricao="Palestras, estudos, passes e atividades abertas à comunidade."
          />
          <Link
            href="/eventos"
            className="hidden shrink-0 items-center gap-1 text-sm font-medium text-marca-700 hover:text-marca-800 sm:inline-flex"
          >
            Calendário completo <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <Cartao>
            <CartaoCorpo className="sm:p-8">
              <Calendario ano={ano} mes={mes} eventos={eventosDoMes} hoje={hoje} />
            </CartaoCorpo>
          </Cartao>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-texto-suave">
              Próximos encontros
            </h3>

            {eventos.length === 0 ? (
              <Cartao>
                <CartaoCorpo className="sm:p-8">
                  <Vazio mensagem="Nenhum encontro agendado no momento." />
                </CartaoCorpo>
              </Cartao>
            ) : (
              eventos.map((e) => (
                <Link key={e.id} href={`/eventos/${e.id}`} className="group block">
                  <Cartao className="overflow-hidden transition-shadow group-hover:shadow-md group-hover:shadow-marca-900/10">
                    <CartaoCorpo className="flex gap-5 sm:p-6">
                      {e.imagem_url ? (
                        <div
                          className="h-20 w-20 shrink-0 rounded-2xl bg-marca-100 bg-cover bg-center"
                          style={{ backgroundImage: `url(${e.imagem_url})` }}
                        />
                      ) : (
                        <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-marca-50 text-marca-700">
                          <span className="text-xl font-semibold leading-none">
                            {formatarData(e.inicio, "dd")}
                          </span>
                          <span className="mt-1 text-xs uppercase tracking-wide">
                            {formatarData(e.inicio, "MMM")}
                          </span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="font-semibold leading-snug text-texto group-hover:text-marca-700">
                          {e.titulo}
                        </h4>
                        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-texto-suave">
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {formatarData(e.inicio, "dd/MM")}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {formatarData(e.inicio, "HH:mm")}
                          </span>
                          {e.local ? (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {e.local}
                            </span>
                          ) : null}
                        </div>
                        {e.descricao ? (
                          <p className="mt-2 line-clamp-2 text-sm text-texto-suave">
                            {e.descricao}
                          </p>
                        ) : null}
                      </div>
                    </CartaoCorpo>
                  </Cartao>
                </Link>
              ))
            )}

            <Link
              href="/eventos"
              className="inline-flex items-center gap-1 text-sm font-medium text-marca-700 hover:text-marca-800 sm:hidden"
            >
              Calendário completo <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Notícias */}
      <section className="container-site mt-20">
        <div className="flex items-end justify-between gap-4">
          <TituloSecao
            className="mb-0"
            titulo="Últimas notícias"
            descricao="Acompanhe o que acontece na casa."
          />
          <Link
            href="/noticias"
            className="hidden shrink-0 items-center gap-1 text-sm font-medium text-marca-700 hover:text-marca-800 sm:inline-flex"
          >
            Ver todas <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {noticias.length === 0 ? (
            <div className="sm:col-span-2 lg:col-span-3">
              <Vazio mensagem="Nenhuma notícia publicada ainda." />
            </div>
          ) : (
            noticias.map((n) => (
              <Link key={n.id} href={`/noticias/${n.slug}`} className="group">
                <Cartao className="h-full overflow-hidden group-hover:shadow-lg group-hover:shadow-marca-900/10">
                  <div
                    className="h-44 bg-marca-100 bg-cover bg-center"
                    style={n.imagem_url ? { backgroundImage: `url(${n.imagem_url})` } : undefined}
                  />
                  <CartaoCorpo>
                    <p className="text-xs text-texto-suave">
                      {formatarData(n.publicado_em ?? n.criado_em)}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold leading-snug text-texto group-hover:text-marca-700">
                      {n.titulo}
                    </h3>
                    {n.resumo ? (
                      <p className="mt-2 line-clamp-3 text-sm text-texto-suave">{n.resumo}</p>
                    ) : null}
                  </CartaoCorpo>
                </Cartao>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* Atalhos */}
      <section className="container-site mt-20">
        <div className="grid gap-6 lg:grid-cols-3">
          <Cartao className="bg-marca-600 text-white">
            <CartaoCorpo className="sm:p-8">
              <BookOpen className="h-8 w-8 text-marca-100" />
              <h3 className="mt-4 text-xl font-semibold">Estudo do Livro dos Espíritos</h3>
              <p className="mt-2 text-sm text-marca-100">
                Pergunta, resposta e o parecer dos nossos médiuns sobre cada texto.
              </p>
              <Link
                href="/estudo"
                className="mt-6 inline-flex items-center gap-1 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-marca-700"
              >
                Estudar agora <ArrowRight className="h-4 w-4" />
              </Link>
            </CartaoCorpo>
          </Cartao>

          <Cartao>
            <CartaoCorpo className="sm:p-8">
              <HeartHandshake className="h-8 w-8 text-marca-600" />
              <h3 className="mt-4 text-xl font-semibold text-texto">Projetos sociais</h3>
              <p className="mt-2 text-sm text-texto-suave">
                {projetos.length > 0
                  ? `${projetos.length} ${projetos.length === 1 ? "projeto ativo" : "projetos ativos"} mantidos pela casa e por voluntários.`
                  : "Conheça as frentes de trabalho mantidas pela casa."}
              </p>
              <Link
                href="/projetos"
                className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-marca-700"
              >
                Ver projetos <ArrowRight className="h-4 w-4" />
              </Link>
            </CartaoCorpo>
          </Cartao>

          <Cartao>
            <CartaoCorpo className="sm:p-8">
              <Store className="h-8 w-8 text-marca-600" />
              <h3 className="mt-4 text-xl font-semibold text-texto">Loja online</h3>
              <p className="mt-2 text-sm text-texto-suave">
                Livros e materiais de estudo. A renda apoia as atividades da casa.
              </p>
              {lojaUrl ? (
                <a
                  href={lojaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-marca-700"
                >
                  Acessar a loja <ArrowRight className="h-4 w-4" />
                </a>
              ) : (
                <p className="mt-6 text-sm text-texto-suave/70">Em breve.</p>
              )}
            </CartaoCorpo>
          </Cartao>
        </div>
      </section>
    </>
  );
}
