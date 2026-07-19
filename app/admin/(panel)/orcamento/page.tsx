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
          Marque tudo que o casamento pode ter ({TOTAL_ITENS_CATALOGO} itens no catálogo). Cada item
          selecionado vira uma despesa <strong>&quot;prevista / a definir&quot;</strong> no{" "}
          <Link href="/admin/financeiro" className="text-olive underline">Financeiro</Link>, onde você
          informa valor, responsável (Helena, Guilherme, Toninho ou Gratuito) e parcelas. Nada de valor
          é inventado. Itens já lançados aparecem travados para não duplicar.
        </Notice>
      )}

      <OrcamentoSelector jaNoFinanceiro={jaNoFinanceiro} />
    </>
  );
}
