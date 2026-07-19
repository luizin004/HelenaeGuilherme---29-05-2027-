import { defineConfig } from "@playwright/test";

/**
 * E2E do site público, rodando em MODO DEMONSTRAÇÃO (sem Supabase) — assim os testes
 * independem do egress bloqueado neste ambiente. Fluxos que dependem do banco
 * (login, RSVP gravando) são validados no deploy.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    launchOptions: {
      executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    },
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: false,
    timeout: 120_000,
    // Força o modo demonstração (sem backend) para os testes de UI.
    env: { NEXT_PUBLIC_SUPABASE_URL: "", NEXT_PUBLIC_SUPABASE_ANON_KEY: "" },
  },
});
