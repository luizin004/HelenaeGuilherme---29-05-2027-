/**
 * Lembretes de CONTRATAÇÃO da Evania.
 *
 * O outro motor da Evania cuida de pagamentos (parcelas que vencem). Este cuida
 * do passo anterior: itens que ainda não foram fechados com nenhum fornecedor e
 * têm prazo-limite para isso. A Evania lembra o que já venceu, o que vence hoje
 * e o que vence na semana — antes que o prazo estoure.
 *
 * Módulo puro: recebe a lista e a data de hoje, devolve baldes e texto.
 */

import { diasAte, fmtDateBR } from "@/lib/format";

/** Um item do orçamento sob a ótica de "já foi contratado?". */
export interface ItemContratacao {
  id: string;
  descricao: string;
  categoria: string | null;
  estado: string;
  gratuito: boolean;
  prazo_contratacao: string | null;
}

export interface AgendaContratacao {
  /** Prazo já passou e o item continua sem contratação. */
  vencidos: ItemContratacao[];
  /** O prazo é hoje. */
  hoje: ItemContratacao[];
  /** Vence nos próximos 7 dias (inclui hoje). */
  semana: ItemContratacao[];
  /** Vence nos próximos 30 dias (inclui a semana). */
  mes: ItemContratacao[];
  /** Pendente de contratação e ainda sem prazo definido. */
  semPrazo: ItemContratacao[];
  /** Total de itens pendentes de contratação (com ou sem prazo). */
  pendentes: number;
}

/** Estados que já contam como contratados — não geram lembrete. */
const FECHADOS = ["contratado", "pago", "gratuito"];

export function pendenteDeContratacao(item: ItemContratacao): boolean {
  return !item.gratuito && !FECHADOS.includes(item.estado);
}

/** Classifica os itens pendentes pelos prazos, relativo a `hoje` (ISO). */
export function agendaContratacao(itens: ItemContratacao[], hoje: string): AgendaContratacao {
  const agenda: AgendaContratacao = { vencidos: [], hoje: [], semana: [], mes: [], semPrazo: [], pendentes: 0 };

  for (const item of itens) {
    if (!pendenteDeContratacao(item)) continue;
    agenda.pendentes += 1;

    if (!item.prazo_contratacao) {
      agenda.semPrazo.push(item);
      continue;
    }
    const d = diasAte(item.prazo_contratacao, hoje);
    if (d === null) {
      agenda.semPrazo.push(item);
      continue;
    }
    if (d < 0) agenda.vencidos.push(item);
    if (d === 0) agenda.hoje.push(item);
    if (d >= 0 && d <= 7) agenda.semana.push(item);
    if (d >= 0 && d <= 30) agenda.mes.push(item);
  }

  const porPrazo = (a: ItemContratacao, b: ItemContratacao) =>
    (a.prazo_contratacao ?? "").localeCompare(b.prazo_contratacao ?? "");
  agenda.vencidos.sort(porPrazo);
  agenda.hoje.sort(porPrazo);
  agenda.semana.sort(porPrazo);
  agenda.mes.sort(porPrazo);

  return agenda;
}

/** "Buffet (Alimentação)" — categoria só aparece quando existe. */
function rotulo(item: ItemContratacao): string {
  return item.categoria ? `${item.descricao} (${item.categoria})` : item.descricao;
}

/** "venceu há 3 dias" / "vence hoje" / "vence em 5 dias". */
export function prazoEmPalavras(item: ItemContratacao, hoje: string): string {
  if (!item.prazo_contratacao) return "sem prazo definido";
  const d = diasAte(item.prazo_contratacao, hoje);
  if (d === null) return "sem prazo definido";
  const data = fmtDateBR(item.prazo_contratacao);
  if (d < 0) return `venceu em ${data} — há ${Math.abs(d)} dia(s)`;
  if (d === 0) return `vence hoje (${data})`;
  if (d === 1) return `vence amanhã (${data})`;
  return `vence em ${d} dias (${data})`;
}

/**
 * Mensagem de lembrete pronta para o grupo. Prioriza o que dói mais:
 * vencidos → vence hoje → vence na semana → nada urgente.
 */
export function montarLembreteContratacao(
  agenda: AgendaContratacao,
  hoje: string,
  noivos: { noiva: string; noivo: string },
): string {
  const bloco = (itens: ItemContratacao[]) =>
    itens.map((i) => `• ${rotulo(i)} — ${prazoEmPalavras(i, hoje)}`).join("\n");
  const assinatura = "— Evania 💌";
  const rodapePendentes =
    agenda.semPrazo.length > 0
      ? `\n\nAinda sem prazo definido: ${agenda.semPrazo.length} item(ns). Vale definir uma data-limite para não perder o timing.`
      : "";

  if (agenda.vencidos.length > 0) {
    const linhas = [
      `Atenção, ${noivos.noiva} e ${noivos.noivo}. ⚠️`,
      `${agenda.vencidos.length} item(ns) passaram do prazo de contratação:`,
      "",
      bloco(agenda.vencidos),
    ];
    if (agenda.hoje.length > 0) {
      linhas.push("", `E ainda vence hoje:`, bloco(agenda.hoje));
    }
    linhas.push("", `Fornecedor bom fecha agenda cedo — vamos correr atrás desses?${rodapePendentes}`, "", assinatura);
    return linhas.join("\n");
  }

  if (agenda.hoje.length > 0) {
    return [
      `Bom dia, ${noivos.noiva} e ${noivos.noivo}! ☀️`,
      `Hoje é o prazo-limite para fechar ${agenda.hoje.length} item(ns):`,
      "",
      bloco(agenda.hoje),
      "",
      `Se já tiver proposta escolhida, é só marcar como "contratado" no sistema.${rodapePendentes}`,
      "",
      assinatura,
    ].join("\n");
  }

  const naSemana = agenda.semana.filter((i) => !agenda.hoje.includes(i));
  if (naSemana.length > 0) {
    return [
      `Bom dia! Nada vence hoje. 🎉`,
      `Nos próximos 7 dias, ${naSemana.length} item(ns) precisam estar contratados:`,
      "",
      bloco(naSemana),
      "",
      `Dá tempo de negociar com calma.${rodapePendentes}`,
      "",
      assinatura,
    ].join("\n");
  }

  if (agenda.pendentes === 0) {
    return `Bom dia! Todos os itens do orçamento já estão contratados. Nada pendente por aqui. 🤍 ${assinatura}`;
  }

  return [
    `Bom dia, ${noivos.noiva} e ${noivos.noivo}!`,
    `Nenhum prazo de contratação vence nos próximos 7 dias.`,
    `Ainda faltam contratar ${agenda.pendentes} item(ns) no total.${rodapePendentes}`,
    "",
    assinatura,
  ].join("\n");
}
