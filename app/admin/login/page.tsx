"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { Logo } from "@/components/public/Logo";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const acessoNegado = params.get("erro") === "sem_acesso";
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    const supabase = createClient();
    if (!supabase) {
      // Modo demonstração — entra direto no painel.
      router.push(params.get("next") || "/admin");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setLoading(false);

    if (error) {
      setErro("E-mail ou senha inválidos.");
      return;
    }
    router.push(params.get("next") || "/admin");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-moss-deep px-6">
      <form onSubmit={submit} className="w-full max-w-sm rounded-xl bg-ivory p-8 shadow-soft">
        <Logo className="mx-auto mb-4 h-16 w-auto" />
        <h1 className="mb-1 text-center font-serif text-2xl text-moss">Painel dos noivos</h1>
        <p className="mb-6 text-center text-sm text-muted">Helena &amp; Guilherme</p>

        {!isSupabaseConfigured && (
          <p className="mb-4 rounded bg-gold-soft px-3 py-2 text-center text-xs text-moss">
            Modo demonstração — clique em entrar para explorar o painel.
          </p>
        )}

        <div className="mb-4 flex flex-col gap-1.5">
          <label htmlFor="email" className="field-label">E-mail</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field-input" required={isSupabaseConfigured} />
        </div>
        <div className="mb-5 flex flex-col gap-1.5">
          <label htmlFor="senha" className="field-label">Senha</label>
          <input id="senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} className="field-input" required={isSupabaseConfigured} />
        </div>

        {acessoNegado && (
          <p className="mb-4 text-sm text-danger">Esta conta não tem acesso ao painel do casamento.</p>
        )}
        {erro && <p className="mb-4 text-sm text-danger">{erro}</p>}

        <button type="submit" disabled={loading} className="btn btn-dark w-full disabled:opacity-60">
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-moss-deep" />}>
      <LoginForm />
    </Suspense>
  );
}
