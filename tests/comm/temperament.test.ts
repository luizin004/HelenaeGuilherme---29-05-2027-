import { describe, expect, it } from "vitest";
import { resolveGuestCommunicationTemperament } from "@/domain/comm/temperament";

describe("temperamento — vínculo pessoal (Fase 3)", () => {
  it("pai/mãe dos noivos: afeto muito alto, formalidade baixa, aprovação humana", () => {
    const r = resolveGuestCommunicationTemperament({ nome: "Toninho", tipoVinculo: "pai", proximidade: "muito_intimo" });
    expect(r.affection).toBeGreaterThanOrEqual(90);
    expect(r.formality).toBeLessThan(40);
    expect(r.toneInstructions.some((t) => t.includes("não são apenas convidados"))).toBe(true);
  });

  it("padrasto/madrasta não herda a intimidade de pai/mãe automaticamente", () => {
    const paiReal = resolveGuestCommunicationTemperament({ tipoVinculo: "pai", proximidade: "moderado" });
    const padrasto = resolveGuestCommunicationTemperament({ tipoVinculo: "padrasto", proximidade: "moderado" });
    expect(padrasto.affection).toBeLessThan(paiReal.affection);
  });

  it("irmãos: íntimo, afetivo, formalidade baixa", () => {
    const r = resolveGuestCommunicationTemperament({ tipoVinculo: "irma", proximidade: "muito_intimo" });
    expect(r.formality).toBeLessThan(30);
    expect(r.affection).toBeGreaterThan(80);
  });

  it("avós: linguagem simples, sem emoji, mensagem completa", () => {
    const r = resolveGuestCommunicationTemperament({ tipoVinculo: "avoa", proximidade: "muito_intimo" });
    expect(r.emojiLevel).toBe("none");
    expect(r.messageLength).toBe("complete");
  });

  it("familiares distantes: elegante, menos íntimo, sem apelido automático", () => {
    const r = resolveGuestCommunicationTemperament({ tipoVinculo: "familiar_distante", apelidoAutorizado: null });
    expect(r.allowNickname).toBe(false);
    expect(r.affection).toBeLessThan(60);
  });

  it("melhores amigos: afeto muito alto, formalidade baixa, apelido permitido SE autorizado", () => {
    const semApelido = resolveGuestCommunicationTemperament({ tipoVinculo: "melhor_amigo", apelidoAutorizado: null });
    const comApelido = resolveGuestCommunicationTemperament({ tipoVinculo: "melhor_amigo", apelidoAutorizado: "Cadu" });
    expect(semApelido.allowNickname).toBe(false);
    expect(comApelido.allowNickname).toBe(true);
  });

  it("colegas de trabalho: cordial, objetivo, sem apelido, sem emoji", () => {
    const r = resolveGuestCommunicationTemperament({ tipoVinculo: "colega_trabalho" });
    expect(r.emojiLevel).toBe("none");
    expect(r.allowNickname).toBe(false);
    expect(r.formality).toBeGreaterThan(50);
  });

  it("sócios/clientes: formalidade alta, pouco humor, sem parecer comercial", () => {
    const r = resolveGuestCommunicationTemperament({ tipoVinculo: "socio", humorAutorizado: true });
    expect(r.formality).toBeGreaterThan(70);
    expect(r.toneInstructions.some((t) => t.includes("não mensagem comercial"))).toBe(true);
  });

  it("fornecedores: profissional, direto, não entra na jornada de convidados", () => {
    const r = resolveGuestCommunicationTemperament({ tipoVinculo: "fornecedor" });
    expect(r.humor).toBeLessThanOrEqual(20);
    expect(r.toneInstructions.some((t) => t.includes("não incluir automaticamente nas jornadas"))).toBe(true);
  });

  it("líderes religiosos: não presume crenças ou títulos", () => {
    const r = resolveGuestCommunicationTemperament({ tipoVinculo: "lider_religioso" });
    expect(r.toneInstructions.some((t) => t.includes("não presumir crenças"))).toBe(true);
  });
});

describe("temperamento — papel no casamento SOMA ao vínculo (Fase 3, exemplo do enunciado)", () => {
  it("irmã que também é madrinha: mantém intimidade de irmã + reconhecimento de madrinha", () => {
    const soIrma = resolveGuestCommunicationTemperament({ tipoVinculo: "irma", proximidade: "muito_intimo" });
    const irmaMadrinha = resolveGuestCommunicationTemperament({ tipoVinculo: "irma", proximidade: "muito_intimo", papel: "madrinha" });
    // continua íntima (não vira formal por causa do papel)
    expect(irmaMadrinha.formality).toBeLessThan(40);
    // ganha a camada extra de reconhecimento/aprovação do papel
    expect(irmaMadrinha.requiresApproval).toBe(true);
    expect(irmaMadrinha.affection).toBeGreaterThanOrEqual(soIrma.affection);
    expect(irmaMadrinha.reasoningSummary).toContain("irmã");
    expect(irmaMadrinha.reasoningSummary).toContain("madrinha");
  });

  it("padrinho sozinho (sem vínculo familiar) ainda exige aprovação humana", () => {
    const r = resolveGuestCommunicationTemperament({ tipoVinculo: "amigo_proximo", papel: "padrinho" });
    expect(r.requiresApproval).toBe(true);
  });
});

describe("temperamento — modificadores de contexto (Fase 4)", () => {
  it("confirmado: mais alegria, zero urgência, nunca pede nova confirmação", () => {
    const r = resolveGuestCommunicationTemperament({ tipoVinculo: "amigo", status: "confirmado" });
    expect(r.urgency).toBe(0);
    expect(r.avoidInstructions).toContain("pedir nova confirmação de presença");
  });

  it("pendente longe do prazo: urgência baixa; perto do prazo: urgência sobe", () => {
    const longe = resolveGuestCommunicationTemperament({ tipoVinculo: "amigo", status: "pendente", prazoRsvpProximo: false });
    const perto = resolveGuestCommunicationTemperament({ tipoVinculo: "amigo", status: "pendente", prazoRsvpProximo: true });
    expect(perto.urgency).toBeGreaterThan(longe.urgency);
  });

  it("recusado: sem urgência, sem novos pedidos", () => {
    const r = resolveGuestCommunicationTemperament({ tipoVinculo: "amigo", status: "recusado" });
    expect(r.urgency).toBe(0);
    expect(r.avoidInstructions).toContain("pedir presença novamente");
  });

  it("outra cidade: mais objetividade, orienta hospedagem/transporte", () => {
    const r = resolveGuestCommunicationTemperament({ tipoVinculo: "amigo", outraCidade: true });
    expect(r.toneInstructions.some((t) => t.includes("hospedagem"))).toBe(true);
  });

  it("pessoa idosa: sem emoji, mensagem completa, evita depender de link", () => {
    const r = resolveGuestCommunicationTemperament({ tipoVinculo: "tia", pessoaIdosa: true });
    expect(r.emojiLevel).toBe("none");
    expect(r.messageLength).toBe("complete");
    expect(r.toneInstructions.some((t) => t.includes("passo a passo"))).toBe(true);
  });

  it("responsável por criança: clareza e tranquilização", () => {
    const r = resolveGuestCommunicationTemperament({ tipoVinculo: "amigo", papel: "responsavel_crianca" });
    expect(r.toneInstructions.some((t) => t.includes("tranquilização"))).toBe(true);
    expect(r.toneInstructions.some((t) => t.includes("oficialmente confirmados"))).toBe(true);
  });

  it("situação sensível: zera humor, força aprovação humana", () => {
    const r = resolveGuestCommunicationTemperament({ tipoVinculo: "melhor_amigo", humorAutorizado: true, situacaoSensivel: true });
    expect(r.humor).toBe(0);
    expect(r.requiresApproval).toBe(true);
  });

  it("forcarAprovacao é sempre respeitado, mesmo em vínculo neutro", () => {
    const r = resolveGuestCommunicationTemperament({ tipoVinculo: "conhecido", forcarAprovacao: true });
    expect(r.requiresApproval).toBe(true);
  });
});

describe("temperamento — regras de segurança (Fase 8)", () => {
  it("humor nunca é ligado só pela categoria — precisa de autorização explícita", () => {
    const semAutorizacao = resolveGuestCommunicationTemperament({ tipoVinculo: "melhor_amigo" });
    const comAutorizacao = resolveGuestCommunicationTemperament({ tipoVinculo: "melhor_amigo", humorAutorizado: true });
    expect(semAutorizacao.humor).toBeLessThanOrEqual(20);
    expect(comAutorizacao.humor).toBeGreaterThan(semAutorizacao.humor);
  });

  it("áudio respeita o consentimento (aceitaAudio=false sempre bloqueia)", () => {
    const r = resolveGuestCommunicationTemperament({ tipoVinculo: "irma", aceitaAudio: false });
    expect(r.allowAudio).toBe(false);
  });

  it("todos os eixos numéricos ficam sempre entre 0 e 100", () => {
    const r = resolveGuestCommunicationTemperament({
      tipoVinculo: "pai",
      proximidade: "muito_intimo",
      papel: "padrinho",
      status: "pendente",
      prazoRsvpProximo: true,
      outraCidade: true,
      pessoaIdosa: true,
      situacaoSensivel: true,
      humorAutorizado: true,
    });
    for (const v of [r.formality, r.affection, r.objectivity, r.humor, r.urgency]) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });

  it("é determinística: mesma entrada produz a mesma saída", () => {
    const input = { tipoVinculo: "tio" as const, proximidade: "proximo" as const, papel: "padrinho" };
    expect(resolveGuestCommunicationTemperament(input)).toEqual(resolveGuestCommunicationTemperament(input));
  });

  it("sugestaoTexto vem pronta para preencher os campos existentes do perfil", () => {
    const r = resolveGuestCommunicationTemperament({ tipoVinculo: "irma" });
    expect(r.sugestaoTexto.tom).toBeTruthy();
    expect(r.sugestaoTexto.formalidade).toBeTruthy();
    expect(r.sugestaoTexto.tratamento).toBeTruthy();
    expect(r.sugestaoTexto.humor).toBeTruthy();
    expect(r.sugestaoTexto.tamanho).toBeTruthy();
  });

  it("sem nenhum dado, ainda devolve uma sugestão neutra e segura (nunca quebra)", () => {
    const r = resolveGuestCommunicationTemperament({});
    expect(r.requiresApproval).toBe(false);
    expect(r.allowNickname).toBe(false);
    expect(r.humor).toBeLessThanOrEqual(20);
  });
});
