"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";
import { exigirTela } from "@/lib/auth/permissoes";
import type { Resultado } from "@/lib/gestao/acoes-conteudo";

function texto(dados: FormData, campo: string) {
  const v = dados.get(campo);
  return typeof v === "string" ? v.trim() : "";
}

function numero(dados: FormData, campo: string) {
  const v = texto(dados, campo).replace(/\./g, "").replace(",", ".");
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/* ------------------------------------------------------------------ Membros */

export async function salvarMembro(_estado: Resultado, dados: FormData): Promise<Resultado> {
  await exigirTela("membros", true);
  const supabase = await criarClienteServidor();

  const id = texto(dados, "id");
  const nome = texto(dados, "nome");
  if (!nome) return { erro: "Informe o nome do membro." };

  const registro = {
    nome,
    email: texto(dados, "email") || null,
    telefone: texto(dados, "telefone") || null,
    data_ingresso: texto(dados, "data_ingresso") || null,
    categoria: texto(dados, "categoria") || null,
    ativo: dados.get("ativo") === "on",
    atualizado_em: new Date().toISOString(),
  };

  let membroId = id;
  if (id) {
    const { error } = await supabase.from("membros").update(registro).eq("id", id);
    if (error) return { erro: error.message };
  } else {
    const { data, error } = await supabase.from("membros").insert(registro).select("id").single();
    if (error) return { erro: error.message };
    membroId = data.id as string;
  }

  const valor = numero(dados, "mensalidade_valor");
  const dia = Number(texto(dados, "dia_vencimento") || 10);

  if (valor > 0) {
    const { error } = await supabase.from("membro_mensalidade").upsert({
      membro_id: membroId,
      valor,
      dia_vencimento: Math.min(Math.max(dia, 1), 28),
      ativo: dados.get("mensalidade_ativa") === "on",
      atualizado_em: new Date().toISOString(),
    });
    if (error) return { erro: error.message };
  } else {
    await supabase.from("membro_mensalidade").delete().eq("membro_id", membroId);
  }

  revalidatePath("/gestao/membros");
  redirect("/gestao/membros?salvo=1");
}

export async function excluirMembro(dados: FormData) {
  await exigirTela("membros", true);
  const supabase = await criarClienteServidor();
  await supabase.from("membros").delete().eq("id", String(dados.get("id")));
  revalidatePath("/gestao/membros");
}

/* -------------------------------------------------------------- Documentos */

/**
 * Lança o documento e gera as duplicatas numa única transação (RPC no banco):
 * nunca existe nota sem seus títulos.
 */
export async function lancarDocumento(_estado: Resultado, dados: FormData): Promise<Resultado> {
  await exigirTela("compras", true);
  const supabase = await criarClienteServidor();

  const tipoMovimento = texto(dados, "tipo_movimento") || "entrada";
  const condicao = texto(dados, "condicao") || "avista";
  const dataEmissao = texto(dados, "data_emissao");
  const numeroDoc = texto(dados, "numero");
  const fornecedor = texto(dados, "fornecedor_cliente");

  if (!dataEmissao || !numeroDoc || !fornecedor) {
    return { erro: "Informe data de emissão, número do documento e fornecedor/cliente." };
  }

  // Itens e parcelas chegam como listas paralelas de campos repetidos.
  const descricoes = dados.getAll("item_descricao").map(String);
  const quantidades = dados.getAll("item_quantidade").map(String);
  const unitarios = dados.getAll("item_valor").map(String);

  const itens = descricoes
    .map((d, i) => ({
      descricao_produto: d.trim(),
      quantidade: Number(quantidades[i]?.replace(",", ".") || 0),
      valor_unitario: Number(unitarios[i]?.replace(",", ".") || 0),
    }))
    .filter((i) => i.descricao_produto && i.quantidade > 0 && i.valor_unitario >= 0);

  if (itens.length === 0) return { erro: "Informe ao menos um item com quantidade e valor." };

  const total = itens.reduce((s, i) => s + i.quantidade * i.valor_unitario, 0);

  let parcelas: { vencimento: string; valor: number }[];

  if (condicao === "avista") {
    parcelas = [{ vencimento: texto(dados, "vencimento_avista") || dataEmissao, valor: Number(total.toFixed(2)) }];
  } else {
    const vencimentos = dados.getAll("parcela_vencimento").map(String).filter(Boolean);
    const valores = dados.getAll("parcela_valor").map(String);
    parcelas = vencimentos.map((v, i) => ({
      vencimento: v,
      valor: Number((valores[i]?.replace(",", ".") ?? "0").trim() || 0),
    }));

    if (parcelas.length === 0) return { erro: "Informe as parcelas do documento." };

    const soma = parcelas.reduce((s, p) => s + p.valor, 0);
    if (Math.abs(soma - total) > 0.01) {
      return {
        erro: `A soma das parcelas (${soma.toFixed(2)}) difere do total do documento (${total.toFixed(2)}).`,
      };
    }
  }

  const { error } = await supabase.rpc("lancar_documento", {
    p_tipo_movimento: tipoMovimento,
    p_data_emissao: dataEmissao,
    p_numero: numeroDoc,
    p_fornecedor: fornecedor,
    p_descricao: texto(dados, "descricao") || null,
    p_condicao: condicao,
    p_itens: itens,
    p_parcelas: parcelas,
  });

  if (error) {
    return {
      erro: error.message.includes("duplicate")
        ? "Já existe um documento com esse número para este fornecedor."
        : error.message,
    };
  }

  revalidatePath("/gestao/compras");
  revalidatePath("/gestao/contas-pagar");
  revalidatePath("/gestao/contas-receber");
  redirect("/gestao/compras?salvo=1");
}

export async function excluirDocumento(dados: FormData) {
  await exigirTela("compras", true);
  const supabase = await criarClienteServidor();
  await supabase.from("documentos").delete().eq("id", String(dados.get("id")));
  revalidatePath("/gestao/compras");
  revalidatePath("/gestao/contas-pagar");
  revalidatePath("/gestao/contas-receber");
}

/* ------------------------------------------------------------------ Baixas */

export async function registrarBaixa(_estado: Resultado, dados: FormData): Promise<Resultado> {
  const tipo = texto(dados, "tipo") === "receber" ? "contas_receber" : "contas_pagar";
  await exigirTela(tipo as "contas_pagar" | "contas_receber", true);

  const supabase = await criarClienteServidor();
  const tituloId = texto(dados, "titulo_id");
  const valor = numero(dados, "valor");

  if (!tituloId || valor === 0) return { erro: "Informe o valor da baixa." };

  const { data: usuario } = await supabase.auth.getUser();
  const { error } = await supabase.from("baixas").insert({
    titulo_id: tituloId,
    data: texto(dados, "data") || new Date().toISOString().slice(0, 10),
    valor,
    forma: texto(dados, "forma") || "dinheiro",
    observacao: texto(dados, "observacao") || null,
    registrado_por: usuario.user?.id ?? null,
  });

  if (error) return { erro: error.message };

  revalidatePath("/gestao/contas-pagar");
  revalidatePath("/gestao/contas-receber");
  revalidatePath(`/gestao/titulos/${tituloId}`);
  return { ok: true };
}

/** Estorno é lançamento negativo, nunca edição destrutiva da baixa original. */
export async function estornarBaixa(dados: FormData) {
  const tipo = String(dados.get("tipo")) === "receber" ? "contas_receber" : "contas_pagar";
  await exigirTela(tipo as "contas_pagar" | "contas_receber", true);

  const supabase = await criarClienteServidor();
  const baixaId = String(dados.get("baixa_id"));

  const { data: baixa } = await supabase
    .from("baixas")
    .select("titulo_id, valor")
    .eq("id", baixaId)
    .maybeSingle();
  if (!baixa) return;

  const { data: usuario } = await supabase.auth.getUser();
  await supabase.from("baixas").insert({
    titulo_id: baixa.titulo_id,
    valor: -Number(baixa.valor),
    forma: "estorno",
    observacao: `Estorno da baixa ${baixaId}`,
    registrado_por: usuario.user?.id ?? null,
  });

  revalidatePath("/gestao/contas-pagar");
  revalidatePath("/gestao/contas-receber");
  revalidatePath(`/gestao/titulos/${baixa.titulo_id}`);
}

/* ---------------------------------------------------------- Mensalidades */

export async function gerarMensalidades(dados: FormData) {
  await exigirTela("contas_receber", true);
  const supabase = await criarClienteServidor();

  const competencia = String(dados.get("competencia") ?? "").slice(0, 7);
  if (!competencia) return;

  await supabase.rpc("gerar_mensalidades", { p_competencia: `${competencia}-01` });

  revalidatePath("/gestao/contas-receber");
}

export async function cancelarTitulo(dados: FormData) {
  const tipo = String(dados.get("tipo")) === "receber" ? "contas_receber" : "contas_pagar";
  await exigirTela(tipo as "contas_pagar" | "contas_receber", true);

  const supabase = await criarClienteServidor();
  await supabase.from("titulos").update({ cancelado: true }).eq("id", String(dados.get("id")));

  revalidatePath("/gestao/contas-pagar");
  revalidatePath("/gestao/contas-receber");
}
