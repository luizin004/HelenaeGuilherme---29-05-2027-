import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** As Parcelas passaram a viver dentro de Financeiro → Contas (sub-aba "Parcelas") — menos abas. */
export default function ParcelasPage() {
  redirect("/admin/financeiro?t=contas&sec=parcelas");
}
