import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatarData(valor: string | Date | null | undefined, padrao = "dd/MM/yyyy") {
  if (!valor) return "";
  const d = typeof valor === "string" ? parseISO(valor) : valor;
  return format(d, padrao, { locale: ptBR });
}

export function formatarDataLonga(valor: string | Date | null | undefined) {
  return formatarData(valor, "d 'de' MMMM 'de' yyyy");
}

export function formatarDataHora(valor: string | Date | null | undefined) {
  return formatarData(valor, "dd/MM/yyyy HH:mm");
}

export function competenciaAtual(d = new Date()) {
  return format(d, "yyyy-MM-01");
}
