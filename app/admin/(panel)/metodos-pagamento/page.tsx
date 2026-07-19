import { Notice, Panel } from "@/components/admin/ui";
import { PageHeader } from "@/components/admin/finance/ui";
import { alternarMetodo } from "@/app/actions/finance-config";
import { loadFinance } from "@/lib/finance-core";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export default async function MetodosPagamentoPage() {
  const d = await loadFinance();
  const uso = new Map<string, number>();
  for (const p of d.pagamentos) {
    if (p.estornado_em || !p.metodo_id) continue;
    uso.set(p.metodo_id, (uso.get(p.metodo_id) ?? 0) + 1);
  }

  return (
    <>
      <PageHeader
        title="Métodos de pagamento"
        description="Formas de pagamento disponíveis ao registrar um pagamento (Pix, boleto, cartão…). Inative o que não usar."
        crumbs={[{ label: "Financeiro", href: "/admin/financeiro-dashboard" }, { label: "Métodos", href: "/admin/metodos-pagamento" }]}
      />

      {!isSupabaseConfigured && <Notice>Conecte o Supabase e faça login para gerenciar métodos.</Notice>}

      <Panel title={`Métodos (${d.metodos.length})`}>
        <ul className="divide-y divide-line">
          {d.metodos.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 px-6 py-3">
              <div>
                <span className={m.ativo ? "font-medium text-moss" : "text-muted line-through"}>{m.nome}</span>
                <span className="ml-2 text-xs text-muted">{uso.get(m.id) ? `${uso.get(m.id)} pagamento(s)` : ""}</span>
              </div>
              <form action={alternarMetodo}>
                <input type="hidden" name="id" value={m.id} />
                <input type="hidden" name="ativo" value={String(m.ativo)} />
                <button type="submit" className={`rounded-full px-3 py-1 text-xs uppercase tracking-wide ${m.ativo ? "bg-[#e6efe0] text-success" : "bg-cream text-muted"}`}>
                  {m.ativo ? "ativo" : "inativo"}
                </button>
              </form>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
