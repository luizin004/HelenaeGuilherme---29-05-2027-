import { redirect } from "next/navigation";

/** Comprovantes foi unificado à tela de Contratos (mesmo lugar, lado a lado). */
export default function ComprovantesRedirect() {
  redirect("/admin/contratos");
}
