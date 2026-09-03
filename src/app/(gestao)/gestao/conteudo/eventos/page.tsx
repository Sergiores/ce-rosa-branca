import type { Metadata } from "next";
import { Trash2 } from "lucide-react";
import { AreaTexto, Campo, Cartao, CartaoCorpo, Etiqueta, Rotulo, Vazio } from "@/components/ui";
import { FormularioConteudo } from "@/components/gestao/Formulario";
import { UploadImagem } from "@/components/gestao/UploadImagem";
import { formatarDataHora } from "@/lib/datas";
import { exigirTela } from "@/lib/auth/permissoes";
import { criarClienteServidor } from "@/lib/supabase/server";
import { excluirEvento, salvarEvento } from "@/lib/gestao/acoes-conteudo";
import type { Evento } from "@/lib/tipos";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Eventos" };

/** Converte ISO para o formato aceito por <input type="datetime-local">. */
function paraCampoLocal(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  const desloc = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - desloc).toISOString().slice(0, 16);
}

export default async function PaginaEventosGestao({
  searchParams,
}: {
  searchParams: Promise<{ editar?: string }>;
}) {
  await exigirTela("conteudo");
  const { editar } = await searchParams;

  const supabase = await criarClienteServidor();
  const { data } = await supabase.from("eventos").select("*").order("inicio", { ascending: false });
  const eventos = (data ?? []) as Evento[];
  const emEdicao = eventos.find((e) => e.id === editar);

  async function excluir(dados: FormData) {
    "use server";
    await excluirEvento(String(dados.get("id")));
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold tracking-tight text-texto">Eventos</h1>
      <p className="mt-1 text-texto-suave">Programação exibida na página de eventos e na home.</p>

      <Cartao className="mt-8">
        <CartaoCorpo className="sm:p-8">
          <h2 className="mb-5 font-semibold text-texto">{emEdicao ? "Editar evento" : "Novo evento"}</h2>

          <FormularioConteudo acao={salvarEvento} key={emEdicao?.id ?? "novo"}>
            {emEdicao ? <input type="hidden" name="id" value={emEdicao.id} /> : null}

            <div>
              <Rotulo htmlFor="titulo">Título</Rotulo>
              <Campo id="titulo" name="titulo" required defaultValue={emEdicao?.titulo ?? ""} />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Rotulo htmlFor="inicio">Início</Rotulo>
                <Campo
                  id="inicio"
                  name="inicio"
                  type="datetime-local"
                  required
                  defaultValue={paraCampoLocal(emEdicao?.inicio)}
                />
              </div>
              <div>
                <Rotulo htmlFor="fim">Fim (opcional)</Rotulo>
                <Campo
                  id="fim"
                  name="fim"
                  type="datetime-local"
                  defaultValue={paraCampoLocal(emEdicao?.fim)}
                />
              </div>
            </div>

            <div>
              <Rotulo htmlFor="local">Local</Rotulo>
              <Campo id="local" name="local" defaultValue={emEdicao?.local ?? ""} />
            </div>

            <div>
              <Rotulo htmlFor="descricao">Descrição</Rotulo>
              <AreaTexto id="descricao" name="descricao" rows={5} defaultValue={emEdicao?.descricao ?? ""} />
            </div>

            <UploadImagem valorInicial={emEdicao?.imagem_url} pasta="eventos" />
          </FormularioConteudo>
        </CartaoCorpo>
      </Cartao>

      <h2 className="mb-4 mt-10 font-semibold text-texto">Eventos cadastrados</h2>
      {eventos.length === 0 ? (
        <Vazio mensagem="Nenhum evento cadastrado." />
      ) : (
        <Cartao className="divide-y divide-borda overflow-hidden">
          {eventos.map((e) => (
            <div key={e.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Etiqueta tom={e.status === "publicado" ? "verde" : "ambar"}>
                    {e.status === "publicado" ? "Publicado" : "Rascunho"}
                  </Etiqueta>
                  <span className="text-xs text-texto-suave">{formatarDataHora(e.inicio)}</span>
                </div>
                <p className="mt-1.5 truncate font-medium text-texto">{e.titulo}</p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`/gestao/conteudo/eventos?editar=${e.id}`}
                  className="rounded-full px-4 py-2 text-sm font-medium text-azul-700 hover:bg-azul-50"
                >
                  Editar
                </a>
                <form action={excluir}>
                  <input type="hidden" name="id" value={e.id} />
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
