import type { Metadata } from "next";
import { AreaTexto, Campo, Cartao, CartaoCorpo, Etiqueta, Rotulo, Vazio } from "@/components/ui";
import { BotaoExcluir } from "@/components/gestao/BotaoExcluir";
import { FormularioConteudo } from "@/components/gestao/Formulario";
import { UploadImagem } from "@/components/gestao/UploadImagem";
import { exigirTela } from "@/lib/auth/permissoes";
import { criarClienteServidor } from "@/lib/supabase/server";
import { excluirProjeto, salvarProjeto } from "@/lib/gestao/acoes-conteudo";
import type { Projeto } from "@/lib/tipos";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Projetos" };

export default async function PaginaProjetosGestao({
  searchParams,
}: {
  searchParams: Promise<{ editar?: string }>;
}) {
  await exigirTela("conteudo");
  const { editar } = await searchParams;

  const supabase = await criarClienteServidor();
  const { data } = await supabase.from("projetos").select("*").order("ordem");
  const projetos = (data ?? []) as Projeto[];
  const emEdicao = projetos.find((p) => p.id === editar);

  async function excluir(dados: FormData) {
    "use server";
    await excluirProjeto(String(dados.get("id")));
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold tracking-tight text-texto">Projetos</h1>
      <p className="mt-1 text-texto-suave">Frentes de trabalho exibidas no site.</p>

      <Cartao className="mt-8">
        <CartaoCorpo className="sm:p-8">
          <h2 className="mb-5 font-semibold text-texto">
            {emEdicao ? "Editar projeto" : "Novo projeto"}
          </h2>

          <FormularioConteudo acao={salvarProjeto} key={emEdicao?.id ?? "novo"}>
            {emEdicao ? <input type="hidden" name="id" value={emEdicao.id} /> : null}

            <div className="grid gap-5 sm:grid-cols-[1fr_8rem]">
              <div>
                <Rotulo htmlFor="titulo">Título</Rotulo>
                <Campo id="titulo" name="titulo" required defaultValue={emEdicao?.titulo ?? ""} />
              </div>
              <div>
                <Rotulo htmlFor="ordem">Ordem</Rotulo>
                <Campo id="ordem" name="ordem" type="number" defaultValue={emEdicao?.ordem ?? 0} />
              </div>
            </div>

            <div>
              <Rotulo htmlFor="descricao">Descrição</Rotulo>
              <AreaTexto id="descricao" name="descricao" rows={5} defaultValue={emEdicao?.descricao ?? ""} />
            </div>

            <UploadImagem valorInicial={emEdicao?.imagem_url} pasta="projetos" />
          </FormularioConteudo>
        </CartaoCorpo>
      </Cartao>

      <h2 className="mb-4 mt-10 font-semibold text-texto">Projetos cadastrados</h2>
      {projetos.length === 0 ? (
        <Vazio mensagem="Nenhum projeto cadastrado." />
      ) : (
        <Cartao className="divide-y divide-borda overflow-hidden">
          {projetos.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
              <div className="min-w-0 flex-1">
                <Etiqueta tom={p.status === "publicado" ? "verde" : "ambar"}>
                  {p.status === "publicado" ? "Publicado" : "Rascunho"}
                </Etiqueta>
                <p className="mt-1.5 truncate font-medium text-texto">{p.titulo}</p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`/gestao/conteudo/projetos?editar=${p.id}`}
                  className="rounded-full px-4 py-2 text-sm font-medium text-azul-700 hover:bg-azul-50"
                >
                  Editar
                </a>
                <BotaoExcluir
                  acao={excluir}
                  id={p.id}
                  rotulo="Excluir projeto"
                  mensagem={`Excluir o projeto "${p.titulo}"? Esta ação não pode ser desfeita.`}
                />
              </div>
            </div>
          ))}
        </Cartao>
      )}
    </div>
  );
}
