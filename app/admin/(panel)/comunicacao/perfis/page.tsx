import Link from "next/link";
import { PageTitle, Panel, Notice } from "@/components/admin/ui";
import { listGuestsBasic } from "@/lib/comm-data";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

async function comProfileIds(): Promise<Set<string>> {
  const supabase = createClient();
  if (!supabase) return new Set();
  const { data } = await supabase.from("hg_guest_comm_profiles").select("guest_id");
  return new Set((data ?? []).map((p: { guest_id: string }) => p.guest_id));
}

export default async function PerfisPage() {
  const [guests, comProfile] = await Promise.all([listGuestsBasic(), comProfileIds()]);
  return (
    <>
      <div className="mb-4"><Link href="/admin/comunicacao" className="text-sm text-olive underline">← Comunicação</Link></div>
      <PageTitle>Perfis de comunicação</PageTitle>
      {!isSupabaseConfigured && <Notice>Conecte o Supabase e faça login para editar os perfis.</Notice>}
      <Notice>
        O perfil define como falamos com cada pessoa (tom, tratamento, consentimento, história autorizada). O que
        estiver vazio pode herdar o contexto da família. Nada é inventado.
      </Notice>

      <Panel title={`Convidados (${guests.length})`}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead><tr>{["Nome", "Lado", "RSVP", "Perfil", ""].map((h) => (
              <th key={h} className="bg-cream px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-moss">{h}</th>
            ))}</tr></thead>
            <tbody>
              {guests.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-muted">Nenhum convidado ainda.</td></tr>}
              {guests.map((g) => (
                <tr key={g.id} className="border-t border-line hover:bg-ivory">
                  <td className="px-4 py-2.5 font-medium">{g.nome}</td>
                  <td className="px-4 py-2.5 capitalize text-muted">{g.lado ?? "—"}</td>
                  <td className="px-4 py-2.5 text-muted">{g.status}</td>
                  <td className="px-4 py-2.5">{comProfile.has(g.id) ? <span className="text-success">definido</span> : <span className="text-muted">—</span>}</td>
                  <td className="px-4 py-2.5"><Link href={`/admin/comunicacao/perfis/${g.id}`} className="text-xs text-olive underline">editar</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
