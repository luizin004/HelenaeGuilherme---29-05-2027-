import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** A Projeção mensal foi integrada ao Dashboard financeiro (menos abas). */
export default function ProjecaoPage({ searchParams }: { searchParams: { visao?: string } }) {
  const visao = searchParams.visao ? `?visao=${encodeURIComponent(searchParams.visao)}` : "";
  redirect(`/admin/financeiro-dashboard${visao}`);
}
