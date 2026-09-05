import Link from "next/link";
import type { Metadata } from "next";
import { Pencil } from "lucide-react";
import { Cartao, Etiqueta, Vazio } from "@/components/ui";
import { BotaoExcluir } from "@/components/gestao/BotaoExcluir";
import { CabecalhoLista, FiltrosLista, Paginacao } from "@/components/gestao/Lista";
import { formatarData } from "@/lib/datas";
import { formatarMoeda } from "@/lib/utils";
import { exigirTela } from "@/lib/auth/permissoes";
import { criarClienteServidor } from "@/lib/supabase/server";
import { excluirMembro } from "@/lib/gestao/acoes-financeiro";
import type { Membro } from "@/lib/tipos";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Membros" };

const BASE = "/gestao/membros";
const POR_PAGINA = 25;

type Mensalidade = { membro_id: string; valor: number; dia_vencimento: number; ativo: boolean };

export default async function ListaMembros({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; pagina?: string }>;
}) {
  const sessao = await exigirTela("membros");
  const podeEditar = sessao.podeEditar("membros");

  const filtros = await searchParams;
  const busca = filtros.q?.trim() ?? "";
  const status = filtros.status ?? "";
  const pagina = Math.max(1, Number(filtros.pagina ?? 1) || 1);

  const supabase = await criarClienteServidor();
  let consulta = supabase
    .from("membros")
    .select("*", { count: "exact" })
    .order("nome")
    .range((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA - 1);

  if (status === "ativo") consulta = consulta.eq("ativo", true);
  if (status === "inativo") consulta = consulta.eq("ativo", false);
  if (busca) {
    const alvo = busca.replace(/[%,()]/g, " ");
    consulta = consulta.or(
      `nome.ilike.%${alvo}%,email.ilike.%${alvo}%,telefone.ilike.%${alvo}%,categoria.ilike.%${alvo}%`,
    );
  }

  const { data, count } = await consulta;
  const membros = (data ?? []) as Membro[];
  const total = count ?? 0;

  const { data: dadosMensalidades } = await supabase.from("membro_mensalidade").select("*");
  const mensalidades = (dadosMensalidades ?? []) as Mensalidade[];

  const { count: totalAtivos } = await supabase
    .from("membros")
    .select("id", { count: "exact", head: true })
    .eq("ativo", true);

  return (
    <div className="mx-auto max-w-5xl">
      <CabecalhoLista
        titulo="Membros"
        descricao={`${total} cadastrados · ${totalAtivos ?? 0} ativos. Dados restritos à diretoria.`}
        novoHref={`${BASE}/novo`}
        novoRotulo="Novo membro"
        podeEditar={podeEditar}
      />

      <FiltrosLista
        base={BASE}
        busca={busca}
        status={status}
        rotuloStatus="Situação"
        opcoesStatus={[
          { valor: "", rotulo: "Todos" },
          { valor: "ativo", rotulo: "Ativos" },
          { valor: "inativo", rotulo: "Inativos" },
        ]}
        placeholder="Nome, e-mail, telefone ou categoria"
      />

      <div className="mt-6">
        {membros.length === 0 ? (
          <Vazio
            mensagem={
              busca || status
                ? "Nenhum membro para os filtros escolhidos."
                : "Nenhum membro cadastrado."
            }
          />
        ) : (
          <Cartao className="overflow-x-auto">
            <table className="w-full min-w-[46rem] text-sm">
              <thead>
                <tr className="border-b border-borda bg-azul-50/60 text-left">
                  <th className="px-5 py-3 font-semibold text-texto">Membro</th>
                  <th className="w-36 px-4 py-3 font-semibold text-texto">Ingresso</th>
                  <th className="w-44 px-4 py-3 font-semibold text-texto">Mensalidade</th>
                  {podeEditar ? <th className="w-24 px-4 py-3" /> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                {membros.map((m) => {
                  const mensalidade = mensalidades.find((x) => x.membro_id === m.id);
                  return (
                    <tr key={m.id} className="align-top hover:bg-azul-50/40">
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`${BASE}/${m.id}`}
                            className="font-medium text-texto hover:text-azul-700"
                          >
                            {m.nome}
                          </Link>
                          {!m.ativo ? <Etiqueta tom="cinza">Inativo</Etiqueta> : null}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-texto-suave">
                          {m.email ?? "sem e-mail"}
                          {m.categoria ? ` · ${m.categoria}` : ""}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-texto-suave">
                        {m.data_ingresso ? formatarData(m.data_ingresso) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {mensalidade && mensalidade.ativo ? (
                          <Etiqueta tom="azul">
                            {formatarMoeda(mensalidade.valor)} · dia {mensalidade.dia_vencimento}
                          </Etiqueta>
                        ) : (
                          <span className="text-texto-suave">—</span>
                        )}
                      </td>
                      {podeEditar ? (
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`${BASE}/${m.id}`}
                              aria-label="Editar"
                              title="Editar"
                              className="grid h-9 w-9 place-items-center rounded-full text-azul-700 hover:bg-azul-100"
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>
                            <BotaoExcluir
                              acao={excluirMembro}
                              id={m.id}
                              rotulo="Excluir membro"
                              mensagem={`Excluir o membro ${m.nome}? Os títulos já lançados para ele permanecem, sem vínculo. Esta ação não pode ser desfeita.`}
                            />
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
        filtros={{ q: busca, status }}
      />
    </div>
  );
}
