import Link from "next/link";
import type { Metadata } from "next";
import { Plus, Star, Eye, EyeOff, Trash2, Pencil } from "lucide-react";
import { BotaoLink, Cartao, Etiqueta, Vazio } from "@/components/ui";
import { BotaoExcluir } from "@/components/gestao/BotaoExcluir";
import { formatarData } from "@/lib/datas";
import { exigirTela } from "@/lib/auth/permissoes";
import { criarClienteServidor } from "@/lib/supabase/server";
import { alternarPublicacaoNoticia, excluirNoticia } from "@/lib/gestao/acoes-conteudo";
import type { Noticia } from "@/lib/tipos";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Notícias" };

export default async function ListaNoticias() {
  const sessao = await exigirTela("conteudo");
  const podeEditar = sessao.podeEditar("conteudo");

  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("noticias")
    .select("*")
    .order("criado_em", { ascending: false });
  const noticias = (data ?? []) as Noticia[];

  async function publicar(dados: FormData) {
    "use server";
    await alternarPublicacaoNoticia(String(dados.get("id")), dados.get("publicar") === "1");
  }

  async function excluir(dados: FormData) {
    "use server";
    await excluirNoticia(String(dados.get("id")));
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-texto">Notícias</h1>
          <p className="mt-1 text-texto-suave">Rascunhos ficam invisíveis para os visitantes.</p>
        </div>
        {podeEditar ? (
          <BotaoLink href="/gestao/conteudo/noticias/nova">
            <Plus className="h-4 w-4" /> Nova notícia
          </BotaoLink>
        ) : null}
      </div>

      <div className="mt-8">
        {noticias.length === 0 ? (
          <Vazio mensagem="Nenhuma notícia cadastrada." />
        ) : (
          <Cartao className="divide-y divide-borda overflow-hidden">
            {noticias.map((n) => (
              <div key={n.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Etiqueta tom={n.status === "publicado" ? "verde" : "ambar"}>
                      {n.status === "publicado" ? "Publicada" : "Rascunho"}
                    </Etiqueta>
                    {n.destaque_carrossel ? (
                      <Etiqueta tom="azul">
                        <Star className="h-3 w-3" /> Carrossel
                      </Etiqueta>
                    ) : null}
                  </div>
                  <p className="mt-1.5 truncate font-medium text-texto">{n.titulo}</p>
                  <p className="text-xs text-texto-suave">
                    {formatarData(n.publicado_em ?? n.criado_em)} · /{n.slug}
                  </p>
                </div>

                {podeEditar ? (
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/gestao/conteudo/noticias/${n.id}`}
                      aria-label="Editar"
                      className="grid h-9 w-9 place-items-center rounded-full text-azul-700 hover:bg-azul-50"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>

                    <form action={publicar}>
                      <input type="hidden" name="id" value={n.id} />
                      <input type="hidden" name="publicar" value={n.status === "publicado" ? "0" : "1"} />
                      <button
                        type="submit"
                        aria-label={n.status === "publicado" ? "Despublicar" : "Publicar"}
                        className="grid h-9 w-9 place-items-center rounded-full text-azul-700 hover:bg-azul-50"
                      >
                        {n.status === "publicado" ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </form>

                    <BotaoExcluir
                      acao={excluir}
                      id={n.id}
                      rotulo="Excluir notícia"
                      mensagem={`Excluir a notícia "${n.titulo}"? Esta ação não pode ser desfeita.`}
                    />
                  </div>
                ) : null}
              </div>
            ))}
          </Cartao>
        )}
      </div>
    </div>
  );
}
