import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { PaginaManutencao } from "@/components/gestao/PaginaManutencao";
import { exigirTela } from "@/lib/auth/permissoes";
import { criarClienteServidor } from "@/lib/supabase/server";
import { FormularioSenhaUsuario } from "./FormularioSenhaUsuario";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Redefinir senha" };

export default async function RedefinirSenha({ params }: { params: Promise<{ id: string }> }) {
  // A acao confere tudo de novo; isto so evita mostrar a tela a quem nao pode.
  const sessao = await exigirTela("usuarios", true);
  if (sessao.perfil.role !== "diretoria") redirect("/gestao/usuarios");

  const { id } = await params;
  const supabase = await criarClienteServidor();
  const { data: perfil } = await supabase
    .from("profiles")
    .select("id, nome, email")
    .eq("id", id)
    .maybeSingle();
  if (!perfil) notFound();

  return (
    <PaginaManutencao
      voltarHref="/gestao/usuarios"
      voltarRotulo="Voltar aos usuários"
      titulo="Redefinir senha"
      descricao={`${perfil.nome || "(sem nome)"} · ${perfil.email ?? ""}. A troca fica registrada na auditoria, com quem fez e quando. A senha em si não é guardada em lugar nenhum.`}
    >
      <FormularioSenhaUsuario id={perfil.id} />
    </PaginaManutencao>
  );
}
