import { Notice, PageTitle, Panel } from "@/components/admin/ui";
import { DivisaoForm } from "@/components/admin/DivisaoForm";
import { listDivisao, getPayers } from "@/lib/admin-data";
import { formatCents } from "@/domain/money";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export default async function DivisaoPage() {
  const [itens, payers] = await Promise.all([listDivisao(), getPayers()]);
  const responsaveis = payers.filter((p) => p.nome !== "Gratuito").map((p) => ({ id: p.id, nome: p.nome }));

  return (
    <>
      <PageTitle>Divisão por responsáveis</PageTitle>

      {!isSupabaseConfigured ? (
        <Notice>Conecte o Supabase e faça login para dividir as despesas.</Notice>
      ) : (
        <Notice>
          Divida cada despesa entre Helena, Guilherme e Toninho. A soma das partes precisa{" "}
          <strong>fechar exatamente</strong> o valor (regra 2). Isso alimenta Responsáveis, Projeção e
          Relatórios. Deixe tudo zero para remover a divisão.
        </Notice>
      )}

      {itens.length === 0 && (
        <Notice>Nenhuma despesa com valor definido. Defina valores no Financeiro para poder dividir.</Notice>
      )}

      <div className="grid gap-4">
        {itens.map((it) => (
          <Panel key={it.id} title={`${it.descricao}${it.categoria ? ` · ${it.categoria}` : ""} · ${formatCents(it.valor_total_cents)}`}>
            <div className="p-6">
              <DivisaoForm
                expenseId={it.id}
                totalCents={it.valor_total_cents}
                responsaveis={responsaveis}
                splits={it.splits}
              />
            </div>
          </Panel>
        ))}
      </div>
    </>
  );
}
