import type { Metadata } from "next";
import { Eye, Users, Newspaper } from "lucide-react";
import { Cartao, CartaoCorpo, Vazio } from "@/components/ui";
import { GraficoAcessos } from "./GraficoAcessos";
import { formatarData } from "@/lib/datas";
import { exigirTela } from "@/lib/auth/permissoes";
import { criarClienteServidor } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Audiência do site" };

type LinhaDia = { dia: string; acessos: number; visitantes: number };
type LinhaPagina = { path: string; acessos: number };
type LinhaNoticia = { id: string; titulo: string; slug: string; visualizacoes: number };

export default async function PaginaAudiencia() {
  await exigirTela("audiencia");
  const supabase = await criarClienteServidor();

  const [dias, paginas, noticias] = await Promise.all([
    supabase.from("v_acessos_dia").select("*").limit(30),
    supabase.from("v_paginas_populares").select("*").limit(10),
    supabase.from("v_noticias_mais_vistas").select("*").limit(10),
  ]);

  const porDia = ((dias.data ?? []) as LinhaDia[]).slice().reverse();
  const maisAcessadas = (paginas.data ?? []) as LinhaPagina[];
  const maisVistas = ((noticias.data ?? []) as LinhaNoticia[]).filter((n) => n.visualizacoes > 0);

  const total = porDia.reduce((s, d) => s + Number(d.acessos), 0);
  const visitantes = porDia.reduce((s, d) => s + Number(d.visitantes), 0);
  const totalNoticias = maisVistas.reduce((s, n) => s + Number(n.visualizacoes), 0);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-semibold tracking-tight text-texto">Audiência do site</h1>
      <p className="mt-1 text-texto-suave">
        Contagem por sessão anônima — não guardamos IP nem identificamos visitantes.
      </p>

      <div className="mt-8 grid gap-5 sm:grid-cols-3">
        <Indicador Icone={Eye} rotulo="Acessos (30 dias)" valor={total} />
        <Indicador Icone={Users} rotulo="Visitantes distintos" valor={visitantes} />
        <Indicador Icone={Newspaper} rotulo="Leituras de notícias" valor={totalNoticias} />
      </div>

      <Cartao className="mt-6">
        <CartaoCorpo>
          <h2 className="mb-5 font-semibold text-texto">Acessos por dia</h2>
          {porDia.length === 0 ? (
            <Vazio mensagem="Ainda não há acessos registrados." />
          ) : (
            <GraficoAcessos
              dados={porDia.map((d) => ({
                dia: formatarData(d.dia, "dd/MM"),
                acessos: Number(d.acessos),
                visitantes: Number(d.visitantes),
              }))}
            />
          )}
        </CartaoCorpo>
      </Cartao>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Cartao>
          <CartaoCorpo>
            <h2 className="mb-4 font-semibold text-texto">Páginas mais acessadas</h2>
            {maisAcessadas.length === 0 ? (
              <Vazio mensagem="Sem dados ainda." />
            ) : (
              <ul className="divide-y divide-borda">
                {maisAcessadas.map((p) => (
                  <li key={p.path} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="truncate text-sm text-texto">{p.path}</span>
                    <span className="shrink-0 text-sm font-medium text-marca-700">{p.acessos}</span>
                  </li>
                ))}
              </ul>
            )}
          </CartaoCorpo>
        </Cartao>

        <Cartao>
          <CartaoCorpo>
            <h2 className="mb-4 font-semibold text-texto">Notícias mais lidas</h2>
            {maisVistas.length === 0 ? (
              <Vazio mensagem="Sem dados ainda." />
            ) : (
              <ul className="divide-y divide-borda">
                {maisVistas.map((n) => (
                  <li key={n.id} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="truncate text-sm text-texto">{n.titulo}</span>
                    <span className="shrink-0 text-sm font-medium text-marca-700">
                      {n.visualizacoes}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CartaoCorpo>
        </Cartao>
      </div>
    </div>
  );
}

function Indicador({
  Icone,
  rotulo,
  valor,
}: {
  Icone: typeof Eye;
  rotulo: string;
  valor: number;
}) {
  return (
    <Cartao>
      <CartaoCorpo>
        <Icone className="h-6 w-6 text-marca-600" />
        <p className="mt-3 text-sm text-texto-suave">{rotulo}</p>
        <p className="mt-1 text-3xl font-semibold text-texto">{valor.toLocaleString("pt-BR")}</p>
      </CartaoCorpo>
    </Cartao>
  );
}
