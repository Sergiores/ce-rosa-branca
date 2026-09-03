import type { Metadata } from "next";
import { AreaTexto, Campo, Cartao, CartaoCorpo, Etiqueta, Rotulo } from "@/components/ui";
import { FormularioConteudo } from "@/components/gestao/Formulario";
import { exigirTela } from "@/lib/auth/permissoes";
import { criarClienteServidor } from "@/lib/supabase/server";
import { salvarPagina } from "@/lib/gestao/acoes-conteudo";
import type { Pagina } from "@/lib/tipos";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Páginas institucionais" };

const PAGINAS_FIXAS = [
  { slug: "sobre", titulo: "A Casa", rota: "/sobre" },
  { slug: "missao", titulo: "Missão, visão e valores", rota: "/sobre/missao" },
  { slug: "contato", titulo: "Contato", rota: "/contato" },
];

export default async function PaginasInstitucionais({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string }>;
}) {
  await exigirTela("conteudo");
  const { slug } = await searchParams;
  const alvo = PAGINAS_FIXAS.find((p) => p.slug === slug) ?? PAGINAS_FIXAS[0];

  const supabase = await criarClienteServidor();
  const { data } = await supabase.from("paginas").select("*");
  const paginas = (data ?? []) as Pagina[];
  const atual = paginas.find((p) => p.slug === alvo.slug);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold tracking-tight text-texto">Páginas institucionais</h1>
      <p className="mt-1 text-texto-suave">
        Deixe o texto em branco para o site usar o conteúdo padrão.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {PAGINAS_FIXAS.map((p) => {
          const existente = paginas.find((x) => x.slug === p.slug);
          const ativo = p.slug === alvo.slug;
          return (
            <a
              key={p.slug}
              href={`/gestao/conteudo/paginas?slug=${p.slug}`}
              className={
                ativo
                  ? "rounded-full bg-azul-600 px-5 py-2.5 text-sm font-medium text-white"
                  : "rounded-full border border-borda bg-white px-5 py-2.5 text-sm font-medium text-texto-suave hover:bg-azul-50"
              }
            >
              {p.titulo}
              {existente?.status === "rascunho" ? " (rascunho)" : ""}
            </a>
          );
        })}
      </div>

      <Cartao className="mt-6">
        <CartaoCorpo className="sm:p-8">
          <div className="mb-5 flex items-center gap-3">
            <h2 className="font-semibold text-texto">{alvo.titulo}</h2>
            <Etiqueta tom="cinza">{alvo.rota}</Etiqueta>
          </div>

          <FormularioConteudo acao={salvarPagina} key={alvo.slug}>
            <input type="hidden" name="slug" value={alvo.slug} />

            <div>
              <Rotulo htmlFor="titulo">Título exibido</Rotulo>
              <Campo id="titulo" name="titulo" required defaultValue={atual?.titulo ?? alvo.titulo} />
            </div>

            <div>
              <Rotulo htmlFor="corpo">Texto da página</Rotulo>
              <AreaTexto
                id="corpo"
                name="corpo"
                rows={16}
                placeholder="Separe os parágrafos com uma linha em branco."
                defaultValue={atual?.corpo ?? ""}
              />
            </div>
          </FormularioConteudo>
        </CartaoCorpo>
      </Cartao>
    </div>
  );
}
