import Link from "next/link";
import { notFound } from "next/navigation";
import { PageTitle, Panel, Notice } from "@/components/admin/ui";
import { alternarFase } from "@/app/actions/comm";
import { FaseEditForm } from "@/components/admin/comm/FaseEditForm";
import { listJourneys, listJourneyStages } from "@/lib/comm-data";

export const dynamic = "force-dynamic";

export default async function JornadaDetalhe({ params }: { params: { id: string } }) {
  const [jornadas, fases] = await Promise.all([listJourneys(), listJourneyStages(params.id)]);
  const jornada = jornadas.find((j) => j.id === params.id);
  if (!jornada) notFound();

  return (
    <>
      <div className="mb-4"><Link href="/admin/comunicacao/jornadas" className="text-sm text-olive underline">← Jornadas</Link></div>
      <PageTitle>{jornada.nome}</PageTitle>
      <Notice>{jornada.objetivo} · Público: {jornada.publico}. As fases enviam apenas mensagens relevantes ao perfil de cada pessoa.</Notice>

      <Panel title={`Fases (${fases.length})`}>
        <ol className="divide-y divide-line">
          {fases.map((f) => (
            <li key={f.id} className="px-6 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-start gap-4">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cream text-sm font-medium text-moss">{f.ordem}</span>
                  <div>
                    <p className="font-medium text-moss">{f.nome}{f.fase ? <span className="ml-2 text-xs text-muted">fase {f.fase}</span> : null}</p>
                    <p className="text-sm text-muted">{f.objetivo}</p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-muted">
                      {f.tipo_mensagem} · {f.canal} · aprovação: {f.aprovacao} · intervalo mín. {f.intervalo_min_dias}d
                    </p>
                  </div>
                </div>
                <form action={alternarFase}>
                  <input type="hidden" name="id" value={f.id} />
                  <input type="hidden" name="journey_id" value={jornada.id} />
                  <input type="hidden" name="ativa" value={String(f.ativa)} />
                  <button type="submit" className={`rounded-full px-3 py-1 text-xs uppercase tracking-wide ${f.ativa ? "bg-[#e6efe0] text-success" : "bg-cream text-muted"}`}>
                    {f.ativa ? "ativa" : "pausada"}
                  </button>
                </form>
              </div>
              <details className="mt-3 pl-12">
                <summary className="cursor-pointer text-xs text-olive underline">editar fase</summary>
                <div className="mt-3">
                  <FaseEditForm fase={f} journeyId={jornada.id} />
                </div>
              </details>
            </li>
          ))}
        </ol>
      </Panel>
    </>
  );
}
