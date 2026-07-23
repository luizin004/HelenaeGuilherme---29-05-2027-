import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** As Parcelas passaram a viver dentro de Contas (sub-aba "Parcelas") — menos abas. */
export default function ParcelasPage() {
  redirect("/admin/contas?sec=parcelas");
}
