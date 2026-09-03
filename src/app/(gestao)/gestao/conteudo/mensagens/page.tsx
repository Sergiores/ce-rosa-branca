import type { Metadata } from "next";
import { Trash2 } from "lucide-react";
import { AreaTexto, Campo, Cartao, CartaoCorpo, Etiqueta, Rotulo, Vazio } from "@/components/ui";
import { FormularioConteudo } from "@/components/gestao/Formulario";
import { formatarData } from "@/lib/datas";
import { exigirTela } from "@/lib/auth/permissoes";
import { criarClienteServidor } from "@/lib/supabase/server";
import { excluirMensagem, salvarMensagem } from "@/lib/gestao/acoes-conteudo";
import type { MensagemDoDia } from "@/lib/tipos";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mensagem do dia" };

export default async function PaginaMensagens({
  searchParams,
}: {
  searchParams: Promise<{ editar?: string }>;
}) {
  await exigirTela("conteudo");
  const { editar } = await searchParams;

  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("mensagens_do_dia")
    .select("*")
    .order("data", { ascending: false })
    .limit(60);
  const mensagens = (data ?? []) as MensagemDoDia[];
  const emEdicao = mensagens.find((m) => m.id === editar);

  async function excluir(dados: FormData) {
    "use server";
    await excluirMensagem(String(dados.get("id")));
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold tracking-tight text-texto">Mensagem do dia</h1>
      <p className="mt-1 text-texto-suave">
        A mensagem mais recente já publicada aparece na página inicial.
      </p>

      <Cartao className="mt-8">
        <CartaoCorpo className="sm:p-8">
          <h2 className="mb-5 font-semibold text-texto">
            {emEdicao ? "Editar mensagem" : "Nova mensagem"}
          </h2>

          <FormularioConteudo acao={salvarMensagem} key={emEdicao?.id ?? "nova"}>
            {emEdicao ? <input type="hidden" name="id" value={emEdicao.id} /> : null}

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Rotulo htmlFor="data">Data</Rotulo>
                <Campo
                  id="data"
                  name="data"
                  type="date"
                  required
                  defaultValue={emEdicao?.data ?? new Date().toISOString().slice(0, 10)}
                />
              </div>
              <div>
                <Rotulo htmlFor="autor">Autor (opcional)</Rotulo>
                <Campo
                  id="autor"
                  name="autor"
                  placeholder="Emmanuel, Chico Xavier..."
                  defaultValue={emEdicao?.autor ?? ""}
                />
              </div>
            </div>

            <div>
              <Rotulo htmlFor="texto">Mensagem</Rotulo>
              <AreaTexto id="texto" name="texto" rows={5} required defaultValue={emEdicao?.texto ?? ""} />
            </div>
          </FormularioConteudo>
        </CartaoCorpo>
      </Cartao>

      <h2 className="mb-4 mt-10 font-semibold text-texto">Mensagens cadastradas</h2>
      {mensagens.length === 0 ? (
        <Vazio mensagem="Nenhuma mensagem cadastrada." />
      ) : (
        <Cartao className="divide-y divide-borda overflow-hidden">
          {mensagens.map((m) => (
            <div key={m.id} className="flex flex-wrap items-start gap-4 px-5 py-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Etiqueta tom={m.status === "publicado" ? "verde" : "ambar"}>
                    {m.status === "publicado" ? "Publicada" : "Rascunho"}
                  </Etiqueta>
                  <span className="text-xs text-texto-suave">{formatarData(m.data)}</span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-texto">{m.texto}</p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`/gestao/conteudo/mensagens?editar=${m.id}`}
                  className="rounded-full px-4 py-2 text-sm font-medium text-azul-700 hover:bg-azul-50"
                >
                  Editar
                </a>
                <form action={excluir}>
                  <input type="hidden" name="id" value={m.id} />
                  <button
                    type="submit"
                    aria-label="Excluir"
                    className="grid h-9 w-9 place-items-center rounded-full text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
          ))}
        </Cartao>
      )}
    </div>
  );
}
