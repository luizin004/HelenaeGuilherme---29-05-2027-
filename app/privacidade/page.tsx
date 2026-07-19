import type { Metadata } from "next";
import { InfoPage, InfoBlock } from "@/components/public/InfoPage";
import { WEDDING } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Privacidade (LGPD) · Helena & Guilherme",
  description: "Como tratamos os dados coletados na confirmação de presença.",
};

export default function PrivacidadePage() {
  return (
    <InfoPage
      eyebrow="Seus dados, com cuidado"
      titulo="Política de privacidade"
      intro="Este site é pessoal, feito para organizar o casamento de Helena e Guilherme. Tratamos seus dados de acordo com a LGPD (Lei nº 13.709/2018)."
    >
      <InfoBlock titulo="Quem são os controladores">
        <p>
          Os dados são tratados pelos noivos, Helena e Guilherme, exclusivamente para a organização
          do casamento de {WEDDING.dataExtenso}. Não há finalidade comercial.
        </p>
      </InfoBlock>

      <InfoBlock titulo="Quais dados coletamos">
        <p>Coletamos apenas o necessário para organizar o evento:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Nome do convidado e do grupo familiar;</li>
          <li>Confirmação de presença (sim/não) e mensagem opcional aos noivos;</li>
          <li>Preferência de transporte (opcional);</li>
          <li>Restrições alimentares/alergias e identificação de crianças, quando informadas;</li>
          <li>Dados de contato, quando você os fornece.</li>
        </ul>
        <p>
          Pagamentos de presentes são processados por um provedor de pagamentos (Asaas). Não
          armazenamos dados de cartão em nosso site.
        </p>
      </InfoBlock>

      <InfoBlock titulo="Para que usamos">
        <p>
          Para confirmar presenças, organizar mesas e o espaço infantil, planejar transporte e
          atender restrições alimentares. Seus dados <strong>não são vendidos nem compartilhados</strong>{" "}
          para fins de marketing.
        </p>
      </InfoBlock>

      <InfoBlock titulo="Segurança">
        <p>
          O acesso administrativo é restrito e protegido por autenticação. Os dados dos convidados
          não ficam visíveis publicamente — a confirmação é feita por um link individual do convite,
          sem busca aberta por nomes.
        </p>
      </InfoBlock>

      <InfoBlock titulo="Por quanto tempo guardamos">
        <p>
          Mantemos os dados apenas enquanto forem úteis à organização do casamento. Após o evento,
          eles podem ser apagados mediante solicitação.
        </p>
      </InfoBlock>

      <InfoBlock titulo="Seus direitos">
        <p>
          Você pode solicitar acesso, correção ou exclusão dos seus dados. Para isso, fale com os
          noivos pelo canal do seu convite.
        </p>
      </InfoBlock>
    </InfoPage>
  );
}
