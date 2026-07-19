import Link from "next/link";
import { PageTitle, Panel, Notice } from "@/components/admin/ui";
import { listPadrinhos } from "@/lib/comm-data";

export const dynamic = "force-dynamic";

const TRAJE: Record<string, string> = {
  pendente: "Pendente", medidas_solicitadas: "Medidas solicitadas",
  medidas_recebidas: "Medidas recebidas", confirmado: "Confirmado",
};

export default async function TrajesPage() {
  const membros = await listPadrinhos();
  return (
    <>
      <div className="mb-4"><Link href="/admin/padrinhos" className="text-sm text-olive underline">← Padrinhos</Link></div>
      <PageTitle>Trajes e medidas</PageTitle>
      <Notice>Para editar o status do traje/medidas, abra o padrinho e use o acompanhamento.</Notice>

      <Panel title="Situação por padrinho">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>{["Nome", "Papel", "Traje / medidas", "Ação"].map((h) => (
                <th key={h} className="bg-cream px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-moss">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {membros.length === 0 && <tr><td colSpan={4} className="px-4 py-10 text-center text-muted">Nenhum padrinho ainda.</td></tr>}
              {membros.map((m) => (
                <tr key={m.id} className="border-t border-line hover:bg-ivory">
                  <td className="px-4 py-2.5 font-medium">{m.nome}</td>
                  <td className="px-4 py-2.5 capitalize text-muted">{m.papel}</td>
                  <td className="px-4 py-2.5">{TRAJE[m.traje_status] ?? m.traje_status}</td>
                  <td className="px-4 py-2.5"><Link href={`/admin/padrinhos/${m.id}`} className="text-xs text-olive underline">abrir</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
