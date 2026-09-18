import { cn } from "@/lib/utils";

/**
 * Marca da casa: rosa branca desenhada em vetor, a partir da identidade que a
 * casa ja usa nas artes. Vetor e nao foto porque no tamanho de favicon uma rosa
 * fotografica vira borrao.
 *
 * Usa `currentColor`, entao a cor vem da classe de texto de quem chama.
 */
export function MarcaRosa({ className }: { className?: string }) {
  return (
    <svg
      viewBox="9 5 30 38"
      role="img"
      aria-hidden="true"
      className={cn("h-6 w-6", className)}
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M24.2 19.6L24.4 19.5L24.7 19.5L25.0 19.5L25.3 19.7L25.6 19.9L25.9 20.2L26.0 20.6L26.1 21.0L26.1 21.5L26.0 22.0L25.8 22.5L25.5 22.9L25.0 23.3L24.5 23.6L23.8 23.8L23.1 23.9L22.4 23.8L21.7 23.6L21.0 23.2L20.4 22.6L19.9 21.9L19.6 21.1L19.4 20.2L19.4 19.3L19.6 18.3L19.9 17.4L20.5 16.5L21.3 15.8L22.2 15.2L23.3 14.8L24.5 14.6L25.7 14.6L26.9 14.9L28.0 15.5L29.0 16.3L29.9 17.2L30.6 18.4L31.0 19.7L31.2 21.2L31.1 22.6L30.7 24.0L30.0 25.4L29.0 26.6L27.8 27.6L26.4 28.4L24.8 28.8" />
        <path d="M19.7 16.3 Q22.7 8.4 27.4 15.5" />
      <path d="M26.6 15.1 Q35.1 15.5 29.8 22.2" />
      <path d="M29.9 21.3 Q32.2 29.6 24.2 26.5" />
      <path d="M25.0 26.4 Q17.9 31.1 18.4 22.6" />
      <path d="M18.7 23.3 Q12.1 18.0 20.3 15.8" />
        <path d="M24 33.4v8.2" />
      </g>
      <path d="M23.4 38.6c-3.4-.2-5.9-2.9-5.9-6.1 3.4.2 5.9 2.9 5.9 6.1z" fill="currentColor" />
      <path d="M24.6 41.1c3-.2 5.2-2.6 5.2-5.4-3 .2-5.2 2.6-5.2 5.4z" fill="currentColor" />
    </svg>
  );
}

/** Selo: a rosa dentro do circulo da marca. */
export function SeloMarca({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-marca-600 text-white shadow-md shadow-marca-600/25",
        "h-10 w-10",
        className,
      )}
    >
      <MarcaRosa className="h-6 w-6" />
    </span>
  );
}

/**
 * Lockup completo: selo + assinatura em duas linhas, como nas artes da casa —
 * "CASA ESPIRITA" pequeno e espacado, "Rosa Branca" grande embaixo.
 */
export function Logo({
  className,
  tamanho = "md",
  semSelo = false,
}: {
  className?: string;
  tamanho?: "sm" | "md" | "lg";
  semSelo?: boolean;
}) {
  const linha1 = {
    sm: "text-[0.55rem] tracking-[0.3em]",
    md: "text-[0.6rem] tracking-[0.3em]",
    lg: "text-xs tracking-[0.32em]",
  }[tamanho];

  const linha2 = {
    sm: "text-base",
    md: "text-xl",
    lg: "text-3xl",
  }[tamanho];

  const selo = { sm: "h-9 w-9", md: "h-11 w-11", lg: "h-14 w-14" }[tamanho];
  const rosa = { sm: "h-5 w-5", md: "h-7 w-7", lg: "h-9 w-9" }[tamanho];

  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      {semSelo ? null : (
        <span
          className={cn(
            "grid shrink-0 place-items-center rounded-full bg-marca-600 text-white shadow-md shadow-marca-600/25",
            selo,
          )}
        >
          <MarcaRosa className={rosa} />
        </span>
      )}
      <span className="leading-none">
        <span className={cn("block font-marca uppercase text-marca-600", linha1)}>
          Casa Espírita
        </span>
        <span className={cn("mt-1 block font-marca leading-none text-texto", linha2)}>
          Rosa Branca
        </span>
      </span>
    </span>
  );
}
