/** Data ISO "2027-05-29" → "29/05/2027". Vazio vira "—". */
export function fmtDateBR(iso: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return d && m && y ? `${d}/${m}/${y}` : "—";
}

/** Hoje em ISO (YYYY-MM-DD), fuso America/Sao_Paulo. */
export function hojeISO(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

/** Dias entre hoje e uma data ISO (negativo = já passou). null se sem data. */
export function diasAte(iso: string | null, hoje: string): number | null {
  if (!iso) return null;
  const a = Date.parse(`${iso.slice(0, 10)}T00:00:00-03:00`);
  const b = Date.parse(`${hoje}T00:00:00-03:00`);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.round((a - b) / 86_400_000);
}
