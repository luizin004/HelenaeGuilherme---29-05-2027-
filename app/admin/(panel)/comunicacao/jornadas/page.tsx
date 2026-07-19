import Link from "next/link";
import { PageTitle, Panel, Notice } from "@/components/admin/ui";
import { alternarJornada } from "@/app/actions/comm";
import { listJourneys, listJourneyStages } from "@/lib/comm-data";

export const dynamic = "force-dynamic";

export default async function JornadasPage() {
  const [jornadas, fases] = await Promise.all([listJourneys(), listJourneyStages()]);
  const contarFases = (jid: string) => fases.filter((f) => f.journey_id === jid).length;

  return (
    <>
      <div className="mb-4"><Link href="/admin/comunicacao" className="text-sm text-olive underline">← Comunicação</Link></div>
      <PageTitle>Jornadas de comunicação</PageTitle>
      <Notice>Cada jornada tem fases de aquecimento e regras próprias (aprovação, limite de frequência). Ative ou pause conforme a necessidade.</Notice>

      <div className="grid gap-4">
        {jornadas.map((j) => (
          <Panel
            key={j.id}
            title={j.nome}
            action={
              <form action={alternarJornada}>
                <input type="hidden" name="id" value={j.id} />
                <input type="hidden" name="ativa" value={String(j.ativa)} />
                <button type="submit" className={`rounded-full px-3 py-1 text-xs uppercase tracking-wide ${j.ativa ? "bg-[#e6efe0] text-success" : "bg-cream text-muted"}`}>
                  {j.ativa ? "ativa · pausar" : "pausada · ativar"}
                </button>
              </form>
            }
          >
            <div className="flex flex-wrap items-center justify-between gap-3 p-6">
              <div>
                <p className="text-sm text-muted">{j.objetivo}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-muted">
                  Público: {j.publico} · {contarFases(j.id)} fases · aprovação: {j.aprovacao} · intervalo mín. {j.limite_freq_dias}d
                </p>
              </div>
              <Link href={`/admin/comunicacao/jornadas/${j.id}`} className="btn btn-outline">Ver fases</Link>
            </div>
          </Panel>
        ))}
      </div>
    </>
  );
}
