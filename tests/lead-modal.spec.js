// @ts-check
const { test, expect } = require("@playwright/test");

const THANK_YOU_MESSAGE =
  "As informações foram registradas e o seu desconto já está disponível. A seguir, abriremos um quiz para que conheça melhor o Workshop.";
const MODAL_LEAD_TITLE = "Complete os seus dados para garantir o valor do 1º lote";
const LEAD_ENDPOINT_PATTERN = "**/macros/s/**/exec";
const LEAD_CAPTURED_SESSION_KEY = "longHairFueLeadCaptured";

const HERO_CTA = ".hero__actions [data-lead-modal-trigger]";

test.describe("Modal de lead dos CTAs 'Garanta a sua vaga agora'", () => {
  test.beforeEach(async ({ page }) => {
    await page.route(LEAD_ENDPOINT_PATTERN, async (route) => {
      await route.fulfill({ status: 200, contentType: "text/html", body: "ok" });
    });
  });

  test("CTA do hero sem sessão abre o modal com nome, e-mail, Telefone + DDD e botão Enviar Informações", async ({ page }) => {
    await page.goto("/");

    await page.locator(HERO_CTA).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(MODAL_LEAD_TITLE);
    await expect(dialog.getByLabel("Nome")).toBeVisible();
    await expect(dialog.getByLabel("E-mail")).toBeVisible();
    await expect(dialog.getByLabel("Telefone + DDD")).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Enviar Informações" })).toBeVisible();
    await expect(dialog).toContainText("Seus dados serão usados apenas para dar continuidade ao seu interesse no workshop");

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
    await expect(dialog.getByLabel("Telefone + DDD")).toHaveAttribute("aria-invalid", "true");
    await expect(dialog).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
  });

  test("envio válido fecha o modal e abre o popup de agradecimento sem redirecionar", async ({ page }) => {
    await page.goto("/");
    await page.locator(HERO_CTA).click();

    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Nome").fill("Dra. Ana Exemplo");
    await dialog.getByLabel("E-mail").fill("ana@example.com");
    await dialog.getByLabel("Telefone + DDD").fill("21999999999");
    await dialog.getByRole("button", { name: "Enviar Informações" }).click();

    const thankYou = page.locator("[data-thank-you-dialog]");
    await expect(thankYou).toBeVisible();
    await expect(thankYou).toContainText("Obrigado!");
    await expect(thankYou).toContainText(THANK_YOU_MESSAGE);
    await expect(page.locator("[data-lead-modal]")).toBeHidden();
    expect(page.url()).not.toMatch(/wa\.me|api\.whatsapp\.com/i);
    await expect(page.locator('a[href*="wa.me"], a[href*="api.whatsapp.com"]')).toHaveCount(0);
  });

  test("ao fechar popup vindo de CTA, carrega o quiz e foca Responder o quiz", async ({ page }) => {
    await page.goto("/");
    const trigger = page.locator(HERO_CTA);
    await trigger.click();

    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Nome").fill("Dra. Ana Exemplo");
    await dialog.getByLabel("E-mail").fill("ana@example.com");
    await dialog.getByLabel("Telefone + DDD").fill("21999999999");
    await dialog.getByRole("button", { name: "Enviar Informações" }).click();

    const thankYou = page.locator("[data-thank-you-dialog]");
    await expect(thankYou).toBeVisible();
    await page.keyboard.press("Escape");

    await expect(page.locator("[data-thank-you-modal]")).toBeHidden();
    await expect(page.locator("[data-quiz-progress-label]")).toHaveCount(0);
    await expect(page.locator("[data-quiz-start]")).toBeVisible();
    await expect(page.locator("[data-quiz-start]")).toBeFocused();
  });

  test("botão Fechar do popup de agradecimento encerra o fluxo", async ({ page }) => {
    await page.goto("/");
    await page.locator(HERO_CTA).click();

    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Nome").fill("Dra. Ana Exemplo");
    await dialog.getByLabel("E-mail").fill("ana@example.com");
    await dialog.getByLabel("Telefone + DDD").fill("21999999999");
    await dialog.getByRole("button", { name: "Enviar Informações" }).click();

    const thankYou = page.locator("[data-thank-you-dialog]");
    await expect(thankYou).toBeVisible();
    await thankYou.getByRole("button", { name: "Fechar", exact: true }).click();
    await expect(page.locator("[data-thank-you-modal]")).toBeHidden();
    await expect(page.locator("[data-lead-modal]")).toBeHidden();
    await expect(page.locator("[data-quiz-start]")).toBeFocused();
  });

  test("após lead capturado na sessão, CTA Garanta redireciona direto para checkout sem modal", async ({ page }) => {
    await page.addInitScript(([key]) => window.sessionStorage.setItem(key, "true"), [LEAD_CAPTURED_SESSION_KEY]);
    await page.goto("/");

    await page.locator(HERO_CTA).click();

    await expect(page.locator("[data-lead-modal]")).toBeHidden();
    await expect(page).toHaveURL(/(mpago\.la\/244hsWi|mercadopago\.com\.br)/);
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
    await expect(dialog.getByLabel("Telefone + DDD")).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Enviar Informações" })).toBeVisible();
  });
});
