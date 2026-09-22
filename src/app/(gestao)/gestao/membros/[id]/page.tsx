import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { Campo, Cartao, CartaoCorpo, Etiqueta, Rotulo, Vazio } from "@/components/ui";
import { FormularioConteudo } from "@/components/gestao/Formulario";
import { SeletorPessoa } from "@/components/gestao/SeletorPessoa";
import { BotaoExcluir } from "@/components/gestao/BotaoExcluir";
import { formatarData } from "@/lib/datas";
import { formatarMoeda } from "@/lib/utils";
import { exigirTela } from "@/lib/auth/permissoes";
import { criarClienteServidor } from "@/lib/supabase/server";
import { excluirMembro, salvarMembro } from "@/lib/gestao/acoes-financeiro";
import { pessoasVinculaveis } from "@/lib/gestao/estudos";
import type { Membro, StatusTitulo, TituloComSaldo } from "@/lib/tipos";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Membro" };

const TOM: Record<StatusTitulo, "verde" | "ambar" | "vermelho" | "marca" | "cinza"> = {
  pago: "verde", parcial: "marca", aberto: "ambar", vencido: "vermelho", cancelado: "cinza",
};
const ROTULO: Record<StatusTitulo, string> = {
  pago: "Pago", parcial: "Parcial", aberto: "Em aberto", vencido: "Vencido", cancelado: "Cancelado",
};

type Mensalidade = { membro_id: string; valor: number; dia_vencimento: number; ativo: boolean };

export default async function EditorMembro({ params }: { params: Promise<{ id: string }> }) {
  const sessao = await exigirTela("membros");
  const podeEditar = sessao.podeEditar("membros");
  const { id } = await params;
  const novo = id === "novo";

  let membro: Membro | null = null;
  let mensalidade: Mensalidade | null = null;
  let titulos: TituloComSaldo[] = [];

  // Só no cadastro novo: trocar a conta de um membro existente mexeria em
  // quem enxerga o quê, sem aviso.
  const pessoas = novo && podeEditar ? await pessoasVinculaveis("membro") : [];

  if (!novo) {
    const supabase = await criarClienteServidor();
    const { data } = await supabase.from("membros").select("*").eq("id", id).maybeSingle();
    if (!data) notFound();
    membro = data as Membro;

    const [{ data: mens }, { data: lista }] = await Promise.all([
      supabase.from("membro_mensalidade").select("*").eq("membro_id", id).maybeSingle(),
      supabase
        .from("v_titulos_saldo")
        .select("*")
        .eq("membro_id", id)
        .order("vencimento", { ascending: false })
        .limit(24),
    ]);
    mensalidade = (mens as Mensalidade) ?? null;
    titulos = (lista ?? []) as TituloComSaldo[];
  }

  const emAberto = titulos
    .filter((t) => t.status !== "pago" && t.status !== "cancelado")
    .reduce((s, t) => s + Number(t.saldo), 0);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/gestao/membros"
        className="inline-flex items-center gap-1 text-sm font-medium text-marca-700 hover:text-marca-800"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar aos membros
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-texto">
          {novo ? "Novo membro" : membro!.nome}
        </h1>
        {membro && !membro.ativo ? <Etiqueta tom="cinza">Inativo</Etiqueta> : null}
        {emAberto > 0 ? (
          <Etiqueta tom="ambar">{formatarMoeda(emAberto)} em aberto</Etiqueta>
        ) : null}
      </div>

      <Cartao className="mt-6">
        <CartaoCorpo className="sm:p-8">
          <FormularioConteudo
            acao={salvarMembro}
            rotuloPublicar="Salvar membro"
            mostrarRascunho={false}
          >
            {membro ? <input type="hidden" name="id" value={membro.id} /> : null}

            {novo ? <SeletorPessoa pessoas={pessoas} /> : null}

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Rotulo htmlFor="nome">Nome</Rotulo>
                <Campo id="nome" name="nome" required defaultValue={membro?.nome ?? ""} />
              </div>
              <div>
                <Rotulo htmlFor="categoria">Categoria</Rotulo>
                <Campo
                  id="categoria"
                  name="categoria"
                  placeholder="Efetivo, contribuinte..."
                  defaultValue={membro?.categoria ?? ""}
                />
              </div>
              <div>
                <Rotulo htmlFor="email">E-mail</Rotulo>
                <Campo id="email" name="email" type="email" defaultValue={membro?.email ?? ""} />
              </div>
              <div>
                <Rotulo htmlFor="telefone">Telefone</Rotulo>
                <Campo id="telefone" name="telefone" defaultValue={membro?.telefone ?? ""} />
              </div>
              <div>
                <Rotulo htmlFor="data_ingresso">Data de ingresso</Rotulo>
                <Campo
                  id="data_ingresso"
                  name="data_ingresso"
                  type="date"
                  defaultValue={membro?.data_ingresso ?? ""}
                />
              </div>
            </div>

            <label className="flex items-center gap-3 rounded-xl border border-borda bg-white px-4 py-3">
              <input
                type="checkbox"
                name="ativo"
                defaultChecked={membro?.ativo ?? true}
                className="h-4 w-4 rounded border-borda text-marca-600 focus:ring-marca-400"
              />
              <span className="text-sm text-texto">Membro ativo</span>
            </label>

            <div className="rounded-2xl border border-marca-200 bg-marca-50/60 p-5">
              <h3 className="mb-4 text-sm font-semibold text-marca-800">Mensalidade</h3>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <Rotulo htmlFor="mensalidade_valor">Valor mensal (R$)</Rotulo>
                  <Campo
                    id="mensalidade_valor"
                    name="mensalidade_valor"
                    inputMode="decimal"
                    placeholder="0,00"
                    defaultValue={mensalidade?.valor ?? ""}
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
                    defaultValue={mensalidade?.dia_vencimento ?? 10}
                  />
                </div>
              </div>
              <label className="mt-4 flex items-center gap-3">
                <input
                  type="checkbox"
                  name="mensalidade_ativa"
                  defaultChecked={mensalidade?.ativo ?? true}
                  className="h-4 w-4 rounded border-borda text-marca-600 focus:ring-marca-400"
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

      {/* Extrato do membro */}
      {membro ? (
        <Cartao className="mt-6 overflow-x-auto">
          <CartaoCorpo className="p-0">
            <h2 className="border-b border-borda px-6 py-4 font-semibold text-texto">
              Últimos títulos
            </h2>
            {titulos.length === 0 ? (
              <div className="p-6">
                <Vazio mensagem="Nenhum título lançado para este membro." />
              </div>
            ) : (
              <table className="w-full min-w-[34rem] text-sm">
                <thead>
                  <tr className="border-b border-borda bg-marca-50/60 text-left">
                    <th className="w-28 px-6 py-3 font-semibold text-texto">Vencimento</th>
                    <th className="px-4 py-3 font-semibold text-texto">Descrição</th>
                    <th className="w-28 px-4 py-3 text-right font-semibold text-texto">Valor</th>
                    <th className="w-32 px-4 py-3 font-semibold text-texto">Situação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borda">
                  {titulos.map((t) => (
                    <tr key={t.id} className="hover:bg-marca-50/40">
                      <td className="px-6 py-3">
                        <Link href={`/gestao/titulos/${t.id}`} className="font-medium text-marca-700">
                          {formatarData(t.vencimento)}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-texto">{t.descricao}</td>
                      <td className="px-4 py-3 text-right text-texto">{formatarMoeda(t.valor)}</td>
                      <td className="px-4 py-3">
                        <Etiqueta tom={TOM[t.status]}>{ROTULO[t.status]}</Etiqueta>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CartaoCorpo>
        </Cartao>
      ) : null}

      {membro && podeEditar ? (
        <div className="mt-6">
          <BotaoExcluir
            acao={excluirMembro}
            id={membro.id}
            comTexto="Excluir este membro"
            mensagem={`Excluir o membro ${membro.nome}? Os títulos já lançados permanecem, sem vínculo. Esta ação não pode ser desfeita.`}
          />
        </div>
      ) : null}
    </div>
  );
}
