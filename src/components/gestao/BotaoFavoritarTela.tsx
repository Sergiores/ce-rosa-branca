"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { Loader2, Star } from "lucide-react";
import { alternarFavoritoTela } from "@/lib/gestao/acoes-favoritos";
import { cn } from "@/lib/utils";

/**
 * Favorita a tela atual. Vive no cabeçalho da gestão, uma vez só — assim
 * funciona em qualquer tela sem que cada página precise saber do assunto.
 *
 * O rótulo sai do `document.title`, que o Next monta a partir do `metadata`
 * de cada página. É o que permite favoritar telas de dentro de outras
 * ("Alunos", "Nova aula"), que não têm nome em lugar nenhum do código de
 * navegação.
 */
export function BotaoFavoritarTela({ favoritos }: { favoritos: string[] }) {
  const path = usePathname();
  const [pendente, iniciarTransicao] = useTransition();
  const [marcado, setMarcado] = useState(false);
  const [rotulo, setRotulo] = useState("");

  // O title só existe no cliente, e muda a cada navegação.
  useEffect(() => {
    setMarcado(favoritos.includes(path));
    const bruto = document.title.split("|")[0]?.trim() ?? "";
    setRotulo(bruto);
  }, [path, favoritos]);

  // O painel é a porta de entrada: favoritá-lo não ajuda ninguém.
  if (path === "/gestao") return null;

  function aoClicar() {
    iniciarTransicao(async () => {
      const resultado = await alternarFavoritoTela(path, rotulo || path);
      if ("ok" in resultado) setMarcado(resultado.favoritado);
    });
  }

  return (
    <button
      type="button"
      onClick={aoClicar}
      disabled={pendente}
      aria-pressed={marcado}
      aria-label={marcado ? "Remover dos favoritos" : "Favoritar esta tela"}
      title={marcado ? "Remover dos favoritos" : `Favoritar "${rotulo}"`}
      className={cn(
        "grid h-10 w-10 shrink-0 place-items-center rounded-full border transition-colors disabled:opacity-50",
        marcado
          ? "border-amber-200 bg-amber-50 text-amber-600"
          : "border-borda bg-white text-texto-suave hover:border-marca-200 hover:text-marca-600",
      )}
    >
      {pendente ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Star className="h-[18px] w-[18px]" fill={marcado ? "currentColor" : "none"} />
      )}
    </button>
  );
}
