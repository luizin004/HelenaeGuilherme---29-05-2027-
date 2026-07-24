import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Orçamento passou a ser uma aba dentro de Financeiro (menos telas, mesmo fluxo). */
export default function OrcamentoPage() {
  redirect("/admin/financeiro?t=orcamento");
}
