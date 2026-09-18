"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Rotulo } from "@/components/ui";
import { criarClienteNavegador } from "@/lib/supabase/client";
import { BUCKET_MIDIA } from "@/lib/supabase/schema";
import { slugificar } from "@/lib/utils";

const TIPOS = ["image/jpeg", "image/png", "image/webp"];
const LIMITE = 5 * 1024 * 1024;

/** Envia a imagem para o bucket publico `midia` e guarda a URL no campo do formulario. */
export function UploadImagem({
  nome = "imagem_url",
  valorInicial,
  rotulo = "Imagem de capa",
  pasta = "conteudo",
}: {
  nome?: string;
  valorInicial?: string | null;
  rotulo?: string;
  pasta?: string;
}) {
  const [url, setUrl] = useState(valorInicial ?? "");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function aoSelecionar(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    if (!TIPOS.includes(arquivo.type)) {
      setErro("Use uma imagem JPG, PNG ou WEBP.");
      return;
    }
    if (arquivo.size > LIMITE) {
      setErro("A imagem deve ter no máximo 5 MB.");
      return;
    }

    setErro(null);
    setEnviando(true);

    const supabase = criarClienteNavegador();
    const extensao = arquivo.name.split(".").pop() ?? "jpg";
    const caminho = `${pasta}/${Date.now()}-${slugificar(arquivo.name.replace(/\.[^.]+$/, ""))}.${extensao}`;

    const { error } = await supabase.storage
      .from(BUCKET_MIDIA)
      .upload(caminho, arquivo, { cacheControl: "3600", upsert: false });

    if (error) {
      setErro(error.message);
      setEnviando(false);
      return;
    }

    const { data } = supabase.storage.from(BUCKET_MIDIA).getPublicUrl(caminho);
    setUrl(data.publicUrl);
    setEnviando(false);
  }

  return (
    <div>
      <Rotulo>{rotulo}</Rotulo>
      <input type="hidden" name={nome} value={url} />

      {url ? (
        <div className="relative overflow-hidden rounded-xl border border-borda">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="h-44 w-full object-cover" />
          <button
            type="button"
            onClick={() => setUrl("")}
            aria-label="Remover imagem"
            className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-texto shadow"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={enviando}
          className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-borda bg-white text-sm text-texto-suave transition-colors hover:border-marca-300 hover:bg-marca-50"
        >
          {enviando ? (
            <Loader2 className="h-6 w-6 animate-spin text-marca-600" />
          ) : (
            <ImagePlus className="h-6 w-6 text-marca-500" />
          )}
          {enviando ? "Enviando..." : "Escolher imagem (JPG, PNG ou WEBP, até 5 MB)"}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={TIPOS.join(",")}
        onChange={aoSelecionar}
        className="hidden"
      />

      {erro ? <p className="mt-2 text-sm text-rose-700">{erro}</p> : null}
    </div>
  );
}
