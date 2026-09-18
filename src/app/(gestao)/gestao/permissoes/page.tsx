import type { Metadata } from "next";
import { Botao, Cartao, CartaoCorpo } from "@/components/ui";
import { exigirTela } from "@/lib/auth/permissoes";
import { criarClienteServidor } from "@/lib/supabase/server";
import { salvarPermissoes } from "@/lib/gestao/acoes-usuarios";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Permissões" };

const PAPEIS = [
  { valor: "diretoria", rotulo: "Diretoria" },
  { valor: "voluntario", rotulo: "Voluntário" },
  { valor: "aluno", rotulo: "Aluno" },
  { valor: "membro", rotulo: "Membro" },
];

const TELAS = [
  { chave: "painel", rotulo: "Painel" },
  { chave: "conteudo", rotulo: "Conteúdo do site" },
  { chave: "atas", rotulo: "Atas de reunião" },
  { chave: "membros", rotulo: "Membros" },
  { chave: "compras", rotulo: "Documentos de compra/venda" },
  { chave: "contas_pagar", rotulo: "Contas a pagar" },
  { chave: "contas_receber", rotulo: "Contas a receber" },
  { chave: "relatorios", rotulo: "Relatórios" },
  { chave: "usuarios", rotulo: "Usuários" },
  { chave: "permissoes", rotulo: "Permissões" },
  { chave: "auditoria", rotulo: "Auditoria" },
  { chave: "audiencia", rotulo: "Audiência do site" },
];

export default async function PaginaPermissoes() {
  await exigirTela("permissoes");

  const supabase = await criarClienteServidor();
  const { data } = await supabase.from("permissoes").select("*");
  const atuais = data ?? [];

  const buscar = (role: string, tela: string) =>
    atuais.find((p) => p.role === role && p.tela_key === tela);

  const linhas = PAPEIS.flatMap((p) => TELAS.map((t) => `${p.valor}|${t.chave}`));

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-semibold tracking-tight text-texto">Permissões por tela</h1>
      <p className="mt-1 text-texto-suave">
        Isto controla o que cada perfil enxerga no menu e nas telas. Os dados em si continuam
        protegidos no banco, mesmo que alguém tente acessá-los por fora do sistema.
      </p>

      <form action={salvarPermissoes} className="mt-8">
        <input type="hidden" name="linhas" value={linhas.join(",")} />

        <Cartao className="overflow-x-auto">
          <CartaoCorpo className="p-0">
            <table className="w-full min-w-[46rem] text-sm">
              <thead>
                <tr className="border-b border-borda bg-marca-50/60">
                  <th className="px-5 py-3 text-left font-semibold text-texto">Tela</th>
                  {PAPEIS.map((p) => (
                    <th key={p.valor} className="px-4 py-3 text-center font-semibold text-texto">
                      {p.rotulo}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                {TELAS.map((t) => (
                  <tr key={t.chave}>
                    <td className="px-5 py-3 font-medium text-texto">{t.rotulo}</td>
                    {PAPEIS.map((p) => {
                      const chave = `${p.valor}|${t.chave}`;
                      const atual = buscar(p.valor, t.chave);
                      return (
                        <td key={chave} className="px-4 py-3">
                          <div className="flex justify-center gap-4">
                            <label className="flex items-center gap-1.5 text-xs text-texto-suave">
                              <input
                                type="checkbox"
                                name={`ver:${chave}`}
                                defaultChecked={atual?.ver ?? false}
                                className="h-4 w-4 rounded border-borda text-marca-600 focus:ring-marca-400"
                              />
                              ver
                            </label>
                            <label className="flex items-center gap-1.5 text-xs text-texto-suave">
                              <input
                                type="checkbox"
                                name={`editar:${chave}`}
                                defaultChecked={atual?.editar ?? false}
                                className="h-4 w-4 rounded border-borda text-marca-600 focus:ring-marca-400"
                              />
                              editar
                            </label>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </CartaoCorpo>
        </Cartao>

        <div className="mt-6">
          <Botao type="submit">Salvar permissões</Botao>
        </div>
      </form>
    </div>
  );
}
