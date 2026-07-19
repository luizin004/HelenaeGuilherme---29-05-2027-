/**
 * Gerador de rascunhos LOCAIS (sem IA externa) — §10/§12.
 * Enquanto o provedor de IA não está ligado, produz variações para revisão a
 * partir SOMENTE de campos autorizados (nome, papel, cidade, fase, CTA). Nunca
 * inventa fatos, história, intimidade ou apelido. Serve para testar o pipeline
 * (sanitização + variáveis + uso natural do nome) e como fallback humano.
 */

import { nomeDeTratamento } from "./personalize";

export interface EntradaRascunho {
  nome?: string | null;
  nomePreferido?: string | null;
  apelidoAutorizado?: string | null;
  papel?: string | null; // convidado | padrinho | madrinha
  cidade?: string | null;
  fase?: string | null; // conexao | rsvp | planejamento | preparacao | agradecimento
  cta?: string | null;
}

/** Frase de corpo por fase — genérica, calorosa e SEM fatos inventados. */
function corpoPorFase(fase?: string | null): string[] {
  switch ((fase ?? "conexao").toLowerCase()) {
    case "rsvp":
    case "decisao":
      return [
        "ia ser muito especial ter você com a gente nesse dia.",
        "queremos muito celebrar esse momento ao seu lado.",
        "sua presença faria toda a diferença pra nós.",
      ];
    case "planejamento":
      return [
        "separamos algumas informações pra facilitar sua ida.",
        "organizamos tudo pra sua viagem ficar tranquila.",
        "preparamos os detalhes pra você chegar sem preocupação.",
      ];
    case "preparacao":
    case "preparacao_final":
      return [
        "está chegando! reunimos os últimos detalhes pra você.",
        "falta pouquinho — aqui vão as informações finais.",
        "o grande dia se aproxima e queremos você pronto(a).",
      ];
    case "agradecimento":
    case "pos":
      return [
        "obrigado por ter feito parte desse dia tão importante.",
        "sua presença deixou tudo ainda mais especial.",
        "guardamos com carinho a alegria de ter você conosco.",
      ];
    default: // conexao
      return [
        "estamos muito felizes e queríamos compartilhar isso com você.",
        "chegou a hora de começar o nosso maior projeto — e queremos você perto.",
        "com muita alegria, viemos dividir essa novidade com você.",
      ];
  }
}

/** Fecho por papel (sem inventar relação). */
function fechoPorPapel(papel?: string | null): string {
  const p = (papel ?? "").toLowerCase();
  if (p === "padrinho") return "Que honra ter você como padrinho!";
  if (p === "madrinha") return "Que honra ter você como madrinha!";
  return "";
}

/**
 * Gera até 3 variações de rascunho. Cada uma usa o nome com naturalidade (uma vez)
 * e só os dados fornecidos. Marcadas para revisão humana.
 */
export function gerarRascunhosLocais(entrada: EntradaRascunho, n = 3): string[] {
  const tratamento = nomeDeTratamento({
    nome: entrada.nome,
    nomePreferido: entrada.nomePreferido,
    apelidoAutorizado: entrada.apelidoAutorizado,
  });
  const corpos = corpoPorFase(entrada.fase);
  const fecho = fechoPorPapel(entrada.papel);
  const cta = entrada.cta?.trim();

  const total = Math.max(1, Math.min(n, 3));
  const out: string[] = [];
  for (let i = 0; i < total; i++) {
    const partes = [`${tratamento}, ${corpos[i % corpos.length]}`];
    if (fecho && i === 0) partes.push(fecho);
    if (cta) partes.push(cta);
    partes.push("Com carinho, Helena & Guilherme 🤍");
    out.push(partes.join(" "));
  }
  return out;
}
