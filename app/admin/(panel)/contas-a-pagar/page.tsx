import { redirect } from "next/navigation";

/** Atalho preservado: abre o módulo unificado de Contas já filtrado (§4). */
export default function ContasAPagarRedirect() {
  redirect("/admin/financeiro?t=contas&sec=contas&aba=a_pagar");
}
