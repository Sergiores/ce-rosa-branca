import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Botao, Etiqueta } from "@/components/ui";
import { PaginaManutencao } from "@/components/gestao/PaginaManutencao";
import { SeletorAcessos, type MatrizPorPapel } from "@/components/gestao/SeletorAcessos";
import { exigirTela } from "@/lib/auth/permissoes";
import { criarClienteServidor } from "@/lib/supabase/server";
import { excecoesDoUsuario } from "@/lib/gestao/permissoes-usuario";
import { salvarAcessosDoUsuario } from "@/lib/gestao/acoes-usuarios";
import type { Perfil } from "@/lib/tipos";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Acessos do usuário" };

const NOME_PAPEL: Record<string, string> = {
  diretoria: "Diretoria",
  voluntario: "Voluntário",
  aluno: "Aluno",
  membro: "Membro",
  visitante: "Visitante",
};

export default async function AcessosDoUsuario({ params }: { params: Promise<{ id: string }> }) {
  await exigirTela("usuarios", true);
  const { id } = await params;

  const supabase = await criarClienteServidor();
  const { data: perfilBruto } = await supabase
    .from("profiles")
    .select("id, nome, email, telefone, role, ativo")
    .eq("id", id)
    .maybeSingle();
  if (!perfilBruto) notFound();
  const perfil = perfilBruto as Perfil;

  const [{ data: matriz }, excecoes] = await Promise.all([
    supabase.from("permissoes").select("role, tela_key, ver, editar"),
    excecoesDoUsuario(id),
  ]);

  const matrizPorPapel: MatrizPorPapel = {};
  for (const p of (matriz ?? []) as {
    role: string;
    tela_key: string;
    ver: boolean;
    editar: boolean;
  }[]) {
    matrizPorPapel[p.role] ??= {};
    matrizPorPapel[p.role][p.tela_key] = { ver: p.ver, editar: p.editar };
  }

  const excecoesIniciais = Object.fromEntries(
    [...excecoes.entries()].map(([tela, a]) => [tela, { ver: a.ver, editar: a.editar }]),
  );

  return (
    <PaginaManutencao
      voltarHref="/gestao/usuarios"
      voltarRotulo="Voltar aos usuários"
      titulo={`Acessos de ${perfil.nome || perfil.email || "usuário"}`}
      descricao={`Perfil ${NOME_PAPEL[perfil.role] ?? perfil.role}. O perfil define o padrão; aqui você ajusta o que for diferente só para esta pessoa.`}
      acoes={
        excecoes.size > 0 ? (
          <Etiqueta tom="ambar">
            {excecoes.size} {excecoes.size === 1 ? "exceção" : "exceções"}
          </Etiqueta>
        ) : (
          <Etiqueta tom="cinza">segue o perfil</Etiqueta>
        )
      }
    >
      <form action={salvarAcessosDoUsuario} className="space-y-5">
        <input type="hidden" name="user_id" value={perfil.id} />
        {/* O papel vai junto porque e a base da comparacao no servidor.
            Trocar o papel em si continua sendo na lista de usuarios. */}
        <input type="hidden" name="role" value={perfil.role} />

        <SeletorAcessos
          papel={perfil.role}
          matrizPorPapel={matrizPorPapel}
          excecoes={excecoesIniciais}
        />

        <div className="border-t border-borda pt-5">
          <Botao type="submit">Salvar acessos</Botao>
        </div>
      </form>
    </PaginaManutencao>
  );
}
