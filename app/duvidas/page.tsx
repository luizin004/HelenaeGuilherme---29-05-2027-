import type { Metadata } from "next";
import { InfoPage, InfoBlock } from "@/components/public/InfoPage";
import { getVenues } from "@/lib/data";
import { VENUES_FALLBACK, WEDDING } from "@/lib/constants";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Dúvidas frequentes · Helena & Guilherme",
  description: "Traje, horário, locais, confirmação de presença e presentes.",
};

const prazoExtenso = new Date(WEDDING.rsvpDeadlineISO).toLocaleDateString("pt-BR", {
  day: "2-digit", month: "long", year: "numeric", timeZone: "America/Sao_Paulo",
});

export default async function DuvidasPage() {
  const venues = (await getVenues()) ?? [];
  const lista = venues.length ? venues : VENUES_FALLBACK;
  const cerimonia = lista.find((v) => v.tipo === "cerimonia");
  const recepcao = lista.find((v) => v.tipo === "recepcao");

  return (
    <InfoPage
      eyebrow="Antes do grande dia"
      titulo="Dúvidas frequentes"
      intro="Reunimos aqui o que costuma ser perguntado. Ficou com alguma outra dúvida? Fale com os noivos pelo canal do seu convite."
    >
      <InfoBlock titulo="Qual é o traje?">
        <p>{WEDDING.traje}. Vista-se para celebrar conosco com conforto e elegância.</p>
      </InfoBlock>

      <InfoBlock titulo="Que horas começa?">
        <p>
          A cerimônia começa às <strong>15h</strong> (horário de Brasília), em {WEDDING.dataExtenso}.
          Sugerimos chegar com alguns minutos de antecedência.
        </p>
      </InfoBlock>

      <InfoBlock titulo="Onde será a cerimônia e a recepção?">
        <p>
          <strong>Cerimônia:</strong> {cerimonia?.nome ?? "a confirmar"}
          {cerimonia?.endereco ? ` — ${cerimonia.endereco}` : ""}.
        </p>
        <p>
          <strong>Recepção:</strong> {recepcao?.nome ?? "a confirmar"}
          {recepcao?.endereco ? ` — ${recepcao.endereco}` : ""}. Logo após a cerimônia.
        </p>
      </InfoBlock>

      <InfoBlock titulo="Até quando confirmo minha presença?">
        <p>
          Pedimos a confirmação até <strong>{prazoExtenso}</strong>, pelo link do seu convite.
          A confirmação vale para todos os convidados do seu grupo familiar.
        </p>
      </InfoBlock>

      <InfoBlock titulo="Posso levar crianças?">
        <p>
          Sim! Teremos um espaço infantil com monitoria. Ao confirmar presença, indique as crianças
          do grupo e eventuais restrições alimentares ou alergias, para cuidarmos de tudo com carinho.
        </p>
      </InfoBlock>

      <InfoBlock titulo="Como funciona a lista de presentes?">
        <p>
          Sua presença já é o nosso maior presente. Se quiser nos presentear, a lista fica em{" "}
          <a href="/presentes" className="text-olive underline">nossa página de presentes</a>, com
          pagamento seguro via Pix ou cartão.
        </p>
      </InfoBlock>

      <InfoBlock titulo="Como chegar / transporte">
        <p>
          Ao confirmar presença você pode nos contar como pretende ir (carro, carona, transporte
          contratado). Isso nos ajuda a organizar o dia. Detalhes de rota estão na página inicial.
        </p>
      </InfoBlock>
    </InfoPage>
  );
}
