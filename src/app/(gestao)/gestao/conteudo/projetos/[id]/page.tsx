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
import { excluirProjeto, salvarProjeto } from "@/lib/gestao/acoes-conteudo";
import type { Projeto } from "@/lib/tipos";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Projeto" };

export default async function EditorProjeto({ params }: { params: Promise<{ id: string }> }) {
  const sessao = await exigirTela("conteudo");
  const podeEditar = sessao.podeEditar("conteudo");
  const { id } = await params;
  const novo = id === "novo";

  let projeto: Projeto | null = null;
  if (!novo) {
    const supabase = await criarClienteServidor();
    const { data } = await supabase.from("projetos").select("*").eq("id", id).maybeSingle();
    if (!data) notFound();
    projeto = data as Projeto;
  }

  const publicado = projeto?.status === "publicado";

  async function excluir(dados: FormData) {
    "use server";
    await excluirProjeto(String(dados.get("id")));
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/gestao/conteudo/projetos"
        className="inline-flex items-center gap-1 text-sm font-medium text-marca-700 hover:text-marca-800"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar aos projetos
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-texto">
          {novo ? "Novo projeto" : projeto!.titulo}
        </h1>
        {projeto ? (
          <Etiqueta tom={publicado ? "verde" : "ambar"}>
            {publicado ? "Publicado" : "Rascunho"}
          </Etiqueta>
        ) : null}
      </div>

      <Cartao className="mt-6">
        <CartaoCorpo className="sm:p-8">
          <FormularioConteudo acao={salvarProjeto}>
            {projeto ? <input type="hidden" name="id" value={projeto.id} /> : null}

            <div className="grid gap-5 sm:grid-cols-[1fr_8rem]">
              <div>
                <Rotulo htmlFor="titulo">Título</Rotulo>
                <Campo id="titulo" name="titulo" required defaultValue={projeto?.titulo ?? ""} />
              </div>
              <div>
                <Rotulo htmlFor="ordem">Ordem</Rotulo>
                <Campo id="ordem" name="ordem" type="number" defaultValue={projeto?.ordem ?? 0} />
              </div>
            </div>

            <div>
              <Rotulo htmlFor="descricao">Descrição</Rotulo>
              <AreaTexto
                id="descricao"
                name="descricao"
                rows={6}
                defaultValue={projeto?.descricao ?? ""}
              />
            </div>

            <UploadImagem valorInicial={projeto?.imagem_url} pasta="projetos" />
          </FormularioConteudo>
        </CartaoCorpo>
      </Cartao>

      {projeto && podeEditar ? (
        <div className="mt-6">
          <BotaoExcluir
            acao={excluir}
            id={projeto.id}
            comTexto="Excluir este projeto"
            mensagem={`Excluir o projeto "${projeto.titulo}"? Esta ação não pode ser desfeita.`}
          />
        </div>
      ) : null}
    </div>
  );
}
