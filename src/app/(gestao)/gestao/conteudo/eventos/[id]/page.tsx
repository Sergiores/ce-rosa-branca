import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { AreaTexto, Campo, Cartao, CartaoCorpo, Etiqueta, Rotulo } from "@/components/ui";
import { FormularioConteudo } from "@/components/gestao/Formulario";
import { UploadImagem } from "@/components/gestao/UploadImagem";
import { BotaoExcluir } from "@/components/gestao/BotaoExcluir";
import { CompartilharWhatsApp } from "@/components/gestao/CompartilharWhatsApp";
import { formatarData } from "@/lib/datas";
import { exigirTela } from "@/lib/auth/permissoes";
import { criarClienteServidor } from "@/lib/supabase/server";
import { excluirEvento, salvarEvento } from "@/lib/gestao/acoes-conteudo";
import type { Evento } from "@/lib/tipos";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Evento" };

/** Converte ISO para o formato aceito por <input type="datetime-local">. */
function paraCampoLocal(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export default async function EditorEvento({ params }: { params: Promise<{ id: string }> }) {
  const sessao = await exigirTela("conteudo");
  const podeEditar = sessao.podeEditar("conteudo");
  const { id } = await params;
  const novo = id === "novo";

  let evento: Evento | null = null;
  if (!novo) {
    const supabase = await criarClienteServidor();
    const { data } = await supabase.from("eventos").select("*").eq("id", id).maybeSingle();
    if (!data) notFound();
    evento = data as Evento;
  }

  const publicado = evento?.status === "publicado";

  // Texto do comunicado. O asterisco e negrito no WhatsApp.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const linkPublico = evento ? `${siteUrl}/eventos/${evento.id}` : "";
  const comunicado = evento
    ? [
        `*${evento.titulo}*`,
        [
          formatarData(evento.inicio, "EEEE, d 'de' MMMM"),
          `às ${formatarData(evento.inicio, "HH:mm")}`,
        ].join(" "),
        evento.local ? `📍 ${evento.local}` : null,
        "",
        evento.descricao ?? "",
      ]
        .filter((l) => l !== null)
        .join("\n")
        .trim()
    : "";

  async function excluir(dados: FormData) {
    "use server";
    await excluirEvento(String(dados.get("id")));
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/gestao/conteudo/eventos"
        className="inline-flex items-center gap-1 text-sm font-medium text-marca-700 hover:text-marca-800"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar aos eventos
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-texto">
          {novo ? "Novo evento" : evento!.titulo}
        </h1>
        {evento ? (
          <Etiqueta tom={publicado ? "verde" : "ambar"}>
            {publicado ? "Publicado" : "Rascunho"}
          </Etiqueta>
        ) : null}
      </div>

      <Cartao className="mt-6">
        <CartaoCorpo className="sm:p-8">
          <FormularioConteudo acao={salvarEvento}>
            {evento ? <input type="hidden" name="id" value={evento.id} /> : null}

            <div>
              <Rotulo htmlFor="titulo">Título</Rotulo>
              <Campo id="titulo" name="titulo" required defaultValue={evento?.titulo ?? ""} />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Rotulo htmlFor="inicio">Início</Rotulo>
                <Campo
                  id="inicio"
                  name="inicio"
                  type="datetime-local"
                  required
                  defaultValue={paraCampoLocal(evento?.inicio)}
                />
              </div>
              <div>
                <Rotulo htmlFor="fim">Fim (opcional)</Rotulo>
                <Campo
                  id="fim"
                  name="fim"
                  type="datetime-local"
                  defaultValue={paraCampoLocal(evento?.fim)}
                />
              </div>
            </div>

            <div>
              <Rotulo htmlFor="local">Local</Rotulo>
              <Campo id="local" name="local" defaultValue={evento?.local ?? ""} />
            </div>

            <div>
              <Rotulo htmlFor="descricao">Descrição</Rotulo>
              <AreaTexto
                id="descricao"
                name="descricao"
                rows={6}
                defaultValue={evento?.descricao ?? ""}
              />
            </div>

            <UploadImagem valorInicial={evento?.imagem_url} pasta="eventos" />
          </FormularioConteudo>
        </CartaoCorpo>
      </Cartao>

      {/* Comunicado pronto para o grupo. Sem API: e o proprio WhatsApp que
          abre, e quem escolhe o destino e a pessoa. So faz sentido depois de
          publicado — mandar link de rascunho levaria a uma pagina que o
          visitante nao enxerga. */}
      {evento && publicado ? (
        <Cartao className="mt-6">
          <CartaoCorpo className="sm:p-8">
            <h2 className="font-semibold text-texto">Avisar no WhatsApp</h2>
            <p className="mt-1 text-sm text-texto-suave">
              Abre o WhatsApp com o comunicado pronto. No celular a imagem vai anexada; no
              computador vai o texto com o link, e o WhatsApp mostra a imagem na prévia.
            </p>

            <CompartilharWhatsApp
              className="mt-5"
              titulo={evento.titulo}
              texto={comunicado}
              url={linkPublico}
              imagemUrl={evento.imagem_url}
            />

            <details className="mt-5 text-sm [&_summary::-webkit-details-marker]:hidden">
              <summary className="cursor-pointer list-none font-medium text-marca-700">
                Ver o texto que será enviado
              </summary>
              <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-marca-50 p-4 font-sans text-texto">
                {comunicado}
                {"\n\n"}
                {linkPublico}
              </pre>
            </details>
          </CartaoCorpo>
        </Cartao>
      ) : null}

      {evento && !publicado ? (
        <p className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Publique o evento para poder avisar no WhatsApp — o link de um rascunho levaria a uma
          página que o visitante não consegue abrir.
        </p>
      ) : null}

      {evento && podeEditar ? (
        <div className="mt-6">
          <BotaoExcluir
            acao={excluir}
            id={evento.id}
            comTexto="Excluir este evento"
            mensagem={`Excluir o evento "${evento.titulo}"? Esta ação não pode ser desfeita.`}
          />
        </div>
      ) : null}
    </div>
  );
}
