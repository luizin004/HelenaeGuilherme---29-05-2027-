import { Notice, Panel } from "@/components/admin/ui";
import { PageHeader, EmptyState } from "@/components/admin/finance/ui";
import { ClassificacaoForm } from "@/components/admin/finance/ClassificacaoForm";
import { alternarClassificacao } from "@/app/actions/classificacoes";
import { loadFinance } from "@/lib/finance-core";
import { formatCents } from "@/domain/money";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export default async function ClassificacoesPage() {
  const d = await loadFinance();
  const principais = d.classificacoes.filter((c) => !c.parent_id);
  const filhas = (id: string) => d.classificacoes.filter((c) => c.parent_id === id);

  // Uso por classificação (nº de contas + total) — mesma fonte das outras telas.
  const uso = new Map<string, { qtde: number; cents: number }>();
  for (const c of d.contas) {
    if (!c.classificacaoId) continue;
    const u = uso.get(c.classificacaoId) ?? { qtde: 0, cents: 0 };
    u.qtde += 1;
    u.cents += c.valorCents;
    uso.set(c.classificacaoId, u);
  }

  return (
    <>
      <PageHeader
        title="Classificações financeiras"
        description="Cadastro único que substitui Centros de custo e Categorias. Suporta classificação principal e subclassificações — nos formulários existe um único seletor."
        crumbs={[{ label: "Financeiro", href: "/admin/financeiro-dashboard" }, { label: "Classificações", href: "/admin/classificacoes" }]}
      />

      {!isSupabaseConfigured && <Notice>Conecte o Supabase e faça login para gerenciar as classificações.</Notice>}

      <Panel title="Nova classificação">
        <div className="p-6">
          <ClassificacaoForm principais={principais.map((p) => ({ id: p.id, nome: p.nome }))} />
        </div>
      </Panel>

      <Panel title={`Classificações (${d.classificacoes.length})`}>
        {principais.length === 0 ? (
          <EmptyState title="Nenhuma classificação ainda." />
        ) : (
          <ul className="divide-y divide-line">
            {principais.map((p) => {
              const u = uso.get(p.id);
              const subs = filhas(p.id);
              return (
                <li key={p.id} className="px-6 py-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span aria-hidden className="h-3.5 w-3.5 rounded-full border border-line" style={{ backgroundColor: p.cor ?? "#e8e4d8" }} />
                      <div>
                        <span className={`font-medium ${p.ativo ? "text-moss" : "text-muted line-through"}`}>{p.nome}</span>
                        {p.descricao && <span className="ml-2 text-xs text-muted">{p.descricao}</span>}
                        <div className="text-xs text-muted">
                          {u ? `${u.qtde} conta(s) · ${formatCents(u.cents)}` : "sem uso"}
                          {p.orcamento_cents ? ` · orçamento ${formatCents(p.orcamento_cents)}` : ""}
                          {p.legacy_cost_center_id ? " · migrada de centro de custo" : ""}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <form action={alternarClassificacao}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="ativo" value={String(p.ativo)} />
                        <button type="submit" className={`rounded-full px-3 py-1 text-xs uppercase tracking-wide ${p.ativo ? "bg-[#e6efe0] text-success" : "bg-cream text-muted"}`}>
                          {p.ativo ? "ativa" : "inativa"}
                        </button>
                      </form>
                      <details className="text-xs">
                        <summary className="cursor-pointer text-olive underline">editar</summary>
                        <div className="mt-3 w-[min(90vw,540px)] rounded-lg border border-line bg-ivory p-4">
                          <ClassificacaoForm principais={principais.map((x) => ({ id: x.id, nome: x.nome }))} editar={p} />
                        </div>
                      </details>
                    </div>
                  </div>
                  {subs.length > 0 && (
                    <ul className="ml-7 mt-2 space-y-1">
                      {subs.map((s) => {
                        const us = uso.get(s.id);
                        return (
                          <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                            <span className={s.ativo ? "text-moss" : "text-muted line-through"}>
                              ↳ {s.nome}
                              <span className="ml-2 text-xs text-muted">{us ? `${us.qtde} conta(s) · ${formatCents(us.cents)}` : ""}</span>
                            </span>
                            <form action={alternarClassificacao}>
                              <input type="hidden" name="id" value={s.id} />
                              <input type="hidden" name="ativo" value={String(s.ativo)} />
                              <button type="submit" className="text-xs text-muted underline">{s.ativo ? "inativar" : "ativar"}</button>
                            </form>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Notice>
        Os cadastros antigos (Centros de custo e Categorias) foram <strong>migrados automaticamente</strong> para cá,
        com deduplicação por nome. Os dados originais foram preservados no banco até a validação final.
      </Notice>
    </>
  );
}
