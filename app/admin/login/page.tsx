"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { Logo } from "@/components/public/Logo";

/** Traço 24×24, mesmo estilo dos ícones do painel. */
function OlhoAberto() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
      <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </svg>
  );
}

function OlhoFechado() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
      <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.8" />
      <path d="m4 20 16-16" />
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const acessoNegado = params.get("erro") === "sem_acesso";
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [verSenha, setVerSenha] = useState(false);
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
          <div className="relative">
            <input
              id="senha"
              type={verSenha ? "text" : "password"}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="field-input pr-11"
              required={isSupabaseConfigured}
            />
            <button
              type="button"
              onClick={() => setVerSenha((v) => !v)}
              aria-label={verSenha ? "Ocultar senha" : "Mostrar senha"}
              aria-pressed={verSenha}
              title={verSenha ? "Ocultar senha" : "Mostrar senha"}
              className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-2 text-muted transition hover:text-moss focus:outline-none focus:ring-2 focus:ring-olive/40"
            >
              {verSenha ? <OlhoFechado /> : <OlhoAberto />}
            </button>
          </div>
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
