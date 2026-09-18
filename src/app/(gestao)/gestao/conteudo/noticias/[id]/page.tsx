import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { AreaTexto, Campo, Cartao, CartaoCorpo, Etiqueta, Rotulo } from "@/components/ui";
import { FormularioConteudo } from "@/components/gestao/Formulario";
import { UploadImagem } from "@/components/gestao/UploadImagem";
import { exigirTela } from "@/lib/auth/permissoes";
import { criarClienteServidor } from "@/lib/supabase/server";
import { salvarNoticia } from "@/lib/gestao/acoes-conteudo";
import type { Noticia } from "@/lib/tipos";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Editar notícia" };

export default async function FormNoticia({ params }: { params: Promise<{ id: string }> }) {
  await exigirTela("conteudo", true);
  const { id } = await params;
  const nova = id === "nova";

  let noticia: Noticia | null = null;
  if (!nova) {
    const supabase = await criarClienteServidor();
    const { data } = await supabase.from("noticias").select("*").eq("id", id).maybeSingle();
    if (!data) notFound();
    noticia = data as Noticia;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/gestao/conteudo/noticias"
        className="inline-flex items-center gap-1 text-sm font-medium text-marca-700 hover:text-marca-800"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar às notícias
      </Link>

      <div className="mt-4 flex items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-texto">
          {nova ? "Nova notícia" : "Editar notícia"}
        </h1>
        {noticia ? (
          <Etiqueta tom={noticia.status === "publicado" ? "verde" : "ambar"}>
            {noticia.status === "publicado" ? "Publicada" : "Rascunho"}
          </Etiqueta>
        ) : null}
      </div>

      <Cartao className="mt-6">
        <CartaoCorpo className="sm:p-8">
          <FormularioConteudo acao={salvarNoticia}>
            {noticia ? <input type="hidden" name="id" value={noticia.id} /> : null}

            <div>
              <Rotulo htmlFor="titulo">Título</Rotulo>
              <Campo id="titulo" name="titulo" required defaultValue={noticia?.titulo ?? ""} />
            </div>

            <div>
              <Rotulo htmlFor="slug">Endereço da página (opcional)</Rotulo>
              <Campo
                id="slug"
                name="slug"
                placeholder="gerado a partir do título"
                defaultValue={noticia?.slug ?? ""}
              />
            </div>

            <div>
              <Rotulo htmlFor="resumo">Resumo</Rotulo>
              <AreaTexto
                id="resumo"
                name="resumo"
                rows={2}
                placeholder="Uma ou duas frases que aparecem na listagem e no carrossel."
                defaultValue={noticia?.resumo ?? ""}
              />
            </div>

            <div>
              <Rotulo htmlFor="corpo">Texto da notícia</Rotulo>
              <AreaTexto
                id="corpo"
                name="corpo"
                rows={14}
                placeholder="Separe os parágrafos com uma linha em branco."
                defaultValue={noticia?.corpo ?? ""}
              />
            </div>

            <UploadImagem valorInicial={noticia?.imagem_url} pasta="noticias" />

            <label className="flex items-center gap-3 rounded-xl border border-borda bg-white px-4 py-3">
              <input
                type="checkbox"
                name="destaque_carrossel"
                defaultChecked={noticia?.destaque_carrossel ?? false}
                className="h-4 w-4 rounded border-borda text-marca-600 focus:ring-marca-400"
              />
              <span className="text-sm text-texto">Exibir no carrossel da página inicial</span>
            </label>
          </FormularioConteudo>
        </CartaoCorpo>
      </Cartao>
    </div>
  );
}
