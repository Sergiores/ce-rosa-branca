import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { criarClienteServidor } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Sem acesso" };

/**
 * Destino de quem esta autenticado mas nao tem perfil nesta casa — o caso de
 * uma conta criada em outra aplicacao do mesmo banco. Sem esta pagina, o
 * middleware e o guard de /gestao ficavam se devolvendo um ao outro.
 */
async function sair() {
  "use server";
  const supabase = await criarClienteServidor();
  await supabase.auth.signOut();
  redirect("/entrar");
}

export default async function PaginaSemAcesso({
  searchParams,
}: {
  searchParams: Promise<{ motivo?: string }>;
}) {
  const { motivo } = await searchParams;
  const inativo = motivo === "inativo";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-marca-100 via-marca-50 to-fundo px-5 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-marca-600 text-sm font-semibold text-white shadow-md shadow-marca-600/25">
            RB
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold text-texto">Casa Espírita</span>
            <span className="block text-sm text-marca-600">Rosa Branca</span>
          </span>
        </Link>

        <div className="rounded-3xl border border-borda bg-white p-8 shadow-lg shadow-marca-900/5">
          <h1 className="text-xl font-semibold text-texto">
            {inativo ? "Acesso suspenso" : "Esta conta não tem acesso"}
          </h1>
          <p className="mt-3 text-sm text-texto-suave">
            {inativo
              ? "Seu acesso à área de gestão está desativado. Fale com a diretoria para reativar."
              : "Você está autenticado, mas esta conta não está cadastrada na área de gestão da Casa Espírita Rosa Branca. Se você deveria ter acesso, peça à diretoria para enviar um convite para o seu e-mail."}
          </p>

          <form action={sair} className="mt-6">
            <button
              type="submit"
              className="w-full rounded-full bg-marca-600 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-marca-600/25 hover:bg-marca-700"
            >
              Sair desta conta
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm">
          <Link href="/" className="text-marca-700 hover:text-marca-800">
            Voltar ao site
          </Link>
        </p>
      </div>
    </div>
  );
}
