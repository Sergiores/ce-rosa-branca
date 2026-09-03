"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Botao, Campo, Rotulo } from "@/components/ui";
import { criarClienteNavegador } from "@/lib/supabase/client";

export function FormularioLogin() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function aoEnviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    const supabase = criarClienteNavegador();
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });

    if (error) {
      setErro("E-mail ou senha inválidos.");
      setCarregando(false);
      return;
    }

    router.replace(params.get("redirecionar") ?? "/gestao");
    router.refresh();
  }

  return (
    <form onSubmit={aoEnviar} className="mt-6 space-y-4">
      <div>
        <Rotulo htmlFor="email">E-mail</Rotulo>
        <Campo
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
        />
      </div>

      <div>
        <Rotulo htmlFor="senha">Senha</Rotulo>
        <Campo
          id="senha"
          type="password"
          autoComplete="current-password"
          required
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="••••••••"
        />
      </div>

      {erro ? (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{erro}</p>
      ) : null}

      <Botao type="submit" className="w-full" disabled={carregando}>
        {carregando ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {carregando ? "Entrando..." : "Entrar"}
      </Botao>
    </form>
  );
}
