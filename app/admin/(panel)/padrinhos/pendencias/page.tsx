import Link from "next/link";
import { Kpi, KpiGrid, PageTitle, Panel } from "@/components/admin/ui";
import { listPadrinhos, getPadrinhosPendencias } from "@/lib/comm-data";

export const dynamic = "force-dynamic";

export default async function PendenciasPage() {
  const [membros, pend] = await Promise.all([listPadrinhos(), getPadrinhosPendencias()]);

  const linhas = [
    { label: "Sem telefone (WhatsApp)", teste: (m: (typeof membros)[number]) => !m.telefone },
    { label: "Sem confirmação", teste: (m: (typeof membros)[number]) => m.status !== "confirmado" },
    { label: "Medidas pendentes", teste: (m: (typeof membros)[number]) => m.traje_status === "pendente" || m.traje_status === "medidas_solicitadas" },
    { label: "Traje não confirmado", teste: (m: (typeof membros)[number]) => m.traje_status !== "confirmado" },
    { label: "Ensaio não confirmado", teste: (m: (typeof membros)[number]) => m.ensaio_status !== "confirmado" },
    { label: "Hospedagem pendente", teste: (m: (typeof membros)[number]) => m.hospedagem_status === "pendente" },
    { label: "Transporte pendente", teste: (m: (typeof membros)[number]) => m.transporte_status === "pendente" },
  ];

  return (
    <>
      <div className="mb-4"><Link href="/admin/padrinhos" className="text-sm text-olive underline">← Padrinhos</Link></div>
      <PageTitle>Pendências dos padrinhos</PageTitle>

      <KpiGrid>
        <Kpi label="Sem telefone" value={pend.semTelefone} />
        <Kpi label="Sem confirmação" value={pend.semConfirmacao} />
        <Kpi label="Medidas pendentes" value={pend.medidasPendentes} />
        <Kpi label="Ensaio pendente" value={pend.ensaioPendente} />
      </KpiGrid>

      {linhas.map((l) => {
        const lista = membros.filter(l.teste);
        return (
          <Panel key={l.label} title={`${l.label} (${lista.length})`}>
            <div className="flex flex-wrap gap-2 p-6">
              {lista.length === 0 && <span className="text-sm text-muted">Nada pendente aqui. 🤍</span>}
              {lista.map((m) => (
                <Link key={m.id} href={`/admin/padrinhos/${m.id}`} className="rounded-full border border-line bg-white px-3 py-1 text-sm text-moss hover:border-olive">
                  {m.nome}
                </Link>
              ))}
            </div>
          </Panel>
        );
      })}
    </>
  );
}
