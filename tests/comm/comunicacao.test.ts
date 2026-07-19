import { describe, expect, it } from "vitest";
import {
  firstName,
  nomeDeTratamento,
  saudacaoFamilia,
  saudacaoDupla,
  aplicarVariaveis,
  repeticaoArtificialDoNome,
} from "@/domain/comm/personalize";
import { sanitizeContext, contemDadoProibido } from "@/domain/comm/sanitize";
import { podeEnviar, telefoneValido, dentroDaJanela, minutosLocais } from "@/domain/comm/consent";
import { chaveIdempotencia, dedupAudiencia } from "@/domain/comm/idempotency";
import { resolverContexto } from "@/domain/comm/profile";

describe("personalização do nome (§12)", () => {
  it("extrai o primeiro nome", () => {
    expect(firstName("Carlos Eduardo Silva")).toBe("Carlos");
    expect(firstName("  ")).toBe("");
  });

  it("prefere apelido → preferido → primeiro nome → neutro, sem inventar", () => {
    expect(nomeDeTratamento({ nome: "Carlos Silva", apelidoAutorizado: "Cacá" })).toBe("Cacá");
    expect(nomeDeTratamento({ nome: "Carlos Silva", nomePreferido: "Carlinhos" })).toBe("Carlinhos");
    expect(nomeDeTratamento({ nome: "Carlos Silva" })).toBe("Carlos");
    expect(nomeDeTratamento({ nome: "", tratamentoNeutro: "Olá" })).toBe("Olá");
    expect(nomeDeTratamento({})).toBe("Olá");
  });

  it("saudações de família e dupla", () => {
    expect(saudacaoFamilia("Silva")).toBe("Família Silva");
    expect(saudacaoDupla("Carlos Silva", "Mariana Souza")).toBe("Carlos e Mariana");
    expect(saudacaoDupla("Carlos", null)).toBe("Carlos");
  });

  it("aplica variáveis e reporta as faltando", () => {
    const r = aplicarVariaveis("{{primeiro_nome}}, tudo bem? Cidade: {{cidade}}", {
      primeiro_nome: "Carlos",
      cidade: "",
    });
    expect(r.texto).toBe("Carlos, tudo bem? Cidade: ");
    expect(r.faltando).toEqual(["cidade"]);
  });

  it("detecta repetição artificial do nome", () => {
    expect(repeticaoArtificialDoNome("Carlos, olá Carlos, queremos você, Carlos", "Carlos Silva")).toBe(true);
    expect(repeticaoArtificialDoNome("Carlos, ficamos felizes por ter você conosco.", "Carlos")).toBe(false);
  });
});

describe("sanitização do contexto da IA (§28)", () => {
  const dados = {
    primeiro_nome: "Carlos",
    cidade: "Belo Horizonte",
    financeiro: "R$ 5.000",
    valor_presente: 30000,
    observacoes_internas: "não gosta de telefonema",
    tokens: "abc",
    parentesco: "",
  };

  it("envia só o permitido e remove o proibido", () => {
    const r = sanitizeContext(dados, { permitido: ["primeiro_nome", "cidade", "parentesco", "financeiro"] });
    expect(r.enviado).toEqual({ primeiro_nome: "Carlos", cidade: "Belo Horizonte" });
    // financeiro está em "permitido" mas é sempre-proibido → removido
    expect(r.removido).toContain("financeiro");
    expect(r.removido).toContain("valor_presente");
    expect(r.removido).toContain("observacoes_internas");
    expect(r.removido).toContain("tokens");
    expect(r.categoriasEnviadas.sort()).toEqual(["cidade", "primeiro_nome"]);
  });

  it("acusa presença de dado proibido preenchido", () => {
    expect(contemDadoProibido(dados)).toBe(true);
    expect(contemDadoProibido({ primeiro_nome: "Carlos" })).toBe(false);
  });
});

describe("regras de envio (§19/§31)", () => {
  const base = {
    canal: "whatsapp" as const,
    perfil: { aceitaWhatsapp: true, telefone: "+55 31 99999-0000", aceitaLembretes: true },
    canalValidado: true,
    enviosRecentes: 0,
    limitePorPessoa: 3,
  };

  it("bloqueia quando o canal não está validado (§31.1)", () => {
    expect(podeEnviar({ ...base, canalValidado: false }).motivo).toBe("canal_nao_validado");
  });
  it("bloqueia opt-out", () => {
    expect(podeEnviar({ ...base, perfil: { ...base.perfil, optOut: true } }).motivo).toBe("opt_out");
  });
  it("bloqueia sem telefone válido", () => {
    expect(podeEnviar({ ...base, perfil: { ...base.perfil, telefone: "123" } }).motivo).toBe("telefone_invalido");
  });
  it("bloqueia aprovação pendente (§20)", () => {
    expect(podeEnviar({ ...base, aprovacaoPendente: true }).motivo).toBe("aprovacao_pendente");
  });
  it("bloqueia fora da janela de horário", () => {
    const r = podeEnviar({ ...base, janela: { agoraMin: 7 * 60, inicioMin: 8 * 60, fimMin: 20 * 60 } });
    expect(r.motivo).toBe("fora_da_janela");
  });
  it("bloqueia por limite de frequência", () => {
    expect(podeEnviar({ ...base, enviosRecentes: 3 }).motivo).toBe("limite_frequencia");
  });
  it("permite quando tudo confere", () => {
    const r = podeEnviar({ ...base, janela: { agoraMin: 10 * 60, inicioMin: 8 * 60, fimMin: 20 * 60 } });
    expect(r.ok).toBe(true);
  });

  it("telefone e janela", () => {
    expect(telefoneValido("+55 31 99999-0000")).toBe(true);
    expect(telefoneValido("31 3333-4444")).toBe(true);
    expect(telefoneValido("123")).toBe(false);
    expect(dentroDaJanela({ agoraMin: 480, inicioMin: 480, fimMin: 1200 })).toBe(true);
    expect(dentroDaJanela({ agoraMin: 479, inicioMin: 480, fimMin: 1200 })).toBe(false);
  });

  it("minutosLocais respeita o fuso America/Sao_Paulo", () => {
    // 2027-05-29T18:00:00Z = 15:00 em São Paulo (UTC-3)
    const d = new Date("2027-05-29T18:00:00Z");
    expect(minutosLocais(d)).toBe(15 * 60);
  });
});

describe("idempotência e deduplicação (§31.13-14)", () => {
  it("mesma combinação gera a mesma chave", () => {
    const a = chaveIdempotencia({ campaignId: "cmp1", destinatarioId: "g1", canal: "whatsapp", diaISO: "2027-05-01" });
    const b = chaveIdempotencia({ campaignId: "cmp1", destinatarioId: "g1", canal: "whatsapp", diaISO: "2027-05-01" });
    expect(a).toBe(b);
    const c = chaveIdempotencia({ campaignId: "cmp1", destinatarioId: "g2", canal: "whatsapp", diaISO: "2027-05-01" });
    expect(a).not.toBe(c);
  });

  it("remove duplicados e detecta pessoa em vários segmentos", () => {
    const r = dedupAudiencia([
      { destinatarioId: "g1", segmento: "padrinhos" },
      { destinatarioId: "g1", segmento: "outra_cidade" },
      { destinatarioId: "g2", segmento: "padrinhos" },
    ]);
    expect(r.unicos).toHaveLength(2);
    expect(r.duplicados).toHaveLength(1);
    expect(r.emVariosSegmentos).toEqual(["g1"]);
  });
});

describe("herança de contexto família → indivíduo (§3)", () => {
  it("herda da família e sobrescreve com o indivíduo", () => {
    const fam = { tom: "formal", tratamento: "senhor", historiaAutorizada: "amigos da igreja" };
    const ind = { tom: "afetuoso", herdarFamilia: true };
    expect(resolverContexto(ind, fam)).toEqual({
      tom: "afetuoso",
      tratamento: "senhor",
      historiaAutorizada: "amigos da igreja",
    });
  });
  it("ignora a família quando herdarFamilia é false", () => {
    const fam = { tom: "formal" };
    const ind = { tom: "afetuoso", herdarFamilia: false };
    expect(resolverContexto(ind, fam)).toEqual({ tom: "afetuoso" });
  });
});

// Cenário obrigatório (§32): Carlos, padrinho, amigo de infância de Guilherme, BH,
// medidas pendentes, ensaio não confirmado, aceita WhatsApp e áudio.
describe("cenário obrigatório — Carlos (§32)", () => {
  const carlos = {
    nome: "Carlos Eduardo",
    aceitaWhatsapp: true,
    aceitaAudio: true,
    aceitaLembretes: true,
    telefone: "+55 31 98888-1234",
  };

  it("gera mensagem personalizada com nome natural e sem dado proibido", () => {
    const contexto = {
      primeiro_nome: firstName(carlos.nome),
      papel: "padrinho",
      cidade: "Belo Horizonte",
      valor_presente: 50000, // deve ser removido
    };
    const s = sanitizeContext(contexto, { permitido: ["primeiro_nome", "papel", "cidade"] });
    expect(s.enviado).toEqual({ primeiro_nome: "Carlos", papel: "padrinho", cidade: "Belo Horizonte" });
    expect(s.removido).toContain("valor_presente");

    const msg = aplicarVariaveis("{{primeiro_nome}}, que alegria ter você como padrinho!", {
      primeiro_nome: s.enviado.primeiro_nome as string,
    });
    expect(msg.texto).toBe("Carlos, que alegria ter você como padrinho!");
    expect(msg.faltando).toHaveLength(0);
    expect(repeticaoArtificialDoNome(msg.texto, carlos.nome)).toBe(false);
  });

  it("mensagem crítica (convite de padrinho) exige aprovação antes do envio", () => {
    const r = podeEnviar({
      canal: "whatsapp",
      perfil: carlos,
      canalValidado: true,
      enviosRecentes: 0,
      limitePorPessoa: 3,
      aprovacaoPendente: true,
    });
    expect(r.ok).toBe(false);
    expect(r.motivo).toBe("aprovacao_pendente");
  });
});
