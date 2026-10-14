/**
 * As telas da gestao, num lugar so.
 *
 * Fica fora de `permissoes.ts` porque aquele arquivo e `server-only` e esta
 * lista precisa chegar ao formulario de convite, que roda no cliente.
 *
 * A ordem aqui e a ordem em que aparecem nas grades de permissao.
 */
import type { TelaKey } from "@/lib/auth/permissoes";

/**
 * Areas que agrupam varias telas. A chave da area nao e marcada a mao: ela
 * fica liberada para quem tiver qualquer tela de dentro (ver obterSessao).
 * Por isso nao aparece nas grades — so as telas de dentro aparecem.
 */
export const AREAS: Partial<Record<TelaKey, TelaKey[]>> = {
  conteudo: [
    "conteudo_noticias",
    "conteudo_mensagens",
    "conteudo_eventos",
    "conteudo_projetos",
    "conteudo_paginas",
    "conteudo_livro",
  ],
  estudos: ["estudos_turmas", "estudos_alunos"],
};

export const TELAS: { chave: TelaKey; rotulo: string; grupo: string }[] = [
  { chave: "painel", rotulo: "Painel", grupo: "Geral" },

  { chave: "conteudo_noticias", rotulo: "Notícias", grupo: "Conteúdo do site" },
  { chave: "conteudo_mensagens", rotulo: "Mensagem do dia", grupo: "Conteúdo do site" },
  { chave: "conteudo_eventos", rotulo: "Eventos", grupo: "Conteúdo do site" },
  { chave: "conteudo_projetos", rotulo: "Projetos", grupo: "Conteúdo do site" },
  { chave: "conteudo_paginas", rotulo: "Páginas institucionais", grupo: "Conteúdo do site" },
  { chave: "conteudo_livro", rotulo: "Livro dos Espíritos", grupo: "Conteúdo do site" },

  { chave: "atas", rotulo: "Atas de reunião", grupo: "Secretaria" },
  { chave: "estudos_turmas", rotulo: "Turmas, aulas e chamada", grupo: "Secretaria" },
  { chave: "estudos_alunos", rotulo: "Alunos e históricos", grupo: "Secretaria" },

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

export const GRUPOS = [
  "Geral",
  "Conteúdo do site",
  "Secretaria",
  "Financeiro",
  "Administração",
] as const;
