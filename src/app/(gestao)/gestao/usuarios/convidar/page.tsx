import type { Metadata } from "next";
import { PaginaManutencao } from "@/components/gestao/PaginaManutencao";
import { FormularioConvite } from "../FormularioConvite";
import { exigirTela } from "@/lib/auth/permissoes";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Convidar usuário" };

export default async function ConvidarUsuario() {
  await exigirTela("usuarios", true);

  return (
    <PaginaManutencao
      voltarHref="/gestao/usuarios"
      voltarRotulo="Voltar aos usuários"
      titulo="Convidar usuário"
      descricao="A pessoa recebe um e-mail para criar a senha dela. Confira antes na lista se ela já não tem acesso."
    >
      <FormularioConvite />
    </PaginaManutencao>
  );
}
