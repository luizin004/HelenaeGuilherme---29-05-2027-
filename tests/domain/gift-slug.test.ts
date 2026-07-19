import { describe, expect, it } from "vitest";
import { giftSlug } from "@/domain/gifts/slug";

describe("slug do presente → nome do arquivo de foto", () => {
  it("remove acentos, pontuação e espaços", () => {
    expect(giftSlug("Cantinho do café da nossa casa")).toBe("cantinho-do-cafe-da-nossa-casa");
    expect(giftSlug("Louças para receber a família")).toBe("loucas-para-receber-a-familia");
    expect(giftSlug("Adega dos recém-casados")).toBe("adega-dos-recem-casados");
    expect(giftSlug('Cota para o Guilherme dizer "pode comprar, amor"')).toBe(
      "cota-para-o-guilherme-dizer-pode-comprar-amor",
    );
  });
  it("é determinístico e sem bordas", () => {
    expect(giftSlug("  Jardim da nossa casa  ")).toBe("jardim-da-nossa-casa");
    expect(giftSlug("Jardim da nossa casa")).toBe(giftSlug("Jardim da nossa casa"));
  });
});
