/**
 * As telas da gestao, num lugar so.
 *
 * Fica fora de `permissoes.ts` porque aquele arquivo e `server-only` e esta
 * lista precisa chegar ao formulario de convite, que roda no cliente.
 *
 * A ordem aqui e a ordem em que aparecem nas telas de permissao.
 */
import type { TelaKey } from "@/lib/auth/permissoes";

export const TELAS: { chave: TelaKey; rotulo: string; grupo: string }[] = [
  { chave: "painel", rotulo: "Painel", grupo: "Geral" },
  { chave: "conteudo", rotulo: "Conteúdo do site", grupo: "Conteúdo" },
  { chave: "atas", rotulo: "Atas de reunião", grupo: "Conteúdo" },
  { chave: "estudos", rotulo: "Área de estudos", grupo: "Conteúdo" },
  { chave: "membros", rotulo: "Membros", grupo: "Financeiro" },
  { chave: "compras", rotulo: "Documentos de compra/venda", grupo: "Financeiro" },
  { chave: "contas_pagar", rotulo: "Contas a pagar", grupo: "Financeiro" },
  { chave: "contas_receber", rotulo: "Contas a receber", grupo: "Financeiro" },
  { chave: "relatorios", rotulo: "Relatórios", grupo: "Financeiro" },
  { chave: "usuarios", rotulo: "Usuários", grupo: "Administração" },
  { chave: "permissoes", rotulo: "Permissões", grupo: "Administração" },
  { chave: "auditoria", rotulo: "Auditoria", grupo: "Administração" },
  { chave: "audiencia", rotulo: "Audiência do site", grupo: "Administração" },
];

export const GRUPOS = ["Geral", "Conteúdo", "Financeiro", "Administração"] as const;
