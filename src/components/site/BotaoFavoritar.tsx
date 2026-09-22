"use client";

import { useState, useTransition } from "react";
import { Heart, Loader2 } from "lucide-react";
import { alternarFavorito } from "@/lib/estudo/acoes";
import { cn } from "@/lib/utils";

/**
 * Alterna favorito de uma questao. Só é renderizado para quem já está
 * logado — a página decide isso no servidor e mostra um link de
 * entrar/cadastrar no lugar deste botão quando o visitante é anônimo.
 */
export function BotaoFavoritar({
  questaoId,
  favoritadaInicial,
  tamanho = "md",
}: {
  questaoId: string;
  favoritadaInicial: boolean;
  tamanho?: "sm" | "md";
}) {
  const [favoritada, setFavoritada] = useState(favoritadaInicial);
  const [pendente, iniciarTransicao] = useTransition();

  function aoClicar() {
    iniciarTransicao(async () => {
      const resultado = await alternarFavorito(questaoId);
      if ("ok" in resultado) setFavoritada(resultado.favoritada);
    });
  }

  const caixa = tamanho === "sm" ? "h-8 w-8" : "h-10 w-10";
  const icone = tamanho === "sm" ? "h-4 w-4" : "h-[18px] w-[18px]";

  return (
    <button
      type="button"
      onClick={aoClicar}
      disabled={pendente}
      aria-pressed={favoritada}
      aria-label={favoritada ? "Remover dos favoritos" : "Favoritar esta questão"}
      title={favoritada ? "Remover dos favoritos" : "Favoritar"}
      className={cn(
        "grid shrink-0 place-items-center rounded-full border transition-colors disabled:opacity-50",
        caixa,
        favoritada
          ? "border-marca-300 bg-marca-100 text-marca-700"
          : "border-borda bg-white text-texto-suave hover:border-marca-200 hover:text-marca-600",
      )}
    >
      {pendente ? (
        <Loader2 className={cn(icone, "animate-spin")} />
      ) : (
        <Heart className={icone} fill={favoritada ? "currentColor" : "none"} strokeWidth={2} />
      )}
    </button>
  );
}
