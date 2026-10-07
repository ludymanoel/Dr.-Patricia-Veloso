// @ts-check
const { test, expect } = require("@playwright/test");

const THANK_YOU_MESSAGE = "As informações foram encaminhadas para a equipe do evento e em breve retornaremos o contato.";

const HERO_CTA = ".hero__actions [data-lead-modal-trigger]";

test.describe("Modal de lead dos CTAs 'Garanta a sua vaga agora'", () => {
  test("CTA do hero abre o modal com nome, e-mail, telefone e botão Enviar Informações", async ({ page }) => {
    await page.goto("/");

    await page.locator(HERO_CTA).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("Complete seus dados para falar com a equipe");
    await expect(dialog.getByLabel("Nome")).toBeVisible();
    await expect(dialog.getByLabel("E-mail")).toBeVisible();
    await expect(dialog.getByLabel("Telefone")).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Enviar Informações" })).toBeVisible();
    await expect(dialog).toContainText(
      "Seus dados serão usados apenas para dar continuidade ao seu interesse no workshop e para que a equipe possa entrar em contato.",
    );

    // O foco inicial vai para o primeiro campo do formulário
    await expect(dialog.getByLabel("Nome")).toBeFocused();
  });

  test("modal mantém os textos e estilos originais dos CTAs", async ({ page }) => {
    await page.goto("/");

    const triggers = page.locator("[data-lead-modal-trigger]");
    await expect(triggers).toHaveCount(4);
    for (const trigger of await triggers.all()) {
      await expect(trigger).toHaveText("Garanta a sua vaga agora");
      await expect(trigger).toHaveAttribute("href", "#inscricao");
      await expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    }
  });

  test("validação impede envio inválido e mantém o modal aberto", async ({ page }) => {
    await page.goto("/");
    await page.locator(HERO_CTA).click();

    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Enviar Informações" }).click();

    await expect(dialog.getByText("Informe seu nome.")).toBeVisible();
    await expect(dialog.getByLabel("Nome")).toHaveAttribute("aria-invalid", "true");
    await expect(dialog.getByText("Informe um e-mail válido.")).toBeVisible();
    await expect(dialog.getByLabel("E-mail")).toHaveAttribute("aria-invalid", "true");
    await expect(dialog.getByText("Informe um telefone válido com DDD.")).toBeVisible();
    await expect(dialog.getByLabel("Telefone")).toHaveAttribute("aria-invalid", "true");
    await expect(dialog).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
  });

  test("envio válido fecha o modal e abre o popup de agradecimento sem redirecionar", async ({ page }) => {
    await page.goto("/");
    await page.locator(HERO_CTA).click();

    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Nome").fill("Dra. Ana Exemplo");
    await dialog.getByLabel("E-mail").fill("ana@example.com");
    await dialog.getByLabel("Telefone").fill("21999999999");
    await dialog.getByRole("button", { name: "Enviar Informações" }).click();

    const thankYou = page.locator("[data-thank-you-dialog]");
    await expect(thankYou).toBeVisible();
    await expect(thankYou).toContainText("Obrigado!");
    await expect(thankYou).toContainText(THANK_YOU_MESSAGE);
    await expect(page.locator("[data-lead-modal]")).toBeHidden();
    expect(page.url()).not.toMatch(/wa\.me|api\.whatsapp\.com/i);
    await expect(page.locator('a[href*="wa.me"], a[href*="api.whatsapp.com"]')).toHaveCount(0);
  });

  test("popup de agradecimento fecha com ESC e devolve o foco ao CTA de origem", async ({ page }) => {
    await page.goto("/");
    const trigger = page.locator(HERO_CTA);
    await trigger.click();

    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Nome").fill("Dra. Ana Exemplo");
    await dialog.getByLabel("E-mail").fill("ana@example.com");
    await dialog.getByLabel("Telefone").fill("21999999999");
    await dialog.getByRole("button", { name: "Enviar Informações" }).click();

    const thankYou = page.locator("[data-thank-you-dialog]");
    await expect(thankYou).toBeVisible();
    await page.keyboard.press("Escape");

    await expect(page.locator("[data-thank-you-modal]")).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("botão Fechar do popup de agradecimento encerra o fluxo", async ({ page }) => {
    await page.goto("/");
    await page.locator(HERO_CTA).click();

    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Nome").fill("Dra. Ana Exemplo");
    await dialog.getByLabel("E-mail").fill("ana@example.com");
    await dialog.getByLabel("Telefone").fill("21999999999");
    await dialog.getByRole("button", { name: "Enviar Informações" }).click();

    const thankYou = page.locator("[data-thank-you-dialog]");
    await expect(thankYou).toBeVisible();
    await thankYou.getByRole("button", { name: "Fechar", exact: true }).click();
    await expect(page.locator("[data-thank-you-modal]")).toBeHidden();
    await expect(page.locator("[data-lead-modal]")).toBeHidden();
  });

  test("ESC fecha o modal e devolve o foco ao CTA de origem", async ({ page }) => {
    await page.goto("/");
    const trigger = page.locator(HERO_CTA);
    await trigger.click();

    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");

    await expect(page.locator("[data-lead-modal]")).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("CTA do header continua funcional em viewport mobile", async ({ page }) => {
    await page.setViewportSize({ width: 412, height: 915 });
    await page.goto("/");

    const headerCta = page.locator(".header-cta");
    await expect(headerCta).toBeVisible();
    await headerCta.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel("Nome")).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Enviar Informações" })).toBeVisible();
  });
});
