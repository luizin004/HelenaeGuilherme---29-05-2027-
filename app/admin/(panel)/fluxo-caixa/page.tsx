import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Fluxo de caixa passou a ser uma aba dentro de Financeiro (menos telas, mesmo fluxo). */
export default function FluxoCaixaPage({ searchParams }: { searchParams: { modo?: string } }) {
  const params = new URLSearchParams({ t: "fluxo" });
  if (searchParams.modo) params.set("modo", searchParams.modo);
  redirect(`/admin/financeiro?${params.toString()}`);
}
