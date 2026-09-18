import Link from "next/link";
import type { Metadata } from "next";
import { Cartao, CartaoCorpo, TituloSecao, Vazio } from "@/components/ui";
import { formatarData } from "@/lib/datas";
import { listarNoticias } from "@/lib/conteudo";
import { registrarAcesso } from "@/lib/metricas";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Notícias" };

export default async function PaginaNoticias() {
  await registrarAcesso("/noticias");
  const noticias = await listarNoticias(60);

  return (
    <div className="container-site py-14">
      <TituloSecao titulo="Notícias" descricao="Tudo o que acontece na Casa Espírita Rosa Branca." />

      {noticias.length === 0 ? (
        <Vazio mensagem="Nenhuma notícia publicada ainda." />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {noticias.map((n) => (
            <Link key={n.id} href={`/noticias/${n.slug}`} className="group">
              <Cartao className="h-full overflow-hidden group-hover:shadow-lg group-hover:shadow-marca-900/10">
                <div
                  className="h-44 bg-marca-100 bg-cover bg-center"
                  style={n.imagem_url ? { backgroundImage: `url(${n.imagem_url})` } : undefined}
                />
                <CartaoCorpo>
                  <p className="text-xs text-texto-suave">
                    {formatarData(n.publicado_em ?? n.criado_em)}
                  </p>
                  <h2 className="mt-2 text-lg font-semibold leading-snug text-texto group-hover:text-marca-700">
                    {n.titulo}
                  </h2>
                  {n.resumo ? (
                    <p className="mt-2 line-clamp-3 text-sm text-texto-suave">{n.resumo}</p>
                  ) : null}
                </CartaoCorpo>
              </Cartao>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
