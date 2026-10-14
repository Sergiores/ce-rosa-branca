"use client";

import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Etiqueta } from "@/components/ui";
import { GRUPOS, TELAS } from "@/lib/auth/telas";
import { cn } from "@/lib/utils";

export type AcessoSimples = { ver: boolean; editar: boolean };
/** papel -> tela -> acesso. É a matriz de `permissoes`, que vira o padrão. */
export type MatrizPorPapel = Record<string, Record<string, AcessoSimples>>;

/**
 * Grade de telas para definir o que uma pessoa acessa.
 *
 * Começa igual ao papel escolhido, e o que você mudar vira exceção. Trocar
 * o papel no formulário recarrega a grade com o padrão do papel novo — do
 * contrário a pessoa ficaria com os marcadores do papel anterior sem perceber.
 *
 * Só manda os campos; quem compara com o papel e decide o que virou exceção
 * é a server action, com a matriz vinda do banco. Fazer essa conta aqui
 * deixaria a gravação dependendo do que o navegador disse ser o padrão.
 */
export function SeletorAcessos({
  papel,
  matrizPorPapel,
  excecoes,
}: {
  papel: string;
  matrizPorPapel: MatrizPorPapel;
  /** Exceções já gravadas, ao editar alguém que existe. */
  excecoes?: Record<string, AcessoSimples>;
}) {
  const padraoDoPapel = (p: string): Record<string, AcessoSimples> => {
    const base = matrizPorPapel[p] ?? {};
    return Object.fromEntries(
      TELAS.map((t) => [t.chave, base[t.chave] ?? { ver: false, editar: false }]),
    );
  };

  const [acessos, setAcessos] = useState<Record<string, AcessoSimples>>(() => ({
    ...padraoDoPapel(papel),
    ...(excecoes ?? {}),
  }));
  const [papelAnterior, setPapelAnterior] = useState(papel);

  // Trocou o papel: recarrega com o padrão do papel novo.
  useEffect(() => {
    if (papel === papelAnterior) return;
    setPapelAnterior(papel);
    setAcessos(padraoDoPapel(papel));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [papel]);

  function alternar(tela: string, campo: keyof AcessoSimples, valor: boolean) {
    setAcessos((atual) => {
      const antes = atual[tela] ?? { ver: false, editar: false };
      const depois = { ...antes, [campo]: valor };
      // Editar exige ver: marcar editar liga ver; desligar ver desliga editar.
      if (campo === "editar" && valor) depois.ver = true;
      if (campo === "ver" && !valor) depois.editar = false;
      return { ...atual, [tela]: depois };
    });
  }

  function voltarAoPapel() {
    setAcessos(padraoDoPapel(papel));
  }

  const padrao = padraoDoPapel(papel);
  const diferentes = TELAS.filter(
    (t) =>
      acessos[t.chave]?.ver !== padrao[t.chave]?.ver ||
      acessos[t.chave]?.editar !== padrao[t.chave]?.editar,
  ).length;

  return (
    <div className="rounded-2xl border border-borda">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-borda bg-marca-50/60 px-5 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-texto">Telas que esta pessoa acessa</p>
          {diferentes > 0 ? (
            <Etiqueta tom="ambar">
              {diferentes} {diferentes === 1 ? "diferença" : "diferenças"} do perfil
            </Etiqueta>
          ) : (
            <Etiqueta tom="cinza">igual ao perfil</Etiqueta>
          )}
        </div>

        {diferentes > 0 ? (
          <button
            type="button"
            onClick={voltarAoPapel}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-marca-700 hover:bg-white"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Voltar ao padrão do perfil
          </button>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[26rem] text-sm">
          <thead>
            <tr className="border-b border-borda text-left">
              <th className="px-5 py-2.5 font-semibold text-texto">Tela</th>
              <th className="w-20 px-3 py-2.5 text-center font-semibold text-texto">Ver</th>
              <th className="w-20 px-3 py-2.5 text-center font-semibold text-texto">Editar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borda">
            {GRUPOS.map((grupo) => {
              const doGrupo = TELAS.filter((t) => t.grupo === grupo);
              if (doGrupo.length === 0) return null;

              return (
                <tr key={grupo} className="align-top">
                  <td colSpan={3} className="p-0">
                    <table className="w-full">
                      <tbody>
                        <tr>
                          <td
                            colSpan={3}
                            className="bg-fundo px-5 py-1.5 text-xs font-semibold uppercase tracking-wide text-texto-suave"
                          >
                            {grupo}
                          </td>
                        </tr>
                        {doGrupo.map((t) => {
                          const a = acessos[t.chave] ?? { ver: false, editar: false };
                          const dif =
                            a.ver !== padrao[t.chave]?.ver ||
                            a.editar !== padrao[t.chave]?.editar;

                          return (
                            <tr key={t.chave} className={cn(dif && "bg-amber-50/60")}>
                              <td className="px-5 py-2.5 text-texto">
                                {t.rotulo}
                                {dif ? (
                                  <span className="ml-2 text-xs text-amber-700">alterado</span>
                                ) : null}
                              </td>
                              <td className="w-20 px-3 py-2.5 text-center">
                                <input
                                  type="checkbox"
                                  name={`ver:${t.chave}`}
                                  checked={a.ver}
                                  onChange={(e) => alternar(t.chave, "ver", e.target.checked)}
                                  className="h-4 w-4 accent-[#8a6154]"
                                  aria-label={`Ver ${t.rotulo}`}
                                />
                              </td>
                              <td className="w-20 px-3 py-2.5 text-center">
                                <input
                                  type="checkbox"
                                  name={`editar:${t.chave}`}
                                  checked={a.editar}
                                  onChange={(e) => alternar(t.chave, "editar", e.target.checked)}
                                  className="h-4 w-4 accent-[#8a6154]"
                                  aria-label={`Editar ${t.rotulo}`}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="border-t border-borda px-5 py-3 text-xs text-texto-suave">
        Isto controla o <strong>menu e a entrada nas telas</strong>. A proteção dos dados no banco
        continua sendo pelo perfil de acesso.
      </p>
    </div>
  );
}
