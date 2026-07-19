import QRCode from "qrcode";

/** Gera o QR Code (data URL PNG) para um texto/URL. Server-side. */
export async function qrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    margin: 1,
    width: 200,
    color: { dark: "#4b5540", light: "#ffffff" },
  });
}

/** URL do convite pessoal do convidado a partir do token. */
export function conviteUrl(token: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return `${base}/rsvp/${token}`;
}
