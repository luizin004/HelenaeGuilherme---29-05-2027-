import Link from "next/link";
import { Kpi, KpiGrid, Notice, PageTitle } from "@/components/admin/ui";
import { getGiftTotals, getGuestStats } from "@/lib/admin-data";
import { getSettings, resolveCouple } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { WEDDING } from "@/lib/constants";

export const dynamic = "force-dynamic";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const MODULES = [
  { ico: "📋", titulo: "Convidados", texto: "Lista, grupos, RSVP e QR Codes individuais.", href: "/admin/convidados" },
  { ico: "📷", titulo: "Check-in", texto: "Recepção no dia do casamento via QR Code.", href: "/admin/checkin" },
  { ico: "💰", titulo: "Financeiro", texto: "Despesas, receitas e projeção mensal.", href: "/admin/financeiro" },
];

export default async function DashboardPage() {
  const [stats, gifts, settings] = await Promise.all([getGuestStats(), getGiftTotals(), getSettings()]);
  const couple = resolveCouple(settings);
  const dias = Math.max(0, Math.ceil((new Date(couple.dataISO).getTime() - Date.now()) / 86_400_000));

  return (
    <>
      <PageTitle>Dashboard</PageTitle>

      {!isSupabaseConfigured && (
        <Notice>
          👋 Painel em <strong>modo demonstração</strong>. Configure as variáveis do Supabase em{" "}
          <code>.env.local</code> para carregar os dados reais.
        </Notice>
      )}

      <KpiGrid>
        <Kpi label="Dias para o grande dia" value={dias} hint={WEDDING.dataExtenso} />
        <Kpi
          label="Convidados"
          value={stats.total}
          hint={`${stats.confirmados} confirmados · ${stats.pendentes} pendentes`}
        />
        <Kpi label="Presentes recebidos" value={brl(gifts.recebido)} hint={`${gifts.contribuicoes} contribuições`} />
        <Kpi label="Crianças" value={stats.criancas} hint="para o espaço infantil" />
      </KpiGrid>

      <h2 className="mb-4 font-serif text-2xl text-moss">Módulos</h2>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.map((m) => (
          <Link
            key={m.titulo}
            href={m.href}
            className="block rounded-lg bg-white p-6 shadow-card transition-transform hover:-translate-y-1"
          >
            <div className="text-2xl">{m.ico}</div>
            <h3 className="my-1 font-serif text-2xl text-moss">{m.titulo}</h3>
            <p className="text-sm text-muted">{m.texto}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
