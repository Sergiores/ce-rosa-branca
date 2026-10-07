import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatarMoeda(valor: number | string) {
  const n = typeof valor === "string" ? Number(valor) : valor;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(n) ? n : 0);
}

/**
 * Quebra um texto de textarea em paragrafos.
 *
 * Normaliza CRLF antes de dividir: o textarea manda `\r\n` em Windows, entao
 * uma regex de `\n{2,}` nao encontra a linha em branco e o texto inteiro sai
 * como um paragrafo so. As quebras simples que sobram dentro de cada paragrafo
 * dependem de `whitespace-pre-line` no elemento que recebe o texto.
 */
export function emParagrafos(texto: string) {
  return texto
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function slugificar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Texto de uma linha para meta tags (description, og:description).
 *
 * A descricao crua vem de textarea, com quebras de linha. Jogada direto num
 * atributo HTML ela fica com newline literal dentro das aspas — funciona,
 * mas e sujo e confunde quem le o HTML. Aqui as quebras viram espaco e o
 * corte respeita a ultima palavra inteira.
 */
export function resumoParaMeta(texto: string | null | undefined, limite = 160) {
  if (!texto) return undefined;
  const limpo = texto.replace(/\s+/g, " ").trim();
  if (limpo.length <= limite) return limpo || undefined;
  const cortado = limpo.slice(0, limite);
  const ultimoEspaco = cortado.lastIndexOf(" ");
  return `${(ultimoEspaco > limite * 0.6 ? cortado.slice(0, ultimoEspaco) : cortado).trim()}...`;
}
