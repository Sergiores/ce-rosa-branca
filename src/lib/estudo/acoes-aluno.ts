"use server";

import { revalidatePath } from "next/cache";
import { vincularMeuCadastro } from "@/lib/estudo/aluno";

/**
 * Tenta ligar a conta logada a um cadastro de aluno com o mesmo e-mail.
 * A decisão inteira é da função no banco: ela lê o e-mail do JWT, não daqui,
 * e só pega cadastro que ainda não tem dono.
 */
export async function tentarVincularCadastro(): Promise<string | null> {
  const id = await vincularMeuCadastro();
  if (id) revalidatePath("/aluno");
  return id;
}
