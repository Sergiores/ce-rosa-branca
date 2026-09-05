import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { AreaTexto, Campo, Cartao, CartaoCorpo, Etiqueta, Rotulo } from "@/components/ui";
import { FormularioConteudo } from "@/components/gestao/Formulario";
import { UploadImagem } from "@/components/gestao/UploadImagem";
import { BotaoExcluir } from "@/components/gestao/BotaoExcluir";
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

  async function excluir(dados: FormData) {
    "use server";
    await excluirEvento(String(dados.get("id")));
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/gestao/conteudo/eventos"
        className="inline-flex items-center gap-1 text-sm font-medium text-azul-700 hover:text-azul-800"
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
