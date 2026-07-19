import { describe, expect, it } from "vitest";
import { generateQrToken, generateQrUuid, isOpaqueToken } from "@/domain/qr";

describe("QR token (PROJECT_SPEC §8: sem dado pessoal)", () => {
  it("gera token opaco e url-safe", () => {
    const t = generateQrToken();
    expect(isOpaqueToken(t)).toBe(true);
    expect(t).toMatch(/^[A-Za-z0-9_-]+$/); // base64url
  });

  it("gera tokens únicos (sem colisão em 5000)", () => {
    const set = new Set<string>();
    for (let i = 0; i < 5000; i++) set.add(generateQrToken());
    expect(set.size).toBe(5000);
  });

  it("UUID v4 válido para a coluna qr_token", () => {
    expect(generateQrUuid()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it("rejeita tokens com dado legível (e-mail, id sequencial)", () => {
    expect(isOpaqueToken("maria@email.com")).toBe(false);
    expect(isOpaqueToken("12345")).toBe(false);
    expect(isOpaqueToken("João Silva")).toBe(false);
  });
});
