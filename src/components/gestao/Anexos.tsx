"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Download, FileText, Loader2, Paperclip, Trash2 } from "lucide-react";
import { criarClienteNavegador } from "@/lib/supabase/client";
import { BUCKET_ANEXOS } from "@/lib/supabase/schema";
import { formatarDataHora } from "@/lib/datas";
import { slugificar } from "@/lib/utils";
import {
  excluirAnexo,
  listarAnexos,
  registrarAnexo,
  urlAssinada,
} from "@/lib/gestao/acoes-anexos";
import type { Anexo, EntidadeAnexo } from "@/lib/tipos";

const ACEITOS =
  "application/pdf,image/jpeg,image/png,image/webp,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const LIMITE = 20 * 1024 * 1024;

function tamanhoLegivel(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Anexos em bucket privado, baixados por URL assinada de curta duração.
 * Reutilizado por atas e por documentos de compra/venda.
 */
export function Anexos({
  entidade,
  entidadeId,
  somenteLeitura = false,
}: {
  entidade: EntidadeAnexo;
  entidadeId: string;
  somenteLeitura?: boolean;
}) {
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [, iniciarTransicao] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  async function recarregar() {
    setAnexos(await listarAnexos(entidade, entidadeId));
  }

  useEffect(() => {
    recarregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entidade, entidadeId]);

  async function aoSelecionar(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    if (arquivo.size > LIMITE) {
      setErro("O arquivo deve ter até 20 MB.");
      return;
    }

    setErro(null);
    setEnviando(true);

    const supabase = criarClienteNavegador();
    const extensao = arquivo.name.split(".").pop() ?? "bin";
    const base = slugificar(arquivo.name.replace(/\.[^.]+$/, "")) || "arquivo";
    const caminho = `${entidade}/${entidadeId}/${Date.now()}-${base}.${extensao}`;

    const { error } = await supabase.storage.from(BUCKET_ANEXOS).upload(caminho, arquivo);
    if (error) {
      setErro(error.message);
      setEnviando(false);
      return;
    }

    const resultado = await registrarAnexo({
      entidade,
      entidadeId,
      nomeArquivo: arquivo.name,
      mime: arquivo.type,
      tamanho: arquivo.size,
      storagePath: caminho,
    });

    if (resultado?.erro) {
      // Registro falhou: remove o arquivo para não deixar lixo no bucket.
      await supabase.storage.from(BUCKET_ANEXOS).remove([caminho]);
      setErro(resultado.erro);
    } else {
      await recarregar();
    }

    setEnviando(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function baixar(id: string) {
    const resultado = await urlAssinada(id);
    if (resultado?.url) window.open(resultado.url, "_blank", "noopener,noreferrer");
    else setErro(resultado?.erro ?? "Não foi possível abrir o arquivo.");
  }

  function remover(id: string, nome: string) {
    if (!window.confirm(`Excluir o anexo "${nome}"? Esta ação não pode ser desfeita.`)) return;
    iniciarTransicao(async () => {
      const resultado = await excluirAnexo(id);
      if (resultado?.erro) setErro(resultado.erro);
      else await recarregar();
    });
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-texto-suave">
        <Paperclip className="h-4 w-4" />
        Anexos
      </div>

      {anexos.length > 0 ? (
        <ul className="mb-3 divide-y divide-borda rounded-xl border border-borda bg-white">
          {anexos.map((a) => (
            <li key={a.id} className="flex items-center gap-3 px-4 py-3">
              <FileText className="h-4 w-4 shrink-0 text-azul-600" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-texto">{a.nome_arquivo}</p>
                <p className="text-xs text-texto-suave">
                  {tamanhoLegivel(a.tamanho)} · {formatarDataHora(a.criado_em)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => baixar(a.id)}
                aria-label="Baixar"
                className="grid h-9 w-9 place-items-center rounded-full text-azul-700 hover:bg-azul-50"
              >
                <Download className="h-4 w-4" />
              </button>
              {!somenteLeitura ? (
                <button
                  type="button"
                  onClick={() => remover(a.id, a.nome_arquivo)}
                  aria-label="Excluir anexo"
                  className="grid h-9 w-9 place-items-center rounded-full text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-3 rounded-xl border border-dashed border-borda bg-white/60 px-4 py-5 text-center text-sm text-texto-suave">
          Nenhum arquivo anexado.
        </p>
      )}

      {!somenteLeitura ? (
        <>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={enviando}
            className="inline-flex items-center gap-2 rounded-full border border-azul-200 bg-white px-5 py-2.5 text-sm font-medium text-azul-700 hover:bg-azul-50 disabled:opacity-50"
          >
            {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
            {enviando ? "Enviando..." : "Anexar arquivo"}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept={ACEITOS}
            onChange={aoSelecionar}
            className="hidden"
          />
          <p className="mt-2 text-xs text-texto-suave">
            PDF, imagem, Word ou Excel — até 20 MB. Arquivos privados, acessíveis só pela gestão.
          </p>
        </>
      ) : null}

      {erro ? <p className="mt-2 text-sm text-rose-700">{erro}</p> : null}
    </div>
  );
}
