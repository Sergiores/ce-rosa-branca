import type { Metadata } from "next";
import { PaginaManutencao } from "@/components/gestao/PaginaManutencao";
import { FormularioConvite } from "../FormularioConvite";
import type { MatrizPorPapel } from "@/components/gestao/SeletorAcessos";
import { exigirTela } from "@/lib/auth/permissoes";
import { criarClienteServidor } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Convidar usuário" };

export default async function ConvidarUsuario() {
  await exigirTela("usuarios", true);

  // A matriz inteira vai para o cliente porque a grade de telas precisa
  // recarregar o padrao quando a pessoa troca o perfil no formulario.
  // Sao 5 perfis por 13 telas: cabe sem peso.
  const supabase = await criarClienteServidor();
  const { data } = await supabase.from("permissoes").select("role, tela_key, ver, editar");

  const matrizPorPapel: MatrizPorPapel = {};
  for (const p of (data ?? []) as {
    role: string;
    tela_key: string;
    ver: boolean;
    editar: boolean;
  }[]) {
    matrizPorPapel[p.role] ??= {};
    matrizPorPapel[p.role][p.tela_key] = { ver: p.ver, editar: p.editar };
  }

  return (
    <PaginaManutencao
      voltarHref="/gestao/usuarios"
      voltarRotulo="Voltar aos usuários"
      titulo="Convidar usuário"
      descricao="A pessoa recebe um e-mail para criar a senha dela. Confira antes na lista se ela já não tem acesso."
    >
      <FormularioConvite matrizPorPapel={matrizPorPapel} />
    </PaginaManutencao>
  );
}
