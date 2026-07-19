import Link from "next/link";
import { PageTitle, Panel, Notice } from "@/components/admin/ui";
import { listCommitments, listPadrinhos } from "@/lib/comm-data";
import { WEDDING } from "@/lib/constants";

export const dynamic = "force-dynamic";

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" }) : "a definir";

export default async function CalendarioComunicacaoPage() {
  const [compromissos, membros] = await Promise.all([listCommitments(), listPadrinhos()]);
  const nome = (id: string | null) => (id ? membros.find((m) => m.id === id)?.nome ?? "—" : "Todos");
  const futuros = compromissos
    .filter((c) => c.quando)
    .sort((a, b) => (a.quando! < b.quando! ? -1 : 1));

  return (
    <>
      <div className="mb-4"><Link href="/admin/comunicacao" className="text-sm text-olive underline">← Comunicação</Link></div>
      <PageTitle>Calendário</PageTitle>
      <Notice>Compromissos dos padrinhos e marcos do casamento. O grande dia é <strong>{WEDDING.dataExtenso}</strong>, às 15h.</Notice>

      <Panel title="Próximos compromissos">
        {futuros.length === 0 ? (
          <p className="p-6 text-sm text-muted">Nenhum compromisso com data ainda. Cadastre em Padrinhos → Compromissos.</p>
        ) : (
          <ul className="divide-y divide-line">
            {futuros.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-3">
                <div>
                  <p className="font-medium text-moss">{c.titulo}</p>
                  <p className="text-xs uppercase tracking-wide text-muted">{c.tipo.replace(/_/g, " ")} · {nome(c.member_id)}{c.local ? ` · ${c.local}` : ""}</p>
                </div>
                <span className="whitespace-nowrap text-sm text-muted">{fmt(c.quando)}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
