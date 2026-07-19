import type { Metadata } from "next";
import { InfoPage } from "@/components/public/InfoPage";
import { getVenues } from "@/lib/data";
import { VENUES_FALLBACK, WEDDING } from "@/lib/constants";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Programação · Helena & Guilherme",
  description: "O roteiro do nosso grande dia.",
};

export default async function ProgramacaoPage() {
  const venues = (await getVenues()) ?? [];
  const lista = venues.length ? venues : VENUES_FALLBACK;
  const cerimonia = lista.find((v) => v.tipo === "cerimonia");
  const recepcao = lista.find((v) => v.tipo === "recepcao");

  const itens = [
    {
      hora: cerimonia?.horario ?? "15h00",
      titulo: "Cerimônia",
      local: cerimonia?.nome ?? "a confirmar",
      detalhe: cerimonia?.endereco ?? "",
    },
    {
      hora: "Logo após",
      titulo: "Recepção",
      local: recepcao?.nome ?? "a confirmar",
      detalhe: recepcao?.endereco ?? "",
    },
    {
      hora: "Durante a festa",
      titulo: "Espaço infantil",
      local: "Área monitorada para as crianças",
      detalhe: "Com monitoria dedicada",
    },
    {
      hora: "Até o fim da noite",
      titulo: "Celebração",
      local: "Música, brindes e memórias",
      detalhe: "Fique com a gente até o último abraço",
    },
  ];

  return (
    <InfoPage
      eyebrow="O roteiro do dia"
      titulo="Programação"
      intro={`${WEDDING.dataExtenso} · ${WEDDING.cidade}. Alguns horários são aproximados e podem ser ajustados — a cerimônia às 15h é o nosso ponto de encontro.`}
    >
      <ol className="relative space-y-6 border-l border-gold/50 pl-6">
        {itens.map((it, i) => (
          <li key={i} className="relative">
            <span className="absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-gold bg-ivory" />
            <div className="rounded-lg bg-white p-5 shadow-card">
              <p className="text-xs uppercase tracking-[0.15em] text-olive">{it.hora}</p>
              <h2 className="font-serif text-xl text-moss">{it.titulo}</h2>
              <p className="text-sm text-muted">{it.local}</p>
              {it.detalhe && <p className="text-xs text-muted">{it.detalhe}</p>}
            </div>
          </li>
        ))}
      </ol>
    </InfoPage>
  );
}
