import type { Metadata } from "next";
import { InfoPage, InfoBlock } from "@/components/public/InfoPage";

export const metadata: Metadata = {
  title: "Termos de uso · Helena & Guilherme",
  description: "Condições de uso deste site de casamento.",
};

export default function TermosPage() {
  return (
    <InfoPage
      eyebrow="Combinados"
      titulo="Termos de uso"
      intro="Este é um site pessoal para a organização do casamento de Helena e Guilherme. Ao utilizá-lo, você concorda com os pontos abaixo."
    >
      <InfoBlock titulo="Finalidade do site">
        <p>
          O site serve para apresentar informações do casamento, receber confirmações de presença e
          disponibilizar a lista de presentes. Não é um serviço comercial.
        </p>
      </InfoBlock>

      <InfoBlock titulo="Confirmação de presença">
        <p>
          A confirmação é feita por um link individual do convite. O acesso é pessoal — evite
          compartilhar seu link. A confirmação pode ser encerrada na data-limite informada pelos
          noivos.
        </p>
      </InfoBlock>

      <InfoBlock titulo="Presentes e pagamentos">
        <p>
          As contribuições da lista de presentes são voluntárias e processadas por um provedor de
          pagamentos externo (Asaas). Os noivos não têm acesso aos dados do seu cartão. Em caso de
          dúvida sobre uma contribuição, fale com os noivos.
        </p>
      </InfoBlock>

      <InfoBlock titulo="Conteúdo">
        <p>
          Fotos, textos e a identidade visual pertencem aos noivos. Pedimos que não sejam reutilizados
          sem autorização.
        </p>
      </InfoBlock>

      <InfoBlock titulo="Privacidade">
        <p>
          O tratamento de dados pessoais segue a nossa{" "}
          <a href="/privacidade" className="text-olive underline">Política de privacidade (LGPD)</a>.
        </p>
      </InfoBlock>
    </InfoPage>
  );
}
