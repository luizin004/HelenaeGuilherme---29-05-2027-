import { redirect } from "next/navigation";

/** Atalho preservado: abre o módulo unificado de Contas já filtrado (§4). */
export default function ContasPagasRedirect() {
  redirect("/admin/contas?aba=pagas");
}
