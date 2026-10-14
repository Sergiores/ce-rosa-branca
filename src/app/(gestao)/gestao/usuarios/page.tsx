import type { Metadata } from "next";
import { KeyRound, SlidersHorizontal, UserPlus } from "lucide-react";
import Link from "next/link";
import { Cartao, Etiqueta, Vazio } from "@/components/ui";
import { exigirTela } from "@/lib/auth/permissoes";
import { criarClienteServidor } from "@/lib/supabase/server";
import { contarExcecoes } from "@/lib/gestao/permissoes-usuario";
import type { Perfil } from "@/lib/tipos";
import { AcoesUsuario } from "./AcoesUsuario";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Usuários" };

const PAPEIS = [
  { valor: "diretoria", rotulo: "Diretoria" },
  { valor: "voluntario", rotulo: "Voluntário" },
  { valor: "aluno", rotulo: "Aluno" },
  { valor: "membro", rotulo: "Membro" },
];

function LinhaUsuario({
  usuario,
  podeEditar,
  excecoes = 0,
  podeRedefinirSenha = false,
}: {
  usuario: Perfil;
  podeEditar: boolean;
  excecoes?: number;
  podeRedefinirSenha?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 px-5 py-4">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-texto">{usuario.nome || "(sem nome)"}</p>
        <p className="truncate text-sm text-texto-suave">{usuario.email}</p>
      </div>

      {excecoes > 0 ? (
        <Etiqueta tom="ambar">
          {excecoes} {excecoes === 1 ? "acesso ajustado" : "acessos ajustados"}
        </Etiqueta>
      ) : null}
      {!usuario.ativo ? <Etiqueta tom="vermelho">Inativo</Etiqueta> : null}

      {podeEditar ? (
        <div className="flex items-center gap-2">
          <AcoesUsuario id={usuario.id} papel={usuario.role} ativo={usuario.ativo} />

          <Link
            href={`/gestao/usuarios/${usuario.id}/acessos`}
            aria-label="Ajustar telas que esta pessoa acessa"
            title="Ajustar telas que esta pessoa acessa"
            className="grid h-9 w-9 place-items-center rounded-full text-marca-700 hover:bg-marca-100"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Link>

          {podeRedefinirSenha ? (
            <Link
              href={`/gestao/usuarios/${usuario.id}/senha`}
              aria-label="Redefinir a senha desta pessoa"
              title="Redefinir a senha desta pessoa"
              className="grid h-9 w-9 place-items-center rounded-full text-marca-700 hover:bg-marca-100"
            >
              <KeyRound className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
      ) : (
        <Etiqueta tom="cinza">
          {PAPEIS.find((p) => p.valor === usuario.role)?.rotulo ?? usuario.role}
        </Etiqueta>
      )}
    </div>
  );
}

export default async function PaginaUsuarios({
  searchParams,
}: {
  searchParams: Promise<{ senha?: string }>;
}) {
  const { senha } = await searchParams;
  const sessao = await exigirTela("usuarios");
  const podeEditar = sessao.podeEditar("usuarios");
  // Trocar senha alheia e mais forte que editar usuarios: so diretoria.
  const podeRedefinirSenha = podeEditar && sessao.perfil.role === "diretoria";

  const supabase = await criarClienteServidor();
  const [{ data }, excecoes] = await Promise.all([
    supabase.from("profiles").select("*").order("nome"),
    contarExcecoes(),
  ]);
  const todos = (data ?? []) as Perfil[];

  // Visitante nasce sozinho pelo cadastro público (/cadastro), sem convite da
  // diretoria. Misturado à lista de convidados, ele vira ruído: é gente que
  // ninguém aqui decidiu trazer. Separado, esta tela continua mostrando em
  // primeiro lugar só quem a casa de fato convidou.
  const usuarios = todos.filter((u) => u.role !== "visitante");
  const visitantes = todos.filter((u) => u.role === "visitante");

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-texto">Usuários</h1>
          <p className="mt-1 text-texto-suave">
            O acesso é criado por convite. Cada perfil vê apenas as telas liberadas em Permissões.
          </p>
        </div>
        {podeEditar ? (
          <Link
            href="/gestao/usuarios/convidar"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-marca-600 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-marca-600/20 hover:bg-marca-700"
          >
            <UserPlus className="h-4 w-4" /> Convidar usuário
          </Link>
        ) : null}
      </div>

      {senha === "1" ? (
        <p className="mt-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Senha alterada e registrada na auditoria. Avise a pessoa da senha nova por um canal seguro.
        </p>
      ) : null}

      <h2 className="mb-4 mt-8 font-semibold text-texto">Usuários cadastrados</h2>
      {usuarios.length === 0 ? (
        <Vazio mensagem="Nenhum usuário cadastrado." />
      ) : (
        <Cartao className="divide-y divide-borda overflow-hidden">
          {usuarios.map((u) => (
            <LinhaUsuario
              key={u.id}
              usuario={u}
              podeEditar={podeEditar}
              excecoes={excecoes.get(u.id) ?? 0}
              podeRedefinirSenha={podeRedefinirSenha}
            />
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
                <LinhaUsuario
              key={u.id}
              usuario={u}
              podeEditar={podeEditar}
              excecoes={excecoes.get(u.id) ?? 0}
              podeRedefinirSenha={podeRedefinirSenha}
            />
              ))}
            </Cartao>
          )}
        </div>
      </details>

    </div>
  );
}
