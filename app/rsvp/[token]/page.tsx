import Link from "next/link";
import { Logo } from "@/components/public/Logo";
import { RsvpConfirm } from "@/components/public/RsvpConfirm";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

interface GuestLookup {
  id: string;
  nome: string;
  status: string;
  eh_crianca: boolean;
}

export default async function RsvpTokenPage({ params }: { params: { token: string } }) {
  const supabase = createClient();
  let guest: GuestLookup | null = null;

  if (supabase) {
    const { data } = await supabase.rpc("hg_rsvp_lookup", { p_token: params.token });
    const rows = (data ?? []) as GuestLookup[];
    guest = rows[0] ?? null;
  }

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
        ) : guest ? (
          guest.status !== "pendente" ? (
            <p className="text-center text-muted">
              Este convite já foi respondido como{" "}
              <strong className="text-moss">{guest.status}</strong>. Precisa alterar? Fale com os noivos.
            </p>
          ) : (
            <RsvpConfirm token={params.token} nome={guest.nome} />
          )
        ) : (
          <p className="text-center text-muted">
            Convite não encontrado. Confira o link recebido ou fale com os noivos.
          </p>
        )}
      </div>
    </main>
  );
}
