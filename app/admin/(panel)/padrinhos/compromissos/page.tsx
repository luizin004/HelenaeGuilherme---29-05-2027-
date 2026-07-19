import Link from "next/link";
import { PageTitle, Panel, Notice } from "@/components/admin/ui";
import { listCommitments, listPadrinhos } from "@/lib/comm-data";

export const dynamic = "force-dynamic";

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" }) : "a definir";

export default async function CompromissosPage() {
  const [compromissos, membros] = await Promise.all([listCommitments(), listPadrinhos()]);
  const nome = (id: string | null) => (id ? membros.find((m) => m.id === id)?.nome ?? "—" : "Todos");

  return (
    <>
      <div className="mb-4"><Link href="/admin/padrinhos" className="text-sm text-olive underline">← Padrinhos</Link></div>
      <PageTitle>Compromissos dos padrinhos</PageTitle>
      <Notice>Reuniões, ensaio, prova de traje e chegada. Cada compromisso pode virar lembrete na jornada dos padrinhos.</Notice>

      <Panel title={`Agenda (${compromissos.length})`}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>{["Quando", "Tipo", "Título", "Padrinho", "Local", "Status"].map((h) => (
                <th key={h} className="bg-cream px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-moss">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {compromissos.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">Nenhum compromisso cadastrado ainda.</td></tr>}
              {compromissos.map((c) => (
                <tr key={c.id} className="border-t border-line hover:bg-ivory">
                  <td className="whitespace-nowrap px-4 py-2.5 text-muted">{fmt(c.quando)}</td>
                  <td className="px-4 py-2.5 capitalize text-muted">{c.tipo.replace(/_/g, " ")}</td>
                  <td className="px-4 py-2.5 font-medium">{c.titulo}</td>
                  <td className="px-4 py-2.5 text-muted">{nome(c.member_id)}</td>
                  <td className="px-4 py-2.5 text-muted">{c.local ?? "—"}</td>
                  <td className="px-4 py-2.5 text-muted">{c.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
