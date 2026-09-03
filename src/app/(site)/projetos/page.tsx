import type { Metadata } from "next";
import { Cartao, CartaoCorpo, TituloSecao, Vazio } from "@/components/ui";
import { listarProjetos } from "@/lib/conteudo";
import { registrarAcesso } from "@/lib/metricas";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Projetos" };

export default async function PaginaProjetos() {
  await registrarAcesso("/projetos");
  const projetos = await listarProjetos();

  return (
    <div className="container-site py-14">
      <TituloSecao
        titulo="Nossos projetos"
        descricao="Frentes de trabalho mantidas pela casa, pelos voluntários e pela comunidade."
      />

      {projetos.length === 0 ? (
        <Vazio mensagem="Nenhum projeto publicado ainda." />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projetos.map((p) => (
            <Cartao key={p.id} className="h-full overflow-hidden">
              <div
                className="h-40 bg-azul-100 bg-cover bg-center"
                style={p.imagem_url ? { backgroundImage: `url(${p.imagem_url})` } : undefined}
              />
              <CartaoCorpo>
                <h2 className="text-lg font-semibold text-texto">{p.titulo}</h2>
                {p.descricao ? (
                  <p className="mt-2 text-sm leading-relaxed text-texto-suave">{p.descricao}</p>
                ) : null}
              </CartaoCorpo>
            </Cartao>
          ))}
        </div>
      )}
    </div>
  );
}
