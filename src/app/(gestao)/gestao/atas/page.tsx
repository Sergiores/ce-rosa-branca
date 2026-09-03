import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { BotaoLink, Cartao, Etiqueta, Vazio } from "@/components/ui";
import { formatarData } from "@/lib/datas";
import { exigirTela } from "@/lib/auth/permissoes";
import { criarClienteServidor } from "@/lib/supabase/server";
import type { Ata } from "@/lib/tipos";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Atas de reunião" };

const TIPO_LABEL: Record<string, string> = {
  ordinaria: "Ordinária",
  extraordinaria: "Extraordinária",
  assembleia: "Assembleia",
};

export default async function ListaAtas() {
  const sessao = await exigirTela("atas");
  const podeEditar = sessao.podeEditar("atas");

  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("atas")
    .select("*")
    .order("ano", { ascending: false })
    .order("numero", { ascending: false });
  const atas = (data ?? []) as Ata[];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-texto">Atas de reunião</h1>
          <p className="mt-1 text-texto-suave">
            Ata aprovada fica somente leitura — para corrigir, reabra como rascunho.
          </p>
        </div>
        {podeEditar ? (
          <BotaoLink href="/gestao/atas/nova">
            <Plus className="h-4 w-4" /> Nova ata
          </BotaoLink>
        ) : null}
      </div>

      <div className="mt-8">
        {atas.length === 0 ? (
          <Vazio mensagem="Nenhuma ata registrada." />
        ) : (
          <Cartao className="divide-y divide-borda overflow-hidden">
            {atas.map((a) => (
              <Link
                key={a.id}
                href={`/gestao/atas/${a.id}`}
                className="flex flex-wrap items-center gap-4 px-5 py-4 hover:bg-azul-50/50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Etiqueta tom={a.status === "aprovada" ? "verde" : "ambar"}>
                      {a.status === "aprovada" ? "Aprovada" : "Rascunho"}
                    </Etiqueta>
                    <Etiqueta tom="cinza">{TIPO_LABEL[a.tipo] ?? a.tipo}</Etiqueta>
                    {a.visivel_voluntarios ? (
                      <Etiqueta tom="azul">Visível a voluntários</Etiqueta>
                    ) : null}
                  </div>
                  <p className="mt-1.5 truncate font-medium text-texto">
                    Ata nº {a.numero}/{a.ano} — {a.titulo}
                  </p>
                  <p className="text-xs text-texto-suave">
                    Reunião de {formatarData(a.data_reuniao)}
                  </p>
                </div>
              </Link>
            ))}
          </Cartao>
        )}
      </div>
    </div>
  );
}
