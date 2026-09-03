"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Botao, Campo, Rotulo } from "@/components/ui";
import { criarClienteNavegador } from "@/lib/supabase/client";

export function FormularioSenha() {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function aoEnviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (senha.length < 8) {
      setErro("A senha deve ter ao menos 8 caracteres.");
      return;
    }
    if (senha !== confirmacao) {
      setErro("As senhas não conferem.");
      return;
    }

    setCarregando(true);
    const supabase = criarClienteNavegador();
    const { error } = await supabase.auth.updateUser({ password: senha });

    if (error) {
      setErro(
        error.message.includes("session")
          ? "Link expirado ou inválido. Peça um novo convite à diretoria."
          : error.message,
      );
      setCarregando(false);
      return;
    }

    router.replace("/gestao");
    router.refresh();
  }

  return (
    <form onSubmit={aoEnviar} className="mt-6 space-y-4">
      <div>
        <Rotulo htmlFor="senha">Nova senha</Rotulo>
        <Campo
          id="senha"
          type="password"
          autoComplete="new-password"
          required
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />
      </div>

      <div>
        <Rotulo htmlFor="confirmacao">Repita a senha</Rotulo>
        <Campo
          id="confirmacao"
          type="password"
          autoComplete="new-password"
          required
          value={confirmacao}
          onChange={(e) => setConfirmacao(e.target.value)}
        />
      </div>

      {erro ? (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{erro}</p>
      ) : null}

      <Botao type="submit" className="w-full" disabled={carregando}>
        {carregando ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {carregando ? "Salvando..." : "Salvar senha"}
      </Botao>
    </form>
  );
}
