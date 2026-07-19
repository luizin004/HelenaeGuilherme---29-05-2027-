import { randomBytes, randomUUID } from "node:crypto";

/**
 * Token do QR Code (PROJECT_SPEC §8): APENAS um token aleatório e seguro.
 * NUNCA incluir nome, telefone, e-mail, CPF, ID sequencial ou dado legível.
 */

/** Gera um token opaco url-safe (32 bytes → 43 chars base64url). */
export function generateQrToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Alternativa em UUID v4 (compatível com a coluna `guests.qr_token uuid`). */
export function generateQrUuid(): string {
  return randomUUID();
}

/** Um token válido é opaco: sem espaços, sem "@", sem dígitos-sequência óbvia. */
export function isOpaqueToken(token: string): boolean {
  if (token.length < 20) return false;
  if (/\s/.test(token)) return false;
  if (token.includes("@")) return false; // não é e-mail
  if (/^\d+$/.test(token)) return false; // não é ID sequencial
  return true;
}
