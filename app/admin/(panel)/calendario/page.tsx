import { redirect } from "next/navigation";

/** Calendário virou aba do Financeiro (mesma tela do orçamento ao fluxo). */
export default function CalendarioRedirect() {
  redirect("/admin/financeiro?t=calendario");
}
