import type { Config } from "tailwindcss";

/**
 * Design system — Helena & Guilherme
 * Paleta bronze / champanhe extraída do monograma HG.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bronze: {
          DEFAULT: "#8a7359",
          dark: "#5c4a38",
          deep: "#45372a",
          light: "#a08a6f",
        },
        champagne: {
          DEFAULT: "#c9b79c",
          soft: "#e4d9c6",
        },
        ivory: "#faf8f3",
        cream: "#f0ebe2",
        sand: "#ede6da",
        ink: "#3a3129",
        muted: "#7a6f61",
        line: "#e0d8ca",
        success: "#6f8a5e",
        danger: "#b06a55",
        warn: "#c79a4a",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 40px rgba(69,55,42,0.10)",
        card: "0 6px 24px rgba(69,55,42,0.08)",
      },
      maxWidth: {
        content: "1120px",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(30px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        fadeUp: "fadeUp 1.2s ease both",
      },
    },
  },
  plugins: [],
};

export default config;
