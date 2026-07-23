import Link from "next/link";
import { Notice, PageTitle } from "@/components/admin/ui";
import { OrcamentoSelector } from "@/components/admin/OrcamentoSelector";
import { listExpenses } from "@/lib/admin-data";
import { TOTAL_ITENS_CATALOGO } from "@/domain/orcamento/catalogo";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export default async function OrcamentoPage() {
  const expenses = await listExpenses();
  const jaNoFinanceiro = expenses.map((e) => e.descricao);

  return (
    <>
      <PageTitle>Montar orçamento</PageTitle>

      {!isSupabaseConfigured ? (
        <Notice>Conecte o Supabase e faça login para montar o orçamento.</Notice>
      ) : (
        <Notice>
          Este é o <strong>ponto de partida</strong>: marque tudo que o casamento pode precisar
          ({TOTAL_ITENS_CATALOGO} itens no catálogo) para ter um norte. Cada item selecionado vira uma
          despesa <strong>&quot;prevista / a definir&quot;</strong> e já aparece automaticamente em{" "}
          <Link href="/admin/cotacoes" className="text-olive underline">Cotações &amp; propostas</Link>{" "}
          para você pedir orçamentos, e em{" "}
          <Link href="/admin/financeiro" className="text-olive underline">Lançamentos</Link> para informar
          valor, responsável e parcelas. Ex.: marcar <em>&quot;Casamento civil&quot;</em> já cria o item para cotar.
          Nada de valor é inventado; itens já lançados aparecem travados para não duplicar.
        </Notice>
      )}

      <OrcamentoSelector jaNoFinanceiro={jaNoFinanceiro} />
    </>
  );
}
