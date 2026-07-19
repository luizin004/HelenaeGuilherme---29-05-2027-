import { test, expect } from "@playwright/test";

test.describe("Site público", () => {
  test("home carrega com nomes, conceito e data", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Helena & Guilherme/);
    await expect(page.getByRole("heading", { name: /Helena/ }).first()).toBeVisible();
    await expect(page.getByText("O início do nosso maior projeto")).toBeVisible();
    await expect(page.getByText("29 · Maio · 2027")).toBeVisible();
  });

  test("contagem regressiva aparece", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Faltam", { exact: true })).toBeVisible();
    await expect(page.getByText("dias", { exact: true })).toBeVisible();
  });

  test("locais reais de Itabira aparecem", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Igreja Nossa Senhora da Piedade")).toBeVisible();
    await expect(page.getByText("Sítio Rancho das Águas")).toBeVisible();
    await expect(page.getByText("Esporte fino completo")).toBeVisible();
  });

  test("RSVP por código navega para o convite", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder("Código do convite").fill("abc-123");
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page).toHaveURL(/\/rsvp\/abc-123/);
    await expect(page.getByText("Confirmação de presença")).toBeVisible();
  });

  test("página de presentes carrega", async ({ page }) => {
    await page.goto("/presentes");
    await expect(page.getByRole("heading", { name: "Lista de presentes" })).toBeVisible();
  });

  test("páginas informativas carregam (dúvidas, programação, privacidade, termos)", async ({ page }) => {
    await page.goto("/duvidas");
    await expect(page.getByRole("heading", { name: "Dúvidas frequentes" })).toBeVisible();
    await expect(page.getByText("Esporte fino completo")).toBeVisible();

    await page.goto("/programacao");
    await expect(page.getByRole("heading", { name: "Programação" })).toBeVisible();

    await page.goto("/privacidade");
    await expect(page.getByRole("heading", { name: "Política de privacidade" })).toBeVisible();

    await page.goto("/termos");
    await expect(page.getByRole("heading", { name: "Termos de uso" })).toBeVisible();
  });

  test("página inexistente mostra 404", async ({ page }) => {
    const res = await page.goto("/rota-que-nao-existe");
    expect(res?.status()).toBe(404);
    await expect(page.getByText("404")).toBeVisible();
  });
});
