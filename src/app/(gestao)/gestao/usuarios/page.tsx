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

function LinhaUsuario({ usuario, podeEditar }: { usuario: Perfil; podeEditar: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-4 px-5 py-4">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-texto">{usuario.nome || "(sem nome)"}</p>
        <p className="truncate text-sm text-texto-suave">{usuario.email}</p>
      </div>

      {!usuario.ativo ? <Etiqueta tom="vermelho">Inativo</Etiqueta> : null}

      {podeEditar ? (
        <div className="flex items-center gap-2">
          <form action={alterarPapel}>
            <input type="hidden" name="id" value={usuario.id} />
            <select
              name="role"
              defaultValue={usuario.role}
              className="rounded-xl border border-borda bg-white px-3 py-2 text-sm"
            >
              {/* "Visitante" nunca é uma opção de destino — é papel de
                  origem única, do cadastro público. Aparece aqui só quando
                  já é o papel atual, para o select não cair sozinho na
                  primeira opção da lista e o botão Salvar não promover
                  ninguém por engano. Selecionar e salvar com ela marcada
                  não faz nada: o servidor recusa esse valor. */}
              {usuario.role === "visitante" ? (
                <option value="visitante">Visitante (cadastro público)</option>
              ) : null}
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
            <input type="hidden" name="id" value={usuario.id} />
            <input type="hidden" name="ativo" value={usuario.ativo ? "0" : "1"} />
            <button
              type="submit"
              className="rounded-full px-3 py-2 text-sm font-medium text-texto-suave hover:bg-marca-50"
            >
              {usuario.ativo ? "Desativar" : "Ativar"}
            </button>
          </form>
        </div>
      ) : (
        <Etiqueta tom="cinza">
          {PAPEIS.find((p) => p.valor === usuario.role)?.rotulo ?? usuario.role}
        </Etiqueta>
      )}
    </div>
  );
}

export default async function PaginaUsuarios() {
  const sessao = await exigirTela("usuarios");
  const podeEditar = sessao.podeEditar("usuarios");

  const supabase = await criarClienteServidor();
  const { data } = await supabase.from("profiles").select("*").order("nome");
  const todos = (data ?? []) as Perfil[];

  // Visitante nasce sozinho pelo cadastro público (/cadastro), sem convite da
  // diretoria. Misturado à lista de convidados, ele vira ruído: é gente que
  // ninguém aqui decidiu trazer. Separado, esta tela continua mostrando em
  // primeiro lugar só quem a casa de fato convidou.
  const usuarios = todos.filter((u) => u.role !== "visitante");
  const visitantes = todos.filter((u) => u.role === "visitante");

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
            <LinhaUsuario key={u.id} usuario={u} podeEditar={podeEditar} />
          ))}
        </Cartao>
      )}

      {/* Fechada por padrão: quem entra aqui veio gerenciar a equipe, não
          conferir quem se cadastrou sozinho para favoritar o estudo. */}
      <details className="mt-10 [&_summary::-webkit-details-marker]:hidden">
        <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold text-texto">
          Visitantes do site
          <Etiqueta tom="cinza">{visitantes.length}</Etiqueta>
        </summary>
        <p className="mt-1 text-sm text-texto-suave">
          Contas criadas pela própria pessoa em <code>/cadastro</code>, sem tela de gestão
          nenhuma — só para favoritar questões do estudo. Promova para um papel da equipe se
          precisar dar acesso à gestão.
        </p>

        <div className="mt-4">
          {visitantes.length === 0 ? (
            <Vazio mensagem="Ninguém se cadastrou pelo site ainda." />
          ) : (
            <Cartao className="divide-y divide-borda overflow-hidden">
              {visitantes.map((u) => (
                <LinhaUsuario key={u.id} usuario={u} podeEditar={podeEditar} />
              ))}
            </Cartao>
          )}
        </div>
      </details>
    </div>
  );
}
