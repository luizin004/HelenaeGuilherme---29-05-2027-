import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const sans = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Helena & Guilherme · 29.05.2027",
  description:
    "Helena & Guilherme — O início do nosso maior projeto. 29 de maio de 2027, Itabira · MG. Acompanhe cada detalhe do nosso grande dia.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  openGraph: {
    title: "Helena & Guilherme · Casamento",
    description: "29 de Maio de 2027. Você é nosso convidado.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#8a7359",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${serif.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
