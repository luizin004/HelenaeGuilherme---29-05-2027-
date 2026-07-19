import Link from "next/link";
import { Logo } from "@/components/public/Logo";
import { RsvpConfirm, type GrupoIntegrante } from "@/components/public/RsvpConfirm";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

interface GrupoResult {
  aberto: boolean;
  integrantes: GrupoIntegrante[];
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function RsvpTokenPage({ params }: { params: { token: string } }) {
  const supabase = createClient();
  let grupo: GrupoResult | null = null;

  // Evita chamada ao banco com token malformado (não-UUID → convite inexistente).
  if (supabase && UUID_RE.test(params.token)) {
    const { data } = await supabase.rpc("hg_rsvp_group", { p_token: params.token });
    if (data && typeof data === "object" && Array.isArray((data as GrupoResult).integrantes)) {
      grupo = data as GrupoResult;
    }
  }

  const integrantes = grupo?.integrantes ?? [];
  const aberto = grupo?.aberto ?? true;

  return (
    <main className="flex min-h-screen items-center justify-center bg-ivory px-6 py-16">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-soft">
        <Link href="/" className="mb-6 block">
          <Logo className="mx-auto h-14 w-auto" />
        </Link>
        <p className="mb-1 text-center text-xs uppercase tracking-[0.3em] text-olive">Confirmação de presença</p>
        <h1 className="mb-6 text-center font-serif text-3xl text-moss">Helena &amp; Guilherme</h1>

        {!isSupabaseConfigured ? (
          <p className="text-center text-muted">
            Confirmação disponível quando o backend estiver ativo. Use o link do seu convite.
          </p>
        ) : integrantes.length === 0 ? (
          <p className="text-center text-muted">
            Convite não encontrado. Confira o link recebido ou fale com os noivos.
          </p>
        ) : !aberto ? (
          <p className="text-center text-muted">
            O prazo para confirmação (<strong className="text-moss">30/03/2027</strong>) foi encerrado.
            Precisa ajustar sua resposta? Fale com os noivos.
          </p>
        ) : (
          <RsvpConfirm token={params.token} integrantes={integrantes} />
        )}
      </div>
    </main>
  );
}
