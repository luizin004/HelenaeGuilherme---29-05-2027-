import { describe, expect, it } from "vitest";
import { filtrarAudiencia, type PessoaAudiencia } from "@/domain/comm/audience";
import { gerarRascunhosLocais } from "@/domain/comm/draft";
import { repeticaoArtificialDoNome } from "@/domain/comm/personalize";
import { dedupAudiencia } from "@/domain/comm/idempotency";

const pessoas: PessoaAudiencia[] = [
  { id: "1", nome: "Carlos", lado: "guilherme", status: "confirmado", telefone: "+55 31 90000-0001", ehPadrinho: true, cidadePartida: "Belo Horizonte" },
  { id: "2", nome: "Ana", lado: "helena", status: "pendente", telefone: null, ehCrianca: false },
  { id: "3", nome: "Bia (crianca)", lado: "helena", status: "confirmado", telefone: "+55 31 90000-0003", ehCrianca: true },
  { id: "4", nome: "Davi", lado: "guilherme", status: "recusado", telefone: "+55 31 90000-0004", optOut: true },
];

describe("filtro de audiência (§7)", () => {
  it("padrão exclui opt-out e crianças", () => {
    const r = filtrarAudiencia(pessoas, {});
    expect(r.incluidos.map((p) => p.id).sort()).toEqual(["1", "2"]);
    expect(r.excluidos.find((e) => e.pessoa.id === "3")?.motivo).toBe("crianca");
    expect(r.excluidos.find((e) => e.pessoa.id === "4")?.motivo).toBe("opt_out");
  });

  it("filtra por lado e por RSVP", () => {
    expect(filtrarAudiencia(pessoas, { lado: "helena" }).incluidos.map((p) => p.id)).toEqual(["2"]);
    expect(filtrarAudiencia(pessoas, { status: "confirmado" }).incluidos.map((p) => p.id)).toEqual(["1"]);
  });

  it("apenas padrinhos e apenas com telefone", () => {
    expect(filtrarAudiencia(pessoas, { apenasPadrinhos: true }).incluidos.map((p) => p.id)).toEqual(["1"]);
    expect(filtrarAudiencia(pessoas, { telefone: "com" }).incluidos.map((p) => p.id).sort()).toEqual(["1"]);
    // Ana (sem telefone) entra em "sem"
    expect(filtrarAudiencia(pessoas, { telefone: "sem", incluirCriancas: true }).incluidos.map((p) => p.id)).toEqual(["2"]);
  });

  it("a audiência incluída não tem duplicados", () => {
    const inc = filtrarAudiencia(pessoas, {}).incluidos.map((p) => ({ destinatarioId: p.id }));
    expect(dedupAudiencia(inc).duplicados).toHaveLength(0);
  });
});

describe("rascunhos locais (sem IA)", () => {
  it("gera 3 variações, usa o nome uma vez e inclui CTA", () => {
    const v = gerarRascunhosLocais({ nome: "Carlos Eduardo", papel: "padrinho", fase: "conexao", cta: "Confirme quando o RSVP abrir." });
    expect(v).toHaveLength(3);
    for (const msg of v) {
      expect(msg.startsWith("Carlos,")).toBe(true);
      expect(repeticaoArtificialDoNome(msg, "Carlos")).toBe(false);
      expect(msg).toContain("Helena & Guilherme");
    }
    expect(v[0]).toContain("padrinho");
    expect(v[0]).toContain("Confirme quando o RSVP abrir.");
  });

  it("usa tratamento neutro quando não há nome autorizado", () => {
    const v = gerarRascunhosLocais({ nome: "", fase: "agradecimento" });
    expect(v[0].startsWith("Olá,")).toBe(true);
  });
});
