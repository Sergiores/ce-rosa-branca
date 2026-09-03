"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Copy, Check, QrCode } from "lucide-react";
import { Cartao, CartaoCorpo } from "@/components/ui";
import { formatarMoeda } from "@/lib/utils";
import { gerarPayloadPix } from "@/lib/financeiro/pix";

export function CobrancaPix({
  valor,
  identificador,
  descricao,
}: {
  valor: number;
  identificador: string;
  descricao: string;
}) {
  const chave = process.env.NEXT_PUBLIC_PIX_CHAVE;
  const recebedor = process.env.NEXT_PUBLIC_PIX_NOME ?? "CASA ESPIRITA ROSA BRANCA";
  const cidade = process.env.NEXT_PUBLIC_PIX_CIDADE ?? "CIDADE";

  const [imagem, setImagem] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  const payload = chave
    ? gerarPayloadPix({ chave, nomeRecebedor: recebedor, cidade, valor, identificador })
    : null;

  useEffect(() => {
    if (!payload) return;
    QRCode.toDataURL(payload, { width: 220, margin: 1 })
      .then(setImagem)
      .catch(() => setImagem(null));
  }, [payload]);

  if (!chave) {
    return (
      <Cartao className="mt-6 border-amber-200 bg-amber-50">
        <CartaoCorpo>
          <p className="text-sm text-amber-800">
            Configure <code className="font-mono">NEXT_PUBLIC_PIX_CHAVE</code>,{" "}
            <code className="font-mono">NEXT_PUBLIC_PIX_NOME</code> e{" "}
            <code className="font-mono">NEXT_PUBLIC_PIX_CIDADE</code> no ambiente para gerar a
            cobrança Pix.
          </p>
        </CartaoCorpo>
      </Cartao>
    );
  }

  async function copiar() {
    if (!payload) return;
    await navigator.clipboard.writeText(payload);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <Cartao className="mt-6 border-azul-200 bg-gradient-to-br from-white to-azul-50">
      <CartaoCorpo className="sm:p-8">
        <h2 className="flex items-center gap-2 font-semibold text-texto">
          <QrCode className="h-5 w-5 text-azul-600" />
          Cobrança Pix
        </h2>
        <p className="mt-1 text-sm text-texto-suave">
          {descricao} — {formatarMoeda(valor)}. Envie ao membro; a baixa continua manual.
        </p>

        <div className="mt-6 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          {imagem ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imagem}
              alt="QR Code do Pix"
              className="rounded-xl border border-borda bg-white p-2"
            />
          ) : (
            <div className="h-[220px] w-[220px] animate-pulse rounded-xl bg-azul-100" />
          )}

          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-texto-suave">Pix copia e cola</p>
            <p className="mt-2 break-all rounded-xl border border-borda bg-white px-4 py-3 font-mono text-xs text-texto">
              {payload}
            </p>
            <button
              type="button"
              onClick={copiar}
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-azul-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-azul-700"
            >
              {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copiado ? "Copiado" : "Copiar código"}
            </button>
          </div>
        </div>
      </CartaoCorpo>
    </Cartao>
  );
}
