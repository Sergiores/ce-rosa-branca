import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { AreaTexto, Campo, Cartao, CartaoCorpo, Etiqueta, Rotulo } from "@/components/ui";
import { FormularioConteudo } from "@/components/gestao/Formulario";
import { BotaoExcluir } from "@/components/gestao/BotaoExcluir";
import { formatarData } from "@/lib/datas";
import { exigirTela } from "@/lib/auth/permissoes";
import { criarClienteServidor } from "@/lib/supabase/server";
import { excluirMensagem, salvarMensagem } from "@/lib/gestao/acoes-conteudo";
import type { MensagemDoDia } from "@/lib/tipos";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mensagem do dia" };

export default async function EditorMensagem({ params }: { params: Promise<{ id: string }> }) {
  const sessao = await exigirTela("conteudo");
  const podeEditar = sessao.podeEditar("conteudo");
  const { id } = await params;
  const nova = id === "nova";

  let mensagem: MensagemDoDia | null = null;
  if (!nova) {
    const supabase = await criarClienteServidor();
    const { data } = await supabase.from("mensagens_do_dia").select("*").eq("id", id).maybeSingle();
    if (!data) notFound();
    mensagem = data as MensagemDoDia;
  }

  const publicada = mensagem?.status === "publicado";

  async function excluir(dados: FormData) {
    "use server";
    await excluirMensagem(String(dados.get("id")));
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/gestao/conteudo/mensagens"
        className="inline-flex items-center gap-1 text-sm font-medium text-azul-700 hover:text-azul-800"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar às mensagens
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-texto">
          {nova ? "Nova mensagem" : `Mensagem de ${formatarData(mensagem!.data)}`}
        </h1>
        {mensagem ? (
          <Etiqueta tom={publicada ? "verde" : "ambar"}>
            {publicada ? "Publicada" : "Rascunho"}
          </Etiqueta>
        ) : null}
      </div>

      <Cartao className="mt-6">
        <CartaoCorpo className="sm:p-8">
          {podeEditar ? (
            <FormularioConteudo acao={salvarMensagem}>
              {mensagem ? <input type="hidden" name="id" value={mensagem.id} /> : null}

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <Rotulo htmlFor="data">Data</Rotulo>
                  <Campo
                    id="data"
                    name="data"
                    type="date"
                    required
                    defaultValue={mensagem?.data ?? new Date().toISOString().slice(0, 10)}
                  />
                </div>
                <div>
                  <Rotulo htmlFor="autor">Autor (opcional)</Rotulo>
                  <Campo
                    id="autor"
                    name="autor"
                    placeholder="Emmanuel, Chico Xavier..."
                    defaultValue={mensagem?.autor ?? ""}
                  />
                </div>
              </div>

              <div>
                <Rotulo htmlFor="texto">Mensagem</Rotulo>
                <AreaTexto
                  id="texto"
                  name="texto"
                  rows={6}
                  required
                  defaultValue={mensagem?.texto ?? ""}
                />
              </div>
            </FormularioConteudo>
          ) : (
            <p className="whitespace-pre-line text-texto">{mensagem?.texto}</p>
          )}
        </CartaoCorpo>
      </Cartao>

      {mensagem && podeEditar ? (
        <div className="mt-6">
          <BotaoExcluir
            acao={excluir}
            id={mensagem.id}
            comTexto="Excluir esta mensagem"
            mensagem={`Excluir a mensagem de ${formatarData(mensagem.data)}? Esta ação não pode ser desfeita.`}
          />
        </div>
      ) : null}
    </div>
  );
}
