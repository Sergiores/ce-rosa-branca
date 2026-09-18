"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Headphones, Pause, Play, Square } from "lucide-react";
import { cn } from "@/lib/utils";

type Estado = "parado" | "lendo" | "pausado";

/**
 * Divide o texto em blocos curtos.
 * O Chrome interrompe falas longas por conta de um limite interno, então
 * enfileiramos frases em vez de mandar tudo de uma vez.
 */
function emBlocos(texto: string, max = 220) {
  const frases = texto
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?;:])\s+/)
    .filter(Boolean);

  const blocos: string[] = [];
  let atual = "";

  for (const frase of frases) {
    if ((atual + " " + frase).trim().length <= max) {
      atual = (atual + " " + frase).trim();
    } else {
      if (atual) blocos.push(atual);
      atual = frase.length <= max ? frase : "";
      if (!atual) {
        // Frase gigante sem pontuação: corta por palavras.
        let pedaco = "";
        for (const palavra of frase.split(" ")) {
          if ((pedaco + " " + palavra).trim().length <= max) {
            pedaco = (pedaco + " " + palavra).trim();
          } else {
            blocos.push(pedaco);
            pedaco = palavra;
          }
        }
        atual = pedaco;
      }
    }
  }
  if (atual) blocos.push(atual);
  return blocos;
}

export function BotaoOuvir({
  texto,
  rotulo = "Ouvir",
  className,
}: {
  texto: string;
  rotulo?: string;
  className?: string;
}) {
  const [suportado, setSuportado] = useState(false);
  const [estado, setEstado] = useState<Estado>("parado");
  const [progresso, setProgresso] = useState(0);
  const vozRef = useRef<SpeechSynthesisVoice | null>(null);
  const cancelandoRef = useRef(false);

  // Vozes carregam de forma assíncrona na maioria dos navegadores.
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    setSuportado(true);

    const escolherVoz = () => {
      const vozes = window.speechSynthesis.getVoices();
      const brasileiras = vozes.filter((v) => v.lang?.toLowerCase().startsWith("pt-br"));
      const portuguesas = vozes.filter((v) => v.lang?.toLowerCase().startsWith("pt"));
      vozRef.current = brasileiras[0] ?? portuguesas[0] ?? null;
    };

    escolherVoz();
    window.speechSynthesis.addEventListener("voiceschanged", escolherVoz);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", escolherVoz);
      window.speechSynthesis.cancel();
    };
  }, []);

  const parar = useCallback(() => {
    cancelandoRef.current = true;
    window.speechSynthesis.cancel();
    setEstado("parado");
    setProgresso(0);
  }, []);

  const iniciar = useCallback(() => {
    const blocos = emBlocos(texto);
    if (blocos.length === 0) return;

    cancelandoRef.current = false;
    window.speechSynthesis.cancel();
    setEstado("lendo");
    setProgresso(0);

    blocos.forEach((bloco, i) => {
      const fala = new SpeechSynthesisUtterance(bloco);
      fala.lang = "pt-BR";
      fala.rate = 0.95;
      fala.pitch = 1;
      if (vozRef.current) fala.voice = vozRef.current;

      fala.onstart = () => setProgresso(Math.round((i / blocos.length) * 100));
      fala.onend = () => {
        if (i === blocos.length - 1 && !cancelandoRef.current) {
          setEstado("parado");
          setProgresso(0);
        }
      };
      fala.onerror = () => {
        if (!cancelandoRef.current) {
          setEstado("parado");
          setProgresso(0);
        }
      };

      window.speechSynthesis.speak(fala);
    });
  }, [texto]);

  function alternar() {
    if (estado === "lendo") {
      window.speechSynthesis.pause();
      setEstado("pausado");
    } else if (estado === "pausado") {
      window.speechSynthesis.resume();
      setEstado("lendo");
    } else {
      iniciar();
    }
  }

  if (!suportado) return null;

  const lendo = estado === "lendo";
  const ativo = estado !== "parado";

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <button
        type="button"
        onClick={alternar}
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors",
          ativo
            ? "bg-marca-600 text-white hover:bg-marca-700"
            : "border border-marca-200 bg-white text-marca-700 hover:bg-marca-50",
        )}
        aria-label={lendo ? "Pausar leitura" : ativo ? "Continuar leitura" : rotulo}
      >
        {lendo ? (
          <Pause className="h-4 w-4" />
        ) : ativo ? (
          <Play className="h-4 w-4" />
        ) : (
          <Headphones className="h-4 w-4" />
        )}
        {lendo ? "Pausar" : ativo ? "Continuar" : rotulo}
      </button>

      {ativo ? (
        <button
          type="button"
          onClick={parar}
          aria-label="Parar leitura"
          className="grid h-10 w-10 place-items-center rounded-full border border-marca-200 bg-white text-marca-700 hover:bg-marca-50"
        >
          <Square className="h-3.5 w-3.5" />
        </button>
      ) : null}

      {ativo ? (
        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-marca-100" aria-hidden>
          <div
            className="h-full rounded-full bg-marca-500 transition-all duration-500"
            style={{ width: `${progresso}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}
