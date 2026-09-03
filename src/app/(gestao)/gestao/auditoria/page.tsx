import type { Metadata } from "next";
import { Botao, Cartao, CartaoCorpo, Campo, Etiqueta, Rotulo, Selecao, Vazio } from "@/components/ui";
import { formatarDataHora } from "@/lib/datas";
import { exigirTela } from "@/lib/auth/permissoes";
import { criarClienteServidor } from "@/lib/supabase/server";
import type { RegistroAuditoria } from "@/lib/tipos";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Auditoria" };

const TABELAS = [
  "noticias", "mensagens_do_dia", "eventos", "projetos", "paginas", "questoes", "pareceres",
  "atas", "anexos", "profiles", "permissoes", "membros", "membro_mensalidade",
  "documentos", "documento_itens", "titulos", "baixas",
];

const TOM_ACAO = { INSERT: "verde", UPDATE: "azul", DELETE: "vermelho" } as const;

/** Mostra apenas os campos que realmente mudaram. */
function diferencas(r: RegistroAuditoria) {
  const antes = r.dados_antes ?? {};
  const depois = r.dados_depois ?? {};
  const chaves = new Set([...Object.keys(antes), ...Object.keys(depois)]);
  const linhas: { campo: string; de: string; para: string }[] = [];

  for (const c of chaves) {
    if (c === "atualizado_em" || c === "criado_em") continue;
    const a = JSON.stringify(antes[c] ?? null);
    const d = JSON.stringify(depois[c] ?? null);
    if (a !== d) linhas.push({ campo: c, de: a, para: d });
  }
  return linhas;
}

export default async function PaginaAuditoria({
  searchParams,
}: {
  searchParams: Promise<{ tabela?: string; acao?: string; de?: string; ate?: string }>;
}) {
  await exigirTela("auditoria");
  const filtros = await searchParams;

  const supabase = await criarClienteServidor();
  let consulta = supabase
    .from("auditoria")
    .select("*")
    .order("criado_em", { ascending: false })
    .limit(200);

  if (filtros.tabela) consulta = consulta.eq("tabela", filtros.tabela);
  if (filtros.acao) consulta = consulta.eq("acao", filtros.acao);
  if (filtros.de) consulta = consulta.gte("criado_em", filtros.de);
  if (filtros.ate) consulta = consulta.lte("criado_em", `${filtros.ate}T23:59:59`);

  const { data } = await consulta;
  const registros = (data ?? []) as RegistroAuditoria[];

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-semibold tracking-tight text-texto">Auditoria</h1>
      <p className="mt-1 text-texto-suave">
        Registro imutável de inclusões, alterações e exclusões. Gravado pelo próprio banco de dados —
        inclusive alterações feitas fora do sistema.
      </p>

      <Cartao className="mt-8">
        <CartaoCorpo>
          <form className="grid gap-4 sm:grid-cols-5 sm:items-end">
            <div className="sm:col-span-2">
              <Rotulo htmlFor="tabela">Tabela</Rotulo>
              <Selecao id="tabela" name="tabela" defaultValue={filtros.tabela ?? ""}>
                <option value="">Todas</option>
                {TABELAS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Selecao>
            </div>
            <div>
              <Rotulo htmlFor="acao">Ação</Rotulo>
              <Selecao id="acao" name="acao" defaultValue={filtros.acao ?? ""}>
                <option value="">Todas</option>
                <option value="INSERT">Inclusão</option>
                <option value="UPDATE">Alteração</option>
                <option value="DELETE">Exclusão</option>
              </Selecao>
            </div>
            <div>
              <Rotulo htmlFor="de">De</Rotulo>
              <Campo id="de" name="de" type="date" defaultValue={filtros.de ?? ""} />
            </div>
            <div>
              <Rotulo htmlFor="ate">Até</Rotulo>
              <Campo id="ate" name="ate" type="date" defaultValue={filtros.ate ?? ""} />
            </div>
            <div className="sm:col-span-5">
              <Botao type="submit" tamanho="sm">Filtrar</Botao>
            </div>
          </form>
        </CartaoCorpo>
      </Cartao>

      <div className="mt-6">
        {registros.length === 0 ? (
          <Vazio mensagem="Nenhum registro de auditoria para os filtros escolhidos." />
        ) : (
          <div className="space-y-3">
            {registros.map((r) => {
              const mudou = diferencas(r);
              return (
                <Cartao key={r.id}>
                  <CartaoCorpo className="py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Etiqueta tom={TOM_ACAO[r.acao]}>{r.acao}</Etiqueta>
                      <span className="font-medium text-texto">{r.tabela}</span>
                      <span className="text-xs text-texto-suave">{formatarDataHora(r.criado_em)}</span>
                      <span className="text-xs text-texto-suave">
                        · {r.autor_email ?? "sistema"}
                      </span>
                    </div>

                    {mudou.length > 0 ? (
                      <ul className="mt-3 space-y-1 text-sm">
                        {mudou.slice(0, 12).map((d) => (
                          <li key={d.campo} className="flex flex-wrap gap-2">
                            <span className="font-medium text-texto-suave">{d.campo}:</span>
                            {r.acao !== "INSERT" ? (
                              <span className="text-rose-700 line-through">{d.de}</span>
                            ) : null}
                            {r.acao !== "DELETE" ? (
                              <span className="text-emerald-700">{d.para}</span>
                            ) : null}
                          </li>
                        ))}
                        {mudou.length > 12 ? (
                          <li className="text-xs text-texto-suave">
                            e mais {mudou.length - 12} campo(s).
                          </li>
                        ) : null}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm text-texto-suave">Sem alteração de campos.</p>
                    )}
                  </CartaoCorpo>
                </Cartao>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
