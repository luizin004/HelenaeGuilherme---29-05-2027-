import type { Config } from "tailwindcss";

/**
 * Design system — Helena & Guilherme
 * "O início do nosso maior projeto"
 *
 * Paleta natural: off-white / areia / bege (base),
 * verde-oliva e verde-musgo (primárias),
 * marrom amadeirado e dourado fosco (acentos).
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Primárias — verdes
        olive: { DEFAULT: "#6f7352", light: "#8f9470" },
        moss: { DEFAULT: "#4b5540", deep: "#333b2b" },
        // Acentos
        gold: { DEFAULT: "#b89b6a", soft: "#e6dcc4" }, // dourado fosco / sand-gold
        wood: "#8a7359", // marrom amadeirado (monograma / toques quentes)
        // Base neutra quente
        ivory: "#faf8f3", // off-white
        cream: "#f0ebe2",
        sand: "#ece3d3", // areia / bege
        ink: "#33372b", // texto (verde-terroso escuro)
        muted: "#6f6f5c",
        line: "#ddd7c6",
        // Semânticos
        success: "#6f8a5e",
        danger: "#b06a55",
        warn: "#c79a4a",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 40px rgba(51,59,43,0.10)",
        card: "0 6px 24px rgba(51,59,43,0.08)",
      },
      maxWidth: { content: "1120px" },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(30px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: { fadeUp: "fadeUp 1.2s ease both" },
    },
  },
  plugins: [],
};

export default config;
