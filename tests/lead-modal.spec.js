// @ts-check
const { test, expect } = require("@playwright/test");

const HERO_CTA = ".hero__actions [data-lead-modal-trigger]";
const ENDPOINT = "**/macros/s/**/exec";

test.describe("Modal de inscrição", () => {
  test("todos os CTAs de inscrição abrem nome, e-mail e telefone", async ({ page }) => {
    await page.goto("/");
    const triggers = page.locator("[data-lead-modal-trigger]");
    await expect(triggers).toHaveCount(4);
    for (const trigger of await triggers.all()) {
      await trigger.click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog.getByLabel("Nome")).toBeVisible();
      await expect(dialog.getByLabel("E-mail")).toBeVisible();
      await expect(dialog.getByLabel("Telefone + DDD")).toBeVisible();
      await dialog.locator("[data-lead-modal-close]").click();
    }
  });

  test("validação impede envio inválido e mantém o modal aberto", async ({ page }) => {
    await page.addInitScript(() => {
      window.dataLayer = [];
      window.__fbqCalls = [];
      window.fbq = (...args) => window.__fbqCalls.push(args);
    });
    await page.route(ENDPOINT, (route) => route.fulfill({ status: 200, body: "{}" }));
    await page.goto("/");
    await page.locator(HERO_CTA).click();
    const dialog = page.getByRole("dialog");
    await dialog.locator("button[type=submit]").click();
    await expect(dialog.getByText("Informe seu nome.")).toBeVisible();
    await expect(dialog.getByText("Informe um e-mail válido.")).toBeVisible();
    await expect(dialog.getByText("Informe um telefone válido com DDD.")).toBeVisible();
    await expect(dialog).toBeVisible();
    expect(await page.evaluate(() => window.dataLayer)).toEqual([]);
    expect(await page.evaluate(() => window.__fbqCalls.filter(([command, eventName]) => command === "track" && eventName === "Lead"))).toEqual([]);
  });

  test("desabilita o botão durante o envio", async ({ page }) => {
    await page.route(ENDPOINT, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ checkout_url: "https://example.com/checkout" }) });
    });
    await page.goto("/");
    await page.locator(HERO_CTA).click();
    const form = page.locator("[data-lead-modal] form");
    await form.getByLabel("Nome").fill("Dra. Ana Exemplo");
    await form.getByLabel("E-mail").fill("ana@example.com");
    await form.getByLabel("Telefone + DDD").fill("21999999999");
    const button = form.locator("button[type=submit]");
    await button.click();
    await expect(button).toBeDisabled();
  });
});
