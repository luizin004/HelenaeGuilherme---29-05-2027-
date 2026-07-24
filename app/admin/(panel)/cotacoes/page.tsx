import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Cotações passou a ser uma aba dentro de Financeiro (menos telas, mesmo fluxo). */
export default function CotacoesPage() {
  redirect("/admin/financeiro?t=cotacoes");
}
