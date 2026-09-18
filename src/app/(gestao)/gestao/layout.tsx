import Link from "next/link";
import { redirect } from "next/navigation";
import { NavegacaoLateral } from "@/components/gestao/NavegacaoLateral";
import { exigirSessao, type TelaKey } from "@/lib/auth/permissoes";
import { criarClienteServidor } from "@/lib/supabase/server";

const NOME_PAPEL: Record<string, string> = {
  diretoria: "Diretoria",
  voluntario: "Voluntário",
  aluno: "Aluno",
  membro: "Membro",
};

async function sair() {
  "use server";
  const supabase = await criarClienteServidor();
  await supabase.auth.signOut();
  redirect("/entrar");
}

export default async function LayoutGestao({ children }: { children: React.ReactNode }) {
  const sessao = await exigirSessao();
  const telasVisiveis = sessao.permissoes.filter((p) => p.ver).map((p) => p.tela_key as TelaKey);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-borda bg-white/90 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between gap-4 px-5">
          <Link href="/gestao" className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-marca-600 text-xs font-semibold text-white">
              RB
            </span>
            <span className="text-sm font-semibold text-texto">Gestão · Rosa Branca</span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-texto">{sessao.perfil.nome || sessao.perfil.email}</p>
              <p className="text-xs text-marca-600">{NOME_PAPEL[sessao.perfil.role] ?? sessao.perfil.role}</p>
            </div>
            <Link
              href="/"
              className="hidden rounded-full border border-marca-200 px-4 py-2 text-sm font-medium text-marca-700 hover:bg-marca-50 sm:inline-flex"
            >
              Ver site
            </Link>
            <form action={sair}>
              <button
                type="submit"
                className="rounded-full px-4 py-2 text-sm font-medium text-texto-suave hover:bg-marca-50 hover:text-marca-700"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <NavegacaoLateral telasVisiveis={telasVisiveis} />
        <main className="min-w-0 flex-1 p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
