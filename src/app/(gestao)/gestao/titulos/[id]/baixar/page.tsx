import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PaginaManutencao } from "@/components/gestao/PaginaManutencao";
import { FormularioBaixa } from "../FormularioBaixa";
import { formatarMoeda } from "@/lib/utils";
import { formatarData } from "@/lib/datas";
import { exigirTela } from "@/lib/auth/permissoes";
import { criarClienteServidor } from "@/lib/supabase/server";
import type { TituloComSaldo } from "@/lib/tipos";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Registrar baixa" };

export default async function BaixarTitulo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await criarClienteServidor();
  const { data } = await supabase.from("v_titulos_saldo").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const titulo = data as TituloComSaldo;

  // A tela é a mesma para pagar e receber; a permissão não.
  await exigirTela(titulo.tipo === "pagar" ? "contas_pagar" : "contas_receber", true);

  const quitado = Number(titulo.saldo) <= 0.005 || titulo.cancelado;
  if (quitado) notFound();

  return (
    <PaginaManutencao
      voltarHref={`/gestao/titulos/${id}`}
      voltarRotulo={titulo.descricao}
      titulo={`Registrar ${titulo.tipo === "pagar" ? "pagamento" : "recebimento"}`}
      descricao={`Saldo devedor de ${formatarMoeda(titulo.saldo)} · vencimento em ${formatarData(titulo.vencimento)}.`}
    >
      <FormularioBaixa tituloId={titulo.id} tipo={titulo.tipo} saldo={Number(titulo.saldo)} />
    </PaginaManutencao>
  );
}
