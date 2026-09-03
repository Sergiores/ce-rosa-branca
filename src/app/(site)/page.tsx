import Link from "next/link";
import { CalendarDays, HeartHandshake, BookOpen, Sparkles, ArrowRight } from "lucide-react";
import { CarrosselNoticias } from "@/components/site/CarrosselNoticias";
import { BotaoLink, Cartao, CartaoCorpo, Etiqueta, TituloSecao, Vazio } from "@/components/ui";
import { formatarData, formatarDataLonga } from "@/lib/datas";
import {
  listarDestaques,
  listarNoticias,
  listarProjetos,
  listarProximosEventos,
  obterMensagemDoDia,
} from "@/lib/conteudo";
import { registrarAcesso } from "@/lib/metricas";

export const dynamic = "force-dynamic";

export default async function PaginaInicial() {
  await registrarAcesso("/");

  const [destaques, noticias, mensagem, eventos, projetos] = await Promise.all([
    listarDestaques(),
    listarNoticias(6),
    obterMensagemDoDia(),
    listarProximosEventos(3),
    listarProjetos(),
  ]);

  const carrossel = destaques.length > 0 ? destaques : noticias.slice(0, 3);
  const lojaUrl = process.env.NEXT_PUBLIC_LOJA_URL;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-azul-100 via-azul-50 to-fundo">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-azul-200/50 blur-3xl" />
        <div className="container-site relative py-16 sm:py-24">
          <div className="animar-surgir max-w-3xl">
            <Etiqueta tom="azul">
              <Sparkles className="h-3.5 w-3.5" />
              Caridade, estudo e trabalho
            </Etiqueta>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-texto sm:text-6xl">
              Casa Espírita <span className="text-azul-600">Rosa Branca</span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-texto-suave">
              Uma casa de acolhimento, estudo e oração. Aqui você encontra as atividades da semana,
              nossas mensagens, projetos sociais e o estudo da doutrina espírita.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <BotaoLink href="/eventos" tamanho="lg">
                Programação da casa
              </BotaoLink>
              <BotaoLink href="/sobre" variante="contorno" tamanho="lg">
                Conheça a Rosa Branca
              </BotaoLink>
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
        <Cartao className="overflow-hidden border-azul-200 bg-gradient-to-br from-white to-azul-50">
          <CartaoCorpo className="sm:p-10">
            <Etiqueta tom="azul">Mensagem do dia</Etiqueta>
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
            className="hidden shrink-0 items-center gap-1 text-sm font-medium text-azul-700 hover:text-azul-800 sm:inline-flex"
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
                <Cartao className="h-full overflow-hidden group-hover:shadow-lg group-hover:shadow-azul-900/10">
                  <div
                    className="h-44 bg-azul-100 bg-cover bg-center"
                    style={n.imagem_url ? { backgroundImage: `url(${n.imagem_url})` } : undefined}
                  />
                  <CartaoCorpo>
                    <p className="text-xs text-texto-suave">
                      {formatarData(n.publicado_em ?? n.criado_em)}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold leading-snug text-texto group-hover:text-azul-700">
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

      {/* Próximos eventos */}
      <section className="container-site mt-20">
        <TituloSecao titulo="Próximos encontros" descricao="Palestras, estudos e atividades." />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {eventos.length === 0 ? (
            <div className="sm:col-span-2 lg:col-span-3">
              <Vazio mensagem="Nenhum evento agendado no momento." />
            </div>
          ) : (
            eventos.map((e) => (
              <Cartao key={e.id} className="h-full">
                <CartaoCorpo>
                  <div className="flex items-center gap-2 text-azul-600">
                    <CalendarDays className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {formatarData(e.inicio, "dd/MM 'às' HH:mm")}
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-texto">{e.titulo}</h3>
                  {e.local ? <p className="mt-1 text-sm text-texto-suave">{e.local}</p> : null}
                  {e.descricao ? (
                    <p className="mt-3 line-clamp-3 text-sm text-texto-suave">{e.descricao}</p>
                  ) : null}
                </CartaoCorpo>
              </Cartao>
            ))
          )}
        </div>
      </section>

      {/* Atalhos */}
      <section className="container-site mt-20">
        <div className="grid gap-6 lg:grid-cols-3">
          <Cartao className="bg-azul-600 text-white">
            <CartaoCorpo className="sm:p-8">
              <BookOpen className="h-8 w-8 text-azul-100" />
              <h3 className="mt-4 text-xl font-semibold">Estudo do Livro dos Médiuns</h3>
              <p className="mt-2 text-sm text-azul-100">
                Pergunta, resposta e o parecer dos nossos médiuns sobre cada texto.
              </p>
              <Link
                href="/estudo"
                className="mt-6 inline-flex items-center gap-1 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-azul-700"
              >
                Estudar agora <ArrowRight className="h-4 w-4" />
              </Link>
            </CartaoCorpo>
          </Cartao>

          <Cartao>
            <CartaoCorpo className="sm:p-8">
              <HeartHandshake className="h-8 w-8 text-azul-600" />
              <h3 className="mt-4 text-xl font-semibold text-texto">Projetos sociais</h3>
              <p className="mt-2 text-sm text-texto-suave">
                {projetos.length > 0
                  ? `${projetos.length} ${projetos.length === 1 ? "projeto ativo" : "projetos ativos"} mantidos pela casa e por voluntários.`
                  : "Conheça as frentes de trabalho mantidas pela casa."}
              </p>
              <Link
                href="/projetos"
                className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-azul-700"
              >
                Ver projetos <ArrowRight className="h-4 w-4" />
              </Link>
            </CartaoCorpo>
          </Cartao>

          <Cartao>
            <CartaoCorpo className="sm:p-8">
              <Sparkles className="h-8 w-8 text-azul-600" />
              <h3 className="mt-4 text-xl font-semibold text-texto">Loja online</h3>
              <p className="mt-2 text-sm text-texto-suave">
                Livros e materiais de estudo. A renda apoia as atividades da casa.
              </p>
              {lojaUrl ? (
                <a
                  href={lojaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-azul-700"
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
