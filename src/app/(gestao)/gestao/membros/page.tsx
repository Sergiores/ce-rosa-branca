import type { Metadata } from "next";
import { Trash2 } from "lucide-react";
import { Campo, Cartao, CartaoCorpo, Etiqueta, Rotulo, Vazio } from "@/components/ui";
import { FormularioConteudo } from "@/components/gestao/Formulario";
import { formatarData } from "@/lib/datas";
import { formatarMoeda } from "@/lib/utils";
import { exigirTela } from "@/lib/auth/permissoes";
import { criarClienteServidor } from "@/lib/supabase/server";
import { excluirMembro, salvarMembro } from "@/lib/gestao/acoes-financeiro";
import type { Membro } from "@/lib/tipos";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Membros" };

type Mensalidade = { membro_id: string; valor: number; dia_vencimento: number; ativo: boolean };

export default async function PaginaMembros({
  searchParams,
}: {
  searchParams: Promise<{ editar?: string }>;
}) {
  const sessao = await exigirTela("membros");
  const podeEditar = sessao.podeEditar("membros");
  const { editar } = await searchParams;

  const supabase = await criarClienteServidor();
  const [{ data: dadosMembros }, { data: dadosMensalidades }] = await Promise.all([
    supabase.from("membros").select("*").order("nome"),
    supabase.from("membro_mensalidade").select("*"),
  ]);

  const membros = (dadosMembros ?? []) as Membro[];
  const mensalidades = (dadosMensalidades ?? []) as Mensalidade[];
  const emEdicao = membros.find((m) => m.id === editar);
  const mensalidadeAtual = mensalidades.find((m) => m.membro_id === emEdicao?.id);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold tracking-tight text-texto">Membros</h1>
      <p className="mt-1 text-texto-suave">
        Cadastro e valor da mensalidade. Dados restritos à diretoria.
      </p>

      {podeEditar ? (
        <Cartao className="mt-8">
          <CartaoCorpo className="sm:p-8">
            <h2 className="mb-5 font-semibold text-texto">
              {emEdicao ? "Editar membro" : "Novo membro"}
            </h2>

            <FormularioConteudo
              acao={salvarMembro}
              key={emEdicao?.id ?? "novo"}
              rotuloPublicar="Salvar membro"
              mostrarRascunho={false}
            >
              {emEdicao ? <input type="hidden" name="id" value={emEdicao.id} /> : null}

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <Rotulo htmlFor="nome">Nome</Rotulo>
                  <Campo id="nome" name="nome" required defaultValue={emEdicao?.nome ?? ""} />
                </div>
                <div>
                  <Rotulo htmlFor="categoria">Categoria</Rotulo>
                  <Campo
                    id="categoria"
                    name="categoria"
                    placeholder="Efetivo, contribuinte..."
                    defaultValue={emEdicao?.categoria ?? ""}
                  />
                </div>
                <div>
                  <Rotulo htmlFor="email">E-mail</Rotulo>
                  <Campo id="email" name="email" type="email" defaultValue={emEdicao?.email ?? ""} />
                </div>
                <div>
                  <Rotulo htmlFor="telefone">Telefone</Rotulo>
                  <Campo id="telefone" name="telefone" defaultValue={emEdicao?.telefone ?? ""} />
                </div>
                <div>
                  <Rotulo htmlFor="data_ingresso">Data de ingresso</Rotulo>
                  <Campo
                    id="data_ingresso"
                    name="data_ingresso"
                    type="date"
                    defaultValue={emEdicao?.data_ingresso ?? ""}
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 rounded-xl border border-borda bg-white px-4 py-3">
                <input
                  type="checkbox"
                  name="ativo"
                  defaultChecked={emEdicao?.ativo ?? true}
                  className="h-4 w-4 rounded border-borda text-azul-600 focus:ring-azul-400"
                />
                <span className="text-sm text-texto">Membro ativo</span>
              </label>

              <div className="rounded-2xl border border-azul-200 bg-azul-50/60 p-5">
                <h3 className="mb-4 text-sm font-semibold text-azul-800">Mensalidade</h3>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <Rotulo htmlFor="mensalidade_valor">Valor mensal (R$)</Rotulo>
                    <Campo
                      id="mensalidade_valor"
                      name="mensalidade_valor"
                      inputMode="decimal"
                      placeholder="0,00"
                      defaultValue={mensalidadeAtual?.valor ?? ""}
                    />
                  </div>
                  <div>
                    <Rotulo htmlFor="dia_vencimento">Dia do vencimento</Rotulo>
                    <Campo
                      id="dia_vencimento"
                      name="dia_vencimento"
                      type="number"
                      min={1}
                      max={28}
                      defaultValue={mensalidadeAtual?.dia_vencimento ?? 10}
                    />
                  </div>
                </div>
                <label className="mt-4 flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="mensalidade_ativa"
                    defaultChecked={mensalidadeAtual?.ativo ?? true}
                    className="h-4 w-4 rounded border-borda text-azul-600 focus:ring-azul-400"
                  />
                  <span className="text-sm text-texto">
                    Gerar mensalidade para este membro no lote mensal
                  </span>
                </label>
                <p className="mt-3 text-xs text-texto-suave">
                  Deixe o valor em branco (ou zero) para não gerar mensalidade.
                </p>
              </div>
            </FormularioConteudo>
          </CartaoCorpo>
        </Cartao>
      ) : null}

      <h2 className="mb-4 mt-10 font-semibold text-texto">
        Membros cadastrados ({membros.length})
      </h2>

      {membros.length === 0 ? (
        <Vazio mensagem="Nenhum membro cadastrado." />
      ) : (
        <Cartao className="divide-y divide-borda overflow-hidden">
          {membros.map((m) => {
            const mensalidade = mensalidades.find((x) => x.membro_id === m.id);
            return (
              <div key={m.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium text-texto">{m.nome}</p>
                    {!m.ativo ? <Etiqueta tom="cinza">Inativo</Etiqueta> : null}
                    {mensalidade && mensalidade.ativo ? (
                      <Etiqueta tom="azul">
                        {formatarMoeda(mensalidade.valor)} · dia {mensalidade.dia_vencimento}
                      </Etiqueta>
                    ) : null}
                  </div>
                  <p className="text-xs text-texto-suave">
                    {m.email ?? "sem e-mail"}
                    {m.data_ingresso ? ` · desde ${formatarData(m.data_ingresso)}` : ""}
                  </p>
                </div>

                {podeEditar ? (
                  <div className="flex items-center gap-2">
                    <a
                      href={`/gestao/membros?editar=${m.id}`}
                      className="rounded-full px-4 py-2 text-sm font-medium text-azul-700 hover:bg-azul-50"
                    >
                      Editar
                    </a>
                    <form action={excluirMembro}>
                      <input type="hidden" name="id" value={m.id} />
                      <button
                        type="submit"
                        aria-label="Excluir"
                        className="grid h-9 w-9 place-items-center rounded-full text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                ) : null}
              </div>
            );
          })}
        </Cartao>
      )}
    </div>
  );
}
