import Link from "next/link";
import { PageTitle, Panel, Notice } from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function listGroups() {
  const supabase = createClient();
  if (!supabase) return [];
  const { data } = await supabase.from("hg_wedding_party_groups").select("*").order("criado_em");
  return (data ?? []) as { id: string; nome: string; descricao: string | null }[];
}

export default async function GruposPadrinhosPage() {
  const grupos = await listGroups();
  return (
    <>
      <div className="mb-4"><Link href="/admin/padrinhos" className="text-sm text-olive underline">← Padrinhos</Link></div>
      <PageTitle>Grupos de padrinhos</PageTitle>
      <Notice>Organize padrinhos em grupos (ex.: “Amigos da faculdade”) para segmentar comunicações.</Notice>
      <Panel title={`Grupos (${grupos.length})`}>
        <div className="p-6">
          {grupos.length === 0 ? (
            <p className="text-sm text-muted">Nenhum grupo cadastrado ainda.</p>
          ) : (
            <ul className="grid gap-2">
              {grupos.map((g) => (
                <li key={g.id} className="rounded-lg border border-line bg-white px-4 py-3">
                  <span className="font-medium text-moss">{g.nome}</span>
                  {g.descricao && <div className="text-sm text-muted">{g.descricao}</div>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Panel>
    </>
  );
}
