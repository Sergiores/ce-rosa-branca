"use client";

import { useState } from "react";
import { Loader2, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Compartilha um evento no WhatsApp sem API nenhuma — é o próprio aplicativo
 * que abre, e quem escolhe o destino é a pessoa.
 *
 * Dois caminhos, porque o WhatsApp não aceita imagem por link:
 *
 * 1. No celular, `navigator.share` com o arquivo anexa a imagem de verdade.
 *    Dá para escolher o grupo no compartilhamento do próprio sistema.
 * 2. Onde isso não existe (quase todo desktop), abre o wa.me só com o texto.
 *    O link do evento vai junto, e o WhatsApp monta a prévia com a imagem
 *    lendo o `og:image` da página pública.
 */
export function CompartilharWhatsApp({
  titulo,
  texto,
  url,
  imagemUrl,
  className,
}: {
  titulo: string;
  texto: string;
  url: string;
  imagemUrl?: string | null;
  className?: string;
}) {
  const [pendente, setPendente] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const mensagem = `${texto}\n\n${url}`;

  function abrirWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(mensagem)}`, "_blank", "noopener");
  }

  async function aoClicar() {
    setAviso(null);

    // Sem imagem não há o que anexar: vai direto para o WhatsApp.
    if (!imagemUrl || typeof navigator === "undefined" || !navigator.share) {
      abrirWhatsApp();
      return;
    }

    setPendente(true);
    try {
      const resposta = await fetch(imagemUrl);
      if (!resposta.ok) throw new Error("imagem inacessível");

      const blob = await resposta.blob();
      const extensao = (blob.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
      const arquivo = new File([blob], `${titulo}.${extensao}`, { type: blob.type });

      // canShare precisa ser consultado com o arquivo: o navegador pode ter
      // `share` e ainda assim recusar anexo.
      if (navigator.canShare?.({ files: [arquivo] })) {
        await navigator.share({ files: [arquivo], text: mensagem });
        return;
      }

      abrirWhatsApp();
    } catch (erro) {
      // Desistir de anexar não é falha: o texto com o link resolve, e a
      // prévia do WhatsApp mostra a imagem de qualquer forma.
      if ((erro as Error)?.name === "AbortError") return; // a pessoa fechou
      setAviso("Não deu para anexar a imagem; abri o WhatsApp com o texto e o link.");
      abrirWhatsApp();
    } finally {
      setPendente(false);
    }
  }

  return (
    <div className={cn(className)}>
      <button
        type="button"
        onClick={aoClicar}
        disabled={pendente}
        className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-emerald-600/20 transition-colors hover:bg-emerald-700 disabled:opacity-50"
      >
        {pendente ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Share2 className="h-4 w-4" />
        )}
        {pendente ? "Preparando..." : "Enviar no WhatsApp"}
      </button>

      {aviso ? <p className="mt-3 text-sm text-texto-suave">{aviso}</p> : null}
    </div>
  );
}
