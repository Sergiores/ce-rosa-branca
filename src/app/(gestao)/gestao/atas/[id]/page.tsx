import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Lock, Undo2 } from "lucide-react";
import {
  AreaTexto, Campo, Cartao, CartaoCorpo, Etiqueta, Rotulo, Selecao,
} from "@/components/ui";
import { FormularioConteudo } from "@/components/gestao/Formulario";
import { Anexos } from "@/components/gestao/Anexos";
import { BotaoExcluir } from "@/components/gestao/BotaoExcluir";
import { formatarData, formatarDataHora } from "@/lib/datas";
import { exigirTela } from "@/lib/auth/permissoes";
import { criarClienteServidor } from "@/lib/supabase/server";
import { excluirAta, proximoNumeroAta, reabrirAta, salvarAta } from "@/lib/gestao/acoes-atas";
import type { Ata } from "@/lib/tipos";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Ata de reunião" };

export default async function FormAta({ params }: { params: Promise<{ id: string }> }) {
  const sessao = await exigirTela("atas");
  const { id } = await params;
  const nova = id === "nova";
  const podeEditar = sessao.podeEditar("atas");

  let ata: Ata | null = null;
  if (!nova) {
    const supabase = await criarClienteServidor();
    const { data } = await supabase.from("atas").select("*").eq("id", id).maybeSingle();
    if (!data) notFound();
    ata = data as Ata;
  }

  const anoAtual = new Date().getFullYear();
  const numeroSugerido = nova ? await proximoNumeroAta(anoAtual) : ata!.numero;
  const aprovada = ata?.status === "aprovada";

  async function reabrir() {
    "use server";
    await reabrirAta(id);
  }

  async function excluir(dados: FormData) {
    "use server";
    await excluirAta(String(dados.get("id")));
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/gestao/atas"
        className="inline-flex items-center gap-1 text-sm font-medium text-marca-700 hover:text-marca-800"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar às atas
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-texto">
          {nova ? "Nova ata" : `Ata nº ${ata!.numero}/${ata!.ano}`}
        </h1>
        {ata ? (
          <Etiqueta tom={aprovada ? "verde" : "ambar"}>
            {aprovada ? "Aprovada" : "Rascunho"}
          </Etiqueta>
        ) : null}
      </div>

      {aprovada ? (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <p className="flex items-center gap-2 text-sm text-emerald-800">
            <Lock className="h-4 w-4" />
            Aprovada em {formatarDataHora(ata!.aprovada_em)} — somente leitura.
          </p>
          {podeEditar ? (
            <form action={reabrir}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-white px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
              >
                <Undo2 className="h-4 w-4" /> Reabrir para correção
              </button>
            </form>
          ) : null}
        </div>
      ) : null}

      <Cartao className="mt-6">
        <CartaoCorpo className="sm:p-8">
          {aprovada || !podeEditar ? (
            <div className="space-y-5">
              <Leitura rotulo="Título" valor={ata!.titulo} />
              <Leitura rotulo="Data da reunião" valor={formatarData(ata!.data_reuniao)} />
              <Leitura rotulo="Tipo" valor={ata!.tipo} />
              <Leitura rotulo="Participantes" valor={ata!.participantes} />
              <Leitura rotulo="Pauta" valor={ata!.pauta} />
              <Leitura rotulo="Deliberações" valor={ata!.deliberacoes} />
            </div>
          ) : (
            <FormularioConteudo acao={salvarAta} rotuloPublicar="Aprovar ata">
              {ata ? <input type="hidden" name="id" value={ata.id} /> : null}

              <div className="grid gap-5 sm:grid-cols-[7rem_7rem_1fr]">
                <div>
                  <Rotulo htmlFor="numero">Número</Rotulo>
                  <Campo id="numero" name="numero" type="number" required defaultValue={numeroSugerido} />
                </div>
                <div>
                  <Rotulo htmlFor="ano">Ano</Rotulo>
                  <Campo id="ano" name="ano" type="number" required defaultValue={ata?.ano ?? anoAtual} />
                </div>
                <div>
                  <Rotulo htmlFor="data_reuniao">Data da reunião</Rotulo>
                  <Campo
                    id="data_reuniao"
                    name="data_reuniao"
                    type="date"
                    required
                    defaultValue={ata?.data_reuniao ?? new Date().toISOString().slice(0, 10)}
                  />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-[1fr_14rem]">
                <div>
                  <Rotulo htmlFor="titulo">Título</Rotulo>
                  <Campo id="titulo" name="titulo" required defaultValue={ata?.titulo ?? ""} />
                </div>
                <div>
                  <Rotulo htmlFor="tipo">Tipo de reunião</Rotulo>
                  <Selecao id="tipo" name="tipo" defaultValue={ata?.tipo ?? "ordinaria"}>
                    <option value="ordinaria">Ordinária</option>
                    <option value="extraordinaria">Extraordinária</option>
                    <option value="assembleia">Assembleia</option>
                  </Selecao>
                </div>
              </div>

              <div>
                <Rotulo htmlFor="participantes">Participantes</Rotulo>
                <AreaTexto
                  id="participantes"
                  name="participantes"
                  rows={3}
                  defaultValue={ata?.participantes ?? ""}
                />
              </div>

              <div>
                <Rotulo htmlFor="pauta">Pauta</Rotulo>
                <AreaTexto id="pauta" name="pauta" rows={5} defaultValue={ata?.pauta ?? ""} />
              </div>

              <div>
                <Rotulo htmlFor="deliberacoes">Deliberações</Rotulo>
                <AreaTexto
                  id="deliberacoes"
                  name="deliberacoes"
                  rows={8}
                  defaultValue={ata?.deliberacoes ?? ""}
                />
              </div>

              <label className="flex items-center gap-3 rounded-xl border border-borda bg-white px-4 py-3">
                <input
                  type="checkbox"
                  name="visivel_voluntarios"
                  defaultChecked={ata?.visivel_voluntarios ?? false}
                  className="h-4 w-4 rounded border-borda text-marca-600 focus:ring-marca-400"
                />
                <span className="text-sm text-texto">Permitir que voluntários vejam esta ata</span>
              </label>
            </FormularioConteudo>
          )}
        </CartaoCorpo>
      </Cartao>

      {ata ? (
        <Cartao className="mt-6">
          <CartaoCorpo className="sm:p-8">
            <Anexos entidade="ata" entidadeId={ata.id} somenteLeitura={!podeEditar} />
          </CartaoCorpo>
        </Cartao>
      ) : null}

      {ata && podeEditar && !aprovada ? (
        <div className="mt-6">
          <BotaoExcluir
            acao={excluir}
            id={ata.id}
            comTexto="Excluir esta ata"
            mensagem={`Excluir a ata nº ${ata.numero}/${ata.ano} e seus anexos? Esta ação não pode ser desfeita.`}
          />
        </div>
      ) : null}
    </div>
  );
}

function Leitura({ rotulo, valor }: { rotulo: string; valor: string | null }) {
  return (
    <div>
      <p className="text-sm font-medium text-texto-suave">{rotulo}</p>
      <p className="mt-1 whitespace-pre-line text-texto">{valor || "—"}</p>
    </div>
  );
}
