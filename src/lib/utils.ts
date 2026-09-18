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
