import { Notice, PageTitle, Panel } from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

interface Profile {
  id: string;
  nome: string | null;
  email: string | null;
  papel: string | null;
  criado_em: string;
}

export default async function UsuariosPage() {
  const supabase = createClient();
  let membros: Profile[] = [];
  if (supabase) {
    const { data } = await supabase.from("hg_profiles").select("id, nome, email, papel, criado_em").order("criado_em");
    membros = (data ?? []) as Profile[];
  }

  return (
    <>
      <PageTitle>Usuários & acesso</PageTitle>

      {!isSupabaseConfigured ? (
        <Notice>Conecte o Supabase e faça login para ver os usuários.</Notice>
      ) : (
        <Notice>
          Apenas quem está nesta lista (<code>hg_profiles</code>) acessa o painel — os demais usuários
          do projeto compartilhado ficam de fora (RLS por membro). Para adicionar um usuário: crie o
          acesso no Supabase (Auth) e inclua o perfil aqui. Perfis granulares (Financeiro, Cerimonial,
          Recepção) são o próximo passo e dependem da configuração de Auth.
        </Notice>
      )}

      <Panel title={`Membros com acesso (${membros.length})`}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {["Nome", "E-mail", "Papel"].map((h) => (
                  <th key={h} className="whitespace-nowrap bg-cream px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-moss">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {membros.length === 0 && (
                <tr><td colSpan={3} className="px-6 py-10 text-center text-muted">Faça login para visualizar (dados protegidos por RLS).</td></tr>
              )}
              {membros.map((m) => (
                <tr key={m.id} className="border-t border-line hover:bg-ivory">
                  <td className="px-6 py-3 font-medium">{m.nome || "—"}</td>
                  <td className="px-6 py-3 text-muted">{m.email || "—"}</td>
                  <td className="px-6 py-3">
                    <span className="inline-block rounded-full bg-cream px-3 py-0.5 text-xs uppercase tracking-wide text-moss">{m.papel || "admin"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
