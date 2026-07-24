import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Contas passou a ser uma aba dentro de Financeiro (menos telas, mesmo fluxo). */
export default function ContasPage({ searchParams }: { searchParams: { aba?: string; sec?: string } }) {
  const params = new URLSearchParams({ t: "contas" });
  if (searchParams.sec) params.set("sec", searchParams.sec);
  if (searchParams.aba) params.set("aba", searchParams.aba);
  redirect(`/admin/financeiro?${params.toString()}`);
}
