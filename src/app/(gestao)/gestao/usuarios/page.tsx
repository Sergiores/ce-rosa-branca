import type { Metadata } from "next";
import { Cartao, CartaoCorpo, Etiqueta, Vazio } from "@/components/ui";
import { FormularioConvite } from "./FormularioConvite";
import { exigirTela } from "@/lib/auth/permissoes";
import { criarClienteServidor } from "@/lib/supabase/server";
import { alterarPapel, alternarAtivo } from "@/lib/gestao/acoes-usuarios";
import type { Perfil } from "@/lib/tipos";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Usuários" };

const PAPEIS = [
  { valor: "diretoria", rotulo: "Diretoria" },
  { valor: "voluntario", rotulo: "Voluntário" },
  { valor: "aluno", rotulo: "Aluno" },
  { valor: "membro", rotulo: "Membro" },
];

export default async function PaginaUsuarios() {
  const sessao = await exigirTela("usuarios");
  const podeEditar = sessao.podeEditar("usuarios");

  const supabase = await criarClienteServidor();
  const { data } = await supabase.from("profiles").select("*").order("nome");
  const usuarios = (data ?? []) as Perfil[];

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold tracking-tight text-texto">Usuários</h1>
      <p className="mt-1 text-texto-suave">
        O acesso é criado por convite. Cada perfil vê apenas as telas liberadas em Permissões.
      </p>

      {podeEditar ? (
        <Cartao className="mt-8">
          <CartaoCorpo className="sm:p-8">
            <h2 className="mb-5 font-semibold text-texto">Convidar usuário</h2>
            <FormularioConvite />
          </CartaoCorpo>
        </Cartao>
      ) : null}

      <h2 className="mb-4 mt-10 font-semibold text-texto">Usuários cadastrados</h2>
      {usuarios.length === 0 ? (
        <Vazio mensagem="Nenhum usuário cadastrado." />
      ) : (
        <Cartao className="divide-y divide-borda overflow-hidden">
          {usuarios.map((u) => (
            <div key={u.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-texto">{u.nome || "(sem nome)"}</p>
                <p className="truncate text-sm text-texto-suave">{u.email}</p>
              </div>

              {!u.ativo ? <Etiqueta tom="vermelho">Inativo</Etiqueta> : null}

              {podeEditar ? (
                <div className="flex items-center gap-2">
                  <form action={alterarPapel}>
                    <input type="hidden" name="id" value={u.id} />
                    <select
                      name="role"
                      defaultValue={u.role}
                      className="rounded-xl border border-borda bg-white px-3 py-2 text-sm"
                    >
                      {PAPEIS.map((p) => (
                        <option key={p.valor} value={p.valor}>
                          {p.rotulo}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="ml-2 rounded-full px-3 py-2 text-sm font-medium text-marca-700 hover:bg-marca-50"
                    >
                      Salvar
                    </button>
                  </form>

                  <form action={alternarAtivo}>
                    <input type="hidden" name="id" value={u.id} />
                    <input type="hidden" name="ativo" value={u.ativo ? "0" : "1"} />
                    <button
                      type="submit"
                      className="rounded-full px-3 py-2 text-sm font-medium text-texto-suave hover:bg-marca-50"
                    >
                      {u.ativo ? "Desativar" : "Ativar"}
                    </button>
                  </form>
                </div>
              ) : (
                <Etiqueta tom="cinza">
                  {PAPEIS.find((p) => p.valor === u.role)?.rotulo ?? u.role}
                </Etiqueta>
              )}
            </div>
          ))}
        </Cartao>
      )}
    </div>
  );
}
