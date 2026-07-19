import Link from "next/link";
import { PageTitle, Panel, Notice } from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function listPairs() {
  const supabase = createClient();
  if (!supabase) return [];
  const { data } = await supabase.from("hg_wedding_party_pairs").select("*").order("criado_em");
  return (data ?? []) as { id: string; nome: string | null; tipo: string; observacao: string | null }[];
}

export default async function DuplasPage() {
  const pares = await listPairs();
  return (
    <>
      <div className="mb-4"><Link href="/admin/padrinhos" className="text-sm text-olive underline">← Padrinhos</Link></div>
      <PageTitle>Duplas e casais</PageTitle>
      <Notice>Agrupe padrinhos em <strong>duplas</strong> ou <strong>casais</strong> para mensagens conjuntas (ex.: “Carlos e Mariana”).</Notice>
      <Panel title={`Duplas (${pares.length})`}>
        <div className="p-6">
          {pares.length === 0 ? (
            <p className="text-sm text-muted">Nenhuma dupla cadastrada ainda.</p>
          ) : (
            <ul className="grid gap-2">
              {pares.map((p) => (
                <li key={p.id} className="rounded-lg border border-line bg-white px-4 py-3">
                  <span className="font-medium text-moss">{p.nome ?? "Dupla"}</span>
                  <span className="ml-2 text-xs uppercase tracking-wide text-muted">{p.tipo}</span>
                  {p.observacao && <div className="text-sm text-muted">{p.observacao}</div>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Panel>
    </>
  );
}
