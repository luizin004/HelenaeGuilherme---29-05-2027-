import { Notice, PageTitle, Panel } from "@/components/admin/ui";
import { listParcelasDetalhado, type ParcelaDetalhe } from "@/lib/admin-data";
import { formatCents, sumCents } from "@/domain/money";
import { fmtDateBR, hojeISO, diasAte } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

interface Bucket {
  chave: string;
  titulo: string;
  cor: string;
  parcelas: ParcelaDetalhe[];
}

export default async function CalendarioPage() {
  const abertas = (await listParcelasDetalhado()).filter((p) => !p.pago);
  const hoje = hojeISO();

  const buckets: Bucket[] = [
    { chave: "vencidas", titulo: "Vencidas", cor: "text-danger", parcelas: [] },
    { chave: "hoje", titulo: "Vencem hoje", cor: "text-warn", parcelas: [] },
    { chave: "7", titulo: "Próximos 7 dias", cor: "text-warn", parcelas: [] },
    { chave: "15", titulo: "8 a 15 dias", cor: "text-olive", parcelas: [] },
    { chave: "30", titulo: "16 a 30 dias", cor: "text-olive", parcelas: [] },
    { chave: "depois", titulo: "Depois de 30 dias", cor: "text-muted", parcelas: [] },
    { chave: "semdata", titulo: "Sem data", cor: "text-muted", parcelas: [] },
  ];
  const idx = Object.fromEntries(buckets.map((b, i) => [b.chave, i]));

  for (const p of abertas) {
    const d = diasAte(p.vencimento, hoje);
    let k: string;
    if (d === null) k = "semdata";
    else if (d < 0) k = "vencidas";
    else if (d === 0) k = "hoje";
    else if (d <= 7) k = "7";
    else if (d <= 15) k = "15";
    else if (d <= 30) k = "30";
    else k = "depois";
    buckets[idx[k]].parcelas.push(p);
  }
  for (const b of buckets) b.parcelas.sort((a, c) => (a.vencimento ?? "").localeCompare(c.vencimento ?? ""));

  return (
    <>
      <PageTitle>Calendário financeiro</PageTitle>

      {!isSupabaseConfigured ? (
        <Notice>Conecte o Supabase e faça login para ver a agenda.</Notice>
      ) : (
        <Notice>Agenda das parcelas em aberto por proximidade do vencimento. Marque pagamentos em Contas a pagar ou anexe o comprovante.</Notice>
      )}

      <div className="grid gap-4">
        {buckets.map((b) => (
          <Panel key={b.chave} title={`${b.titulo} · ${b.parcelas.length} · ${formatCents(sumCents(b.parcelas.map((p) => p.valor_cents)))}`}>
            {b.parcelas.length === 0 ? (
              <p className="px-6 py-4 text-sm text-muted">Nada aqui.</p>
            ) : (
              <ul className="divide-y divide-line">
                {b.parcelas.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-6 py-2.5 text-sm">
                    <div>
                      <span className={`font-medium ${b.cor}`}>{fmtDateBR(p.vencimento)}</span>
                      <span className="ml-3">{p.descricao}</span>
                      {p.categoria && <span className="ml-2 text-xs text-muted">· {p.categoria}</span>}
                      <span className="ml-2 text-xs text-muted">· {p.responsavel}</span>
                    </div>
                    <span className="font-serif text-moss">{formatCents(p.valor_cents)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        ))}
      </div>
    </>
  );
}
