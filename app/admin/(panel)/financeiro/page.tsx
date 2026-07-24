import Link from "next/link";
import { PageHeader } from "@/components/admin/finance/ui";
import { OrcamentoTab } from "@/components/admin/financeiro/OrcamentoTab";
import { CotacoesTab } from "@/components/admin/financeiro/CotacoesTab";
import { LancamentosTab } from "@/components/admin/financeiro/LancamentosTab";
import { ContasTab } from "@/components/admin/financeiro/ContasTab";
import { FluxoCaixaTab } from "@/components/admin/financeiro/FluxoCaixaTab";

export const dynamic = "force-dynamic";

const ABAS = [
  { key: "orcamento", label: "Orçamento" },
  { key: "cotacoes", label: "Cotações & propostas" },
  { key: "lancamentos", label: "Lançamentos" },
  { key: "contas", label: "Contas" },
  { key: "fluxo", label: "Fluxo de caixa" },
] as const;
type Aba = (typeof ABAS)[number]["key"];

const DESCRICAO: Record<Aba, string> = {
  orcamento: "Marque o que o casamento vai precisar — cada item selecionado já entra nas outras abas.",
  cotacoes: "Compare propostas de fornecedores por item e escolha a melhor.",
  lancamentos: "Cadastre os custos, classifique e defina a condição de pagamento de cada um.",
  contas: "Acompanhe o que está a pagar, vencendo, pago — e os cronogramas de parcelas.",
  fluxo: "Entradas × saídas mês a mês — calculado sozinho a partir dos lançamentos e aportes.",
};

/**
 * Orçamento, Cotações, Lançamentos, Contas e Fluxo de caixa viviam em 5 telas
 * separadas com muita informação repetida (o mesmo item de despesa aparecia em
 * várias). Agora é uma tela só, em abas — o fluxo natural (orçar → cotar →
 * lançar → pagar → acompanhar o caixa) fica visível e a navegação entre eles
 * não perde contexto. Um custo lançado em Lançamentos aparece sozinho em
 * Contas e no Fluxo — nunca é digitado de novo.
 */
export default async function FinanceiroPage({ searchParams }: { searchParams: { t?: string; aba?: string; sec?: string; modo?: string } }) {
  const aba = (ABAS.some((a) => a.key === searchParams.t) ? searchParams.t : "lancamentos") as Aba;

  return (
    <>
      <PageHeader
        title="Financeiro"
        description={DESCRICAO[aba]}
        crumbs={[{ label: "Financeiro", href: "/admin/financeiro-dashboard" }, { label: "Orçamento, cotações, contas e fluxo", href: "/admin/financeiro" }]}
      />

      <div className="mb-6 flex flex-wrap gap-1.5" role="tablist" aria-label="Abas do financeiro">
        {ABAS.map((a) => (
          <Link
            key={a.key}
            role="tab"
            aria-selected={aba === a.key}
            href={`/admin/financeiro?t=${a.key}`}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              aba === a.key ? "bg-moss text-white" : "bg-white text-muted shadow-card hover:text-moss"
            }`}
          >
            {a.label}
          </Link>
        ))}
      </div>

      {aba === "orcamento" && <OrcamentoTab />}
      {aba === "cotacoes" && <CotacoesTab />}
      {aba === "lancamentos" && <LancamentosTab />}
      {aba === "contas" && <ContasTab searchParams={searchParams} />}
      {aba === "fluxo" && <FluxoCaixaTab searchParams={searchParams} />}
    </>
  );
}
