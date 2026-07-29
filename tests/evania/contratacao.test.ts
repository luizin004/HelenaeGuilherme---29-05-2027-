import { describe, expect, it } from "vitest";
import {
  agendaContratacao,
  montarLembreteContratacao,
  pendenteDeContratacao,
  prazoEmPalavras,
  type ItemContratacao,
} from "@/domain/evania/contratacao";

const HOJE = "2026-07-29";
const NOIVOS = { noiva: "Helena", noivo: "Guilherme" };

function item(over: Partial<ItemContratacao> & { id: string }): ItemContratacao {
  return {
    descricao: `Item ${over.id}`,
    categoria: null,
    estado: "previsto",
    gratuito: false,
    prazo_contratacao: null,
    ...over,
  };
}

describe("pendenteDeContratacao", () => {
  it("previsto e orçado ainda precisam ser contratados", () => {
    expect(pendenteDeContratacao(item({ id: "a", estado: "previsto" }))).toBe(true);
    expect(pendenteDeContratacao(item({ id: "b", estado: "orcado" }))).toBe(true);
  });

  it("contratado, pago e gratuito já estão fechados", () => {
    expect(pendenteDeContratacao(item({ id: "c", estado: "contratado" }))).toBe(false);
    expect(pendenteDeContratacao(item({ id: "d", estado: "pago" }))).toBe(false);
    expect(pendenteDeContratacao(item({ id: "e", estado: "gratuito" }))).toBe(false);
  });

  it("item marcado como gratuito nunca entra, mesmo previsto", () => {
    expect(pendenteDeContratacao(item({ id: "f", estado: "previsto", gratuito: true }))).toBe(false);
  });
});

describe("agendaContratacao", () => {
  const itens = [
    item({ id: "vencido", prazo_contratacao: "2026-07-20" }),
    item({ id: "hoje", prazo_contratacao: HOJE }),
    item({ id: "semana", prazo_contratacao: "2026-08-03" }),
    item({ id: "mes", prazo_contratacao: "2026-08-20" }),
    item({ id: "longe", prazo_contratacao: "2026-12-01" }),
    item({ id: "sem-prazo" }),
    item({ id: "fechado", estado: "contratado", prazo_contratacao: "2026-07-01" }),
  ];
  const a = agendaContratacao(itens, HOJE);

  it("separa vencidos, hoje, semana e mês", () => {
    expect(a.vencidos.map((i) => i.id)).toEqual(["vencido"]);
    expect(a.hoje.map((i) => i.id)).toEqual(["hoje"]);
    expect(a.semana.map((i) => i.id)).toEqual(["hoje", "semana"]);
    expect(a.mes.map((i) => i.id)).toEqual(["hoje", "semana", "mes"]);
  });

  it("agrupa os sem prazo à parte", () => {
    expect(a.semPrazo.map((i) => i.id)).toEqual(["sem-prazo"]);
  });

  it("não conta itens já contratados", () => {
    expect(a.pendentes).toBe(6);
    expect([...a.vencidos, ...a.semana, ...a.mes].some((i) => i.id === "fechado")).toBe(false);
  });

  it("ordena cada balde pelo prazo mais próximo", () => {
    const desordenado = [
      item({ id: "b", prazo_contratacao: "2026-07-10" }),
      item({ id: "a", prazo_contratacao: "2026-07-01" }),
    ];
    expect(agendaContratacao(desordenado, HOJE).vencidos.map((i) => i.id)).toEqual(["a", "b"]);
  });
});

describe("prazoEmPalavras", () => {
  it("descreve vencido, hoje, amanhã e futuro", () => {
    expect(prazoEmPalavras(item({ id: "x", prazo_contratacao: "2026-07-26" }), HOJE)).toContain("venceu em 26/07/2026");
    expect(prazoEmPalavras(item({ id: "x", prazo_contratacao: HOJE }), HOJE)).toContain("vence hoje");
    expect(prazoEmPalavras(item({ id: "x", prazo_contratacao: "2026-07-30" }), HOJE)).toContain("vence amanhã");
    expect(prazoEmPalavras(item({ id: "x", prazo_contratacao: "2026-08-05" }), HOJE)).toContain("vence em 7 dias");
  });

  it("sem prazo diz que falta definir", () => {
    expect(prazoEmPalavras(item({ id: "x" }), HOJE)).toBe("sem prazo definido");
  });
});

describe("montarLembreteContratacao", () => {
  it("prioriza os vencidos e cita também o que vence hoje", () => {
    const a = agendaContratacao(
      [
        item({ id: "1", descricao: "Banda", prazo_contratacao: "2026-07-20" }),
        item({ id: "2", descricao: "Flores", prazo_contratacao: HOJE }),
      ],
      HOJE,
    );
    const msg = montarLembreteContratacao(a, HOJE, NOIVOS);
    expect(msg).toContain("passaram do prazo");
    expect(msg).toContain("Banda");
    expect(msg).toContain("vence hoje");
    expect(msg).toContain("Flores");
  });

  it("sem vencidos, foca no prazo de hoje", () => {
    const a = agendaContratacao([item({ id: "1", descricao: "Bolo", prazo_contratacao: HOJE })], HOJE);
    const msg = montarLembreteContratacao(a, HOJE, NOIVOS);
    expect(msg).toContain("prazo-limite");
    expect(msg).toContain("Bolo");
  });

  it("sem nada hoje, avisa o que vence na semana", () => {
    const a = agendaContratacao([item({ id: "1", descricao: "DJ", prazo_contratacao: "2026-08-02" })], HOJE);
    const msg = montarLembreteContratacao(a, HOJE, NOIVOS);
    expect(msg).toContain("próximos 7 dias");
    expect(msg).toContain("DJ");
  });

  it("tudo contratado gera mensagem tranquila", () => {
    const a = agendaContratacao([item({ id: "1", estado: "contratado" })], HOJE);
    expect(montarLembreteContratacao(a, HOJE, NOIVOS)).toContain("já estão contratados");
  });

  it("menciona os itens sem prazo definido", () => {
    const a = agendaContratacao(
      [item({ id: "1", prazo_contratacao: "2026-07-20" }), item({ id: "2" })],
      HOJE,
    );
    expect(montarLembreteContratacao(a, HOJE, NOIVOS)).toContain("sem prazo definido: 1 item");
  });

  it("pendências distantes não viram urgência", () => {
    const a = agendaContratacao([item({ id: "1", prazo_contratacao: "2026-12-01" })], HOJE);
    const msg = montarLembreteContratacao(a, HOJE, NOIVOS);
    expect(msg).toContain("Nenhum prazo de contratação vence nos próximos 7 dias");
    expect(msg).toContain("faltam contratar 1 item");
  });
});
