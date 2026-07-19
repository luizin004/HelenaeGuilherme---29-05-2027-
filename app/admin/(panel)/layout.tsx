import { redirect } from "next/navigation";
import { Sidebar } from "@/components/admin/Sidebar";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { signOut } from "@/app/actions/auth";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();

  let email: string | undefined;
  if (supabase) {
    const { data } = await supabase.auth.getUser();
    const user = data?.user;
    if (!user) redirect("/admin/login?next=/admin");
    // Autorização: só usuários cadastrados em hg_profiles acessam o painel do casamento.
    const { data: profile } = await supabase
      .from("hg_profiles")
      .select("papel")
      .eq("id", user.id)
      .maybeSingle();
    if (!profile) redirect("/admin/login?erro=sem_acesso");
    email = user.email;
  }

  return (
    <div className="flex min-h-screen bg-ivory">
      <Sidebar />
      <div className="flex flex-1 flex-col transition-[margin] md:ml-[var(--sb,250px)]">
        <header className="sticky top-0 z-40 flex items-center justify-end gap-4 border-b border-line bg-white px-6 py-3.5">
          {!isSupabaseConfigured && (
            <span className="rounded-full bg-gold-soft px-3 py-1 text-xs text-moss">
              modo demonstração
            </span>
          )}
          {email && <span className="text-sm text-muted">{email}</span>}
          {isSupabaseConfigured && (
            <form action={signOut}>
              <button className="rounded border border-line px-3 py-1.5 text-xs uppercase tracking-wide text-moss hover:bg-cream">
                Sair
              </button>
            </form>
          )}
        </header>
        <div className="mx-auto w-full max-w-6xl p-6">{children}</div>
      </div>
    </div>
  );
}
