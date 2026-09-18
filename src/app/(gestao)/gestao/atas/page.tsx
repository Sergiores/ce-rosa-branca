import Link from "next/link";
import type { Metadata } from "next";
import { Eye, Pencil } from "lucide-react";
import { Campo, Cartao, Etiqueta, Rotulo, Vazio } from "@/components/ui";
import { BotaoExcluir } from "@/components/gestao/BotaoExcluir";
import { CabecalhoLista, FiltrosLista, Paginacao } from "@/components/gestao/Lista";
import { formatarData } from "@/lib/datas";
import { exigirTela } from "@/lib/auth/permissoes";
import { criarClienteServidor } from "@/lib/supabase/server";
import { excluirAtaDaLista } from "@/lib/gestao/acoes-atas";
import type { Ata } from "@/lib/tipos";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Atas de reunião" };

const BASE = "/gestao/atas";
const POR_PAGINA = 20;

const TIPO_LABEL: Record<string, string> = {
  ordinaria: "Ordinária",
  extraordinaria: "Extraordinária",
  assembleia: "Assembleia",
};

export default async function ListaAtas({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string; status?: string; tipo?: string; ano?: string; pagina?: string;
  }>;
}) {
  const sessao = await exigirTela("atas");
  const podeEditar = sessao.podeEditar("atas");

  const filtros = await searchParams;
  const busca = filtros.q?.trim() ?? "";
  const status = filtros.status ?? "";
  const ano = filtros.ano ?? "";
  const pagina = Math.max(1, Number(filtros.pagina ?? 1) || 1);

  const supabase = await criarClienteServidor();
  let consulta = supabase
    .from("atas")
    .select("*", { count: "exact" })
    .order("ano", { ascending: false })
    .order("numero", { ascending: false })
    .range((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA - 1);

  if (status === "rascunho" || status === "aprovada") consulta = consulta.eq("status", status);
  if (ano && Number.isInteger(Number(ano))) consulta = consulta.eq("ano", Number(ano));
  if (busca) {
    const numero = Number(busca);
    const alvo = busca.replace(/[%,()]/g, " ");
    const campos = `titulo.ilike.%${alvo}%,pauta.ilike.%${alvo}%,deliberacoes.ilike.%${alvo}%,participantes.ilike.%${alvo}%`;
    consulta = Number.isInteger(numero)
      ? consulta.or(`numero.eq.${numero},${campos}`)
      : consulta.or(campos);
  }

  const { data, count } = await consulta;
  const atas = (data ?? []) as Ata[];
  const total = count ?? 0;

  const [{ count: totalGeral }, { count: totalAprovadas }] = await Promise.all([
    supabase.from("atas").select("id", { count: "exact", head: true }),
    supabase.from("atas").select("id", { count: "exact", head: true }).eq("status", "aprovada"),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <CabecalhoLista
        titulo="Atas de reunião"
        descricao={`${totalGeral ?? 0} registradas · ${totalAprovadas ?? 0} aprovadas. Ata aprovada fica somente leitura.`}
        novoHref={`${BASE}/nova`}
        novoRotulo="Nova ata"
        podeEditar={podeEditar}
      />

      <FiltrosLista
        base={BASE}
        busca={busca}
        status={status}
        rotuloStatus="Situação"
        opcoesStatus={[
          { valor: "", rotulo: "Todas" },
          { valor: "rascunho", rotulo: "Rascunhos" },
          { valor: "aprovada", rotulo: "Aprovadas" },
        ]}
        placeholder="Número, título, pauta, deliberações ou participante"
      >
        <div>
          <Rotulo htmlFor="ano">Ano</Rotulo>
          <Campo
            id="ano"
            name="ano"
            type="number"
            placeholder="todos"
            defaultValue={ano}
            className="sm:w-28"
          />
        </div>
      </FiltrosLista>

      <div className="mt-6">
        {atas.length === 0 ? (
          <Vazio
            mensagem={
              busca || status || ano
                ? "Nenhuma ata para os filtros escolhidos."
                : "Nenhuma ata registrada."
            }
          />
        ) : (
          <Cartao className="overflow-x-auto">
            <table className="w-full min-w-[48rem] text-sm">
              <thead>
                <tr className="border-b border-borda bg-marca-50/60 text-left">
                  <th className="w-24 px-5 py-3 font-semibold text-texto">Nº</th>
                  <th className="px-4 py-3 font-semibold text-texto">Ata</th>
                  <th className="w-32 px-4 py-3 font-semibold text-texto">Reunião</th>
                  <th className="w-44 px-4 py-3 font-semibold text-texto">Situação</th>
                  {podeEditar ? <th className="w-24 px-4 py-3" /> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                {atas.map((a) => {
                  const aprovada = a.status === "aprovada";
                  return (
                    <tr key={a.id} className="align-top hover:bg-marca-50/40">
                      <td className="px-5 py-3 font-medium text-marca-700">
                        <Link href={`${BASE}/${a.id}`}>
                          {a.numero}/{a.ano}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`${BASE}/${a.id}`}
                          className="line-clamp-2 font-medium text-texto hover:text-marca-700"
                        >
                          {a.titulo}
                        </Link>
                        <p className="mt-0.5 text-xs text-texto-suave">
                          {TIPO_LABEL[a.tipo] ?? a.tipo}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-texto-suave">
                        {formatarData(a.data_reuniao)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Etiqueta tom={aprovada ? "verde" : "ambar"}>
                            {aprovada ? "Aprovada" : "Rascunho"}
                          </Etiqueta>
                          {a.visivel_voluntarios ? (
                            <Etiqueta tom="marca">Voluntários</Etiqueta>
                          ) : null}
                        </div>
                      </td>
                      {podeEditar ? (
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`${BASE}/${a.id}`}
                              aria-label={aprovada ? "Ver ata" : "Editar"}
                              title={aprovada ? "Ver ata" : "Editar"}
                              className="grid h-9 w-9 place-items-center rounded-full text-marca-700 hover:bg-marca-100"
                            >
                              {aprovada ? (
                                <Eye className="h-4 w-4" />
                              ) : (
                                <Pencil className="h-4 w-4" />
                              )}
                            </Link>

                            {/* Ata aprovada só é excluída depois de reaberta, na própria tela dela. */}
                            {!aprovada ? (
                              <BotaoExcluir
                                acao={excluirAtaDaLista}
                                id={a.id}
                                rotulo="Excluir ata"
                                mensagem={`Excluir a ata nº ${a.numero}/${a.ano} e seus anexos? Esta ação não pode ser desfeita.`}
                              />
                            ) : null}
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Cartao>
        )}
      </div>

      <Paginacao
        base={BASE}
        pagina={pagina}
        total={total}
        porPagina={POR_PAGINA}
        filtros={{ q: busca, status, ano }}
      />
    </div>
  );
}
