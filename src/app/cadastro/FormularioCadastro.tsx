"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, MailCheck } from "lucide-react";
import { Botao, Campo, Rotulo } from "@/components/ui";
import { criarClienteNavegador } from "@/lib/supabase/client";
import { SCHEMA_DB } from "@/lib/supabase/schema";

export function FormularioCadastro() {
  const params = useSearchParams();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function aoEnviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (senha.length < 8) {
      setErro("A senha deve ter ao menos 8 caracteres.");
      return;
    }

    setCarregando(true);
    const supabase = criarClienteNavegador();
    const redirecionar = params.get("redirecionar") ?? "/estudo";
    const emailRedirectTo = `${process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin}${redirecionar}`;

    // `projeto` e obrigatorio: auth.users e compartilhado com os outros
    // projetos deste banco, e a trigger so cria o perfil aqui quando o
    // metadata marca este schema. `origem` diz para a trigger criar a
    // conta como 'visitante' — sem tela de gestao nenhuma — em vez de
    // 'membro'. O papel nunca vem cru do que o usuario manda.
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        emailRedirectTo,
        data: { nome, projeto: SCHEMA_DB, origem: "cadastro-publico" },
      },
    });

    if (error) {
      setErro(
        error.message.includes("already")
          ? "Já existe uma conta com este e-mail. Tente entrar."
          : error.message,
      );
      setCarregando(false);
      return;
    }

    // Sem confirmacao de e-mail habilitada, o Supabase ja devolve sessao.
    if (data.session) {
      window.location.href = redirecionar;
      return;
    }

    setEnviado(true);
    setCarregando(false);
  }

  if (enviado) {
    return (
      <div className="mt-6 flex items-start gap-3 rounded-xl bg-marca-50 px-4 py-4 text-sm text-marca-800">
        <MailCheck className="mt-0.5 h-5 w-5 shrink-0" />
        <p>
          Quase lá. Enviamos um link de confirmação para <strong>{email}</strong>. Abra-o para
          concluir o cadastro e entrar.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={aoEnviar} className="mt-6 space-y-4">
      <div>
        <Rotulo htmlFor="nome">Nome</Rotulo>
        <Campo
          id="nome"
          autoComplete="name"
          required
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
      </div>

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
          autoComplete="new-password"
          required
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="Ao menos 8 caracteres"
        />
      </div>

      {erro ? (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{erro}</p>
      ) : null}

      <Botao type="submit" className="w-full" disabled={carregando}>
        {carregando ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {carregando ? "Criando conta..." : "Criar conta"}
      </Botao>
    </form>
  );
}
