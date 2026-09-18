import Link from "next/link";
import { Plus, Search, X } from "lucide-react";
import { Botao, BotaoLink, Campo, Cartao, Rotulo, Selecao } from "@/components/ui";

/** Monta a URL preservando os filtros ativos. */
export function montarUrl(base: string, params: Record<string, string | number | undefined>) {
  const u = new URLSearchParams();
  for (const [chave, valor] of Object.entries(params)) {
    if (valor !== undefined && valor !== "" && valor !== 0) u.set(chave, String(valor));
  }
  const s = u.toString();
  return s ? `${base}?${s}` : base;
}

export function CabecalhoLista({
  titulo,
  descricao,
  novoHref,
  novoRotulo,
  podeEditar = true,
}: {
  titulo: string;
  descricao?: string;
  novoHref?: string;
  novoRotulo?: string;
  podeEditar?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-texto">{titulo}</h1>
        {descricao ? <p className="mt-1 text-texto-suave">{descricao}</p> : null}
      </div>
      {novoHref && podeEditar ? (
        <BotaoLink href={novoHref}>
          <Plus className="h-4 w-4" /> {novoRotulo ?? "Novo"}
        </BotaoLink>
      ) : null}
    </div>
  );
}

export type OpcaoFiltro = { valor: string; rotulo: string };

/**
 * Busca + filtro por situação. Envia por GET, então os filtros ficam na URL
 * e podem ser guardados nos favoritos ou compartilhados.
 */
export function FiltrosLista({
  base,
  busca,
  status,
  opcoesStatus,
  rotuloBusca = "Buscar",
  placeholder,
  rotuloStatus = "Situação",
  children,
}: {
  base: string;
  busca: string;
  status?: string;
  opcoesStatus?: OpcaoFiltro[];
  rotuloBusca?: string;
  placeholder?: string;
  rotuloStatus?: string;
  children?: React.ReactNode;
}) {
  const temFiltro = Boolean(busca || status);

  return (
    <Cartao className="mt-6">
      <form
        className={
          opcoesStatus
            ? "grid gap-4 p-5 sm:grid-cols-[1fr_12rem_auto] sm:items-end"
            : "grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-end"
        }
      >
        <div>
          <Rotulo htmlFor="q">{rotuloBusca}</Rotulo>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-texto-suave" />
            <Campo id="q" name="q" defaultValue={busca} placeholder={placeholder} className="pl-10" />
          </div>
        </div>

        {opcoesStatus ? (
          <div>
            <Rotulo htmlFor="status">{rotuloStatus}</Rotulo>
            <Selecao id="status" name="status" defaultValue={status ?? ""}>
              {opcoesStatus.map((o) => (
                <option key={o.valor} value={o.valor}>
                  {o.rotulo}
                </option>
              ))}
            </Selecao>
          </div>
        ) : null}

        {children}

        <div className="flex gap-2">
          <Botao type="submit">Filtrar</Botao>
          {temFiltro ? (
            <Link
              href={base}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-borda bg-white px-5 text-sm font-medium text-texto-suave hover:bg-marca-50"
            >
              <X className="h-4 w-4" /> Limpar
            </Link>
          ) : null}
        </div>
      </form>
    </Cartao>
  );
}

export function Paginacao({
  base,
  pagina,
  total,
  porPagina,
  filtros,
}: {
  base: string;
  pagina: number;
  total: number;
  porPagina: number;
  filtros: Record<string, string | undefined>;
}) {
  if (total <= porPagina) return null;
  const ultima = Math.max(1, Math.ceil(total / porPagina));

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
      <p className="text-sm text-texto-suave">
        Mostrando {(pagina - 1) * porPagina + 1}–{Math.min(pagina * porPagina, total)} de {total}
      </p>
      <div className="flex items-center gap-2">
        {pagina > 1 ? (
          <Link
            href={montarUrl(base, { ...filtros, pagina: pagina - 1 > 1 ? pagina - 1 : undefined })}
            className="rounded-full border border-borda bg-white px-4 py-2 text-sm font-medium text-marca-700 hover:bg-marca-50"
          >
            Anterior
          </Link>
        ) : null}
        <span className="text-sm text-texto-suave">
          página {pagina} de {ultima}
        </span>
        {pagina < ultima ? (
          <Link
            href={montarUrl(base, { ...filtros, pagina: pagina + 1 })}
            className="rounded-full border border-borda bg-white px-4 py-2 text-sm font-medium text-marca-700 hover:bg-marca-50"
          >
            Próxima
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export const OPCOES_PUBLICACAO: OpcaoFiltro[] = [
  { valor: "", rotulo: "Todas" },
  { valor: "publicado", rotulo: "Publicadas" },
  { valor: "rascunho", rotulo: "Rascunhos" },
];
