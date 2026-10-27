// @ts-check
const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const ENDPOINT = "**/macros/s/**/exec";
const CHECKOUT = "https://pay.kiwify.com.br/Kxl16ye";
const CTA_LABEL = "Garanta a sua vaga agora";

async function fillLeadForm(dialog) {
  await dialog.getByLabel("Nome").fill("Dra. Ana Exemplo");
  await dialog.getByLabel("E-mail").fill("ana@example.com");
  await dialog.getByLabel("Telefone + DDD").fill("21999999999");
}

test("landing standalone abre diretamente e carrega seus estilos, script e imagens locais", async ({ page }) => {
  const response = await page.goto("/workshop-long-hair-fue.html");
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle("Workshop Long Hair FUE | Dra. Patricia Veloso");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("transplante capilar com fios longos");
  await expect(page.locator("#quiz")).toHaveCount(0);
  await expect(page.locator("[data-lead-modal]")).toHaveCount(1);
  await expect(page.locator(".eyebrow")).toHaveCount(0);

  for (const assetPath of [
    "/workshop-long-hair-fue-assets/styles.css",
    "/workshop-long-hair-fue-assets/script.js",
    "/workshop-long-hair-fue-assets/img/logo.png",
    "/workshop-long-hair-fue-assets/img/hero.jpg",
    "/workshop-long-hair-fue-assets/img/teacher.jpg",
    "/workshop-long-hair-fue-assets/img/mega-session.jpg",
    "/workshop-long-hair-fue-assets/img/incluso.png",
  ]) {
    const asset = await page.request.get(assetPath);
    expect(asset.ok(), `${assetPath} should be served`).toBeTruthy();
    expect((await asset.body()).byteLength).toBeGreaterThan(0);
  }
  await expect(page.locator("link[rel=stylesheet]")).toHaveAttribute("href", "/workshop-long-hair-fue-assets/styles.css");
  await expect(page.locator('script[src="/workshop-long-hair-fue-assets/script.js"]')).toHaveAttribute("src", "/workshop-long-hair-fue-assets/script.js");
});

test("landing Hands-on tem rota Vercel, datas confirmadas e CTA WhatsApp", async ({ page }) => {
  const response = await page.goto("/hands-on-long-hair-fue.html");
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle("Hands-on Long Hair FUE | Dra. Patricia Veloso");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Hands-on");
  await expect(page.locator("main")).toContainText("14 e 15 de novembro de 2026");
  await expect(page.locator("main")).toContainText("Prática supervisionada");
  await expect(page.locator("main")).toContainText("em pacientes reais");
  await expect(page.locator('a[href*="wa.me/5538984213318"]')).toHaveCount(2);
  await expect(page.locator("main")).toContainText("Exclusivo para médicos");
  const config = JSON.parse(fs.readFileSync(path.join(root, "vercel.json"), "utf8"));
  expect(config.rewrites).toContainEqual({ source: "/hands-on-long-hair-fue", destination: "/hands-on-long-hair-fue.html" });
  expect(config.rewrites).toContainEqual({ source: "/hands-on-long-hair-fue/", destination: "/hands-on-long-hair-fue.html" });
});

test("landing apresenta cinco dobras verificadas, CTA e sem VSL, urgência ou promessas indevidas", async ({ page }) => {
  await page.goto("/workshop-long-hair-fue.html");
  const folds = page.locator("main > section[data-fold]");
  await expect(folds).toHaveCount(5);
  const foldNames = await folds.evaluateAll((sections) => sections.map((section) => section.dataset.fold));
  expect(foldNames).toEqual(["promise", "learning", "proof", "venue", "offer"]);
  await expect(folds.nth(0).locator("#top")).toHaveCount(1);
  await expect(folds.nth(1).locator("#in-person-title, #tecnica, #programa, #publico")).toHaveCount(4);
  await expect(folds.nth(1)).toContainText("Não haverá prática em paciente");
  await expect(folds.nth(1)).toContainText("conteúdo técnico");
  await expect(folds.nth(2).locator("#antes-depois, #docente, #density, #mega-sessao, #registros")).toHaveCount(5);
  await expect(folds.nth(2).locator("#docente")).toContainText("CRM-MG 50766");
  await expect(folds.nth(2)).toContainText("RIGHT DENSITY");
  await expect(folds.nth(3).locator("#local-evento")).toHaveCount(1);
  await expect(folds.nth(3).locator("[data-lead-modal-trigger], [data-lead-form], #faq")).toHaveCount(0);
  await expect(folds.nth(3)).toContainText("13 de novembro de 2026");
  await expect(folds.nth(3)).toContainText("Das 08h às 18h");
  await expect(folds.nth(3)).toContainText("Exclusivo para médicos");
  await expect(folds.nth(4).locator("#inscricao, #faq, .final")).toHaveCount(3);
  await expect(page.locator("#top h1")).toContainText("fios longos");
  await expect(page.locator("#programa")).toContainText("Fundamentos e indicação");
  await expect(page.locator("#antes-depois")).toContainText("casos");
  await expect(page.locator("#local-evento")).toContainText("Centro de Convenções Vogue Square");
  await expect(page.locator("#inscricao [data-lead-modal-trigger]")).toContainText("Garanta a sua vaga agora");
  await expect(page.locator("[data-lead-modal-trigger]").filter({ hasText: /1º lote/i })).toHaveCount(0);
  await expect(page.locator(".hero__batch, [data-vsl], .vsl-play")).toHaveCount(0);
  await expect(page.locator("main")).not.toContainText(/garantia comercial|últimas vagas|lote disponível|lotam agenda/i);
  await expect(page.locator("main")).toContainText("não haverá prática em paciente");
  await expect(page.locator("main")).not.toContainText(/pacientes? (?:saem|deixam) com fios longos/i);
  await expect(page.locator("#top img")).toHaveAttribute("src", "/workshop-long-hair-fue-assets/img/procedure.png");
  await expect(page.locator("#antes-depois img").first()).toBeVisible();
});

test("standalone replica Meta Pixel e Microsoft Clarity com os IDs da LP raiz", async ({ page }) => {
  await page.route(/connect\.facebook\.net|www\.facebook\.com|clarity\.ms/, (route) => route.abort());
  await page.goto("/workshop-long-hair-fue.html");

  const inlineScripts = (await page.locator("head script").allTextContents()).join("\n");
  expect(inlineScripts).toContain("24447108471625524");
  expect(inlineScripts).toContain("yu8t6feluv");
  expect(inlineScripts).toContain("fbq('track', 'PageView')");
  expect(await page.evaluate(() => typeof window.fbq)).toBe("function");
  expect(await page.evaluate(() => typeof window.clarity)).toBe("function");
  expect(await page.evaluate(() => window.fbq.queue.some((args) => args[0] === "track" && args[1] === "PageView"))).toBeTruthy();
});

test("hero desktop mantém título amplo e CTA próxima da dobra em 1440px", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/workshop-long-hair-fue.html");
  const h1Box = await page.locator(".hero h1").boundingBox();
  const ctaBox = await page.locator(".hero__actions .button").first().boundingBox();
  expect(h1Box?.width).toBeGreaterThan(700);
  expect(ctaBox?.y).toBeLessThan(950);
});

test("carrosséis isolados autoadvancem sem controles, mantêm imagens e removem legendas do antes/depois", async ({ page }) => {
  await page.goto("/workshop-long-hair-fue.html");
  const carousels = page.locator("[data-carousel]");
  await expect(carousels).toHaveCount(2);
  await expect(carousels.nth(0)).toHaveAccessibleName("Casos antes e depois de Long Hair FUE");
  await expect(carousels.nth(1)).toHaveAccessibleName("Registros profissionais e ensino médico");
  await expect(carousels.nth(0).locator("[data-carousel-viewport]")).toHaveAccessibleName("Rolagem horizontal dos casos antes e depois");
  await expect(carousels.nth(1).locator("[data-carousel-viewport]")).toHaveAccessibleName("Rolagem horizontal dos registros profissionais e ensino médico");
  await expect(page.locator(".carousel__controls, [data-prev], [data-next], [data-slide-status]")).toHaveCount(0);
  await expect(page.locator("#antes-depois .carousel figcaption")).toHaveCount(0);

  const imageSources = await page.locator("img").evaluateAll((images) => images.map((image) => image.getAttribute("src")).filter(Boolean));
  expect(imageSources.filter((src) => src.includes("/workshop-long-hair-fue-assets/")).length).toBeGreaterThanOrEqual(14);
  expect(imageSources.some((src) => src === "/workshop-long-hair-fue-assets/img/procedure.png")).toBeTruthy();
  expect(imageSources.every((src) => !src.startsWith("img/"))).toBeTruthy();
  const carouselAlts = await page.locator(".carousel img").evaluateAll((images) => images.map((image) => image.getAttribute("alt")));
  expect(carouselAlts).toEqual([
    "Antes e depois de procedimento Long Hair FUE conduzido pela Dra. Patricia Veloso",
    "Comparativo antes e depois de transplante capilar Long Hair FUE",
    "Evidência visual de caso Long Hair FUE em paciente tratado pela Dra. Patricia Veloso",
    "Imagem pré-operatória para documentação educacional de Long Hair FUE",
    "Registro intraoperatório de procedimento Long Hair FUE",
    "Dra. Patricia Veloso ensinando em workshop médico",
    "Workshop médico com Dra. Patricia Veloso",
    "Dra. Patricia Veloso em congresso internacional",
    "Campo cirúrgico em procedimento de transplante capilar",
  ]);
  for (const image of await page.locator("img").all()) {
    await image.scrollIntoViewIfNeeded();
    await expect(image).toHaveJSProperty("complete", true);
    await expect.poll(() => image.evaluate((element) => element.naturalWidth)).toBeGreaterThan(0);
  }
  const dimensionMismatches = await page.locator("img").evaluateAll((images) => images
    .filter((image) => image.src.includes("/workshop-long-hair-fue-assets/img/"))
    .filter((image) => Number(image.getAttribute("width")) !== image.naturalWidth || Number(image.getAttribute("height")) !== image.naturalHeight)
    .map((image) => ({
      src: image.getAttribute("src"),
      attributes: [image.getAttribute("width"), image.getAttribute("height")],
      intrinsic: [image.naturalWidth, image.naturalHeight],
    })));
  expect(dimensionMismatches).toEqual([]);

  const viewport = carousels.nth(0).locator("[data-carousel-viewport]");
  await viewport.evaluate((element) => { element.scrollLeft = 0; });
  await expect.poll(() => viewport.evaluate((element) => element.scrollLeft), { timeout: 9000 }).toBeGreaterThan(0);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(carousels.nth(0).locator("img")).toHaveCount(5);
  await expect(carousels.nth(1).locator("img")).toHaveCount(4);
  expect(await viewport.evaluate((element) => element.scrollWidth > element.clientWidth)).toBeTruthy();
  await expect(page.locator(".carousel__controls, [data-prev], [data-next], [data-slide-status]")).toHaveCount(0);
});

test("autoplay é desativado quando o usuário prefere movimento reduzido", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/workshop-long-hair-fue.html");
  const viewport = page.locator("[data-carousel-viewport]").first();
  await viewport.evaluate((element) => { element.scrollLeft = 0; });
  await page.waitForTimeout(5000);
  expect(await viewport.evaluate((element) => element.scrollLeft)).toBe(0);
});

test("não há CTA de WhatsApp e todos os CTAs abrem o formulário de inscrição por teclado", async ({ page }) => {
  await page.goto("/workshop-long-hair-fue.html");
  await expect(page.locator('a[href*="wa.me"], a[href*="whatsapp"]')).toHaveCount(0);

  const triggers = page.locator("[data-lead-modal-trigger]");
  await expect(triggers).toHaveCount(4);
  for (const trigger of await triggers.all()) {
    await expect(trigger).toHaveText(CTA_LABEL);
  }

  const headerCta = triggers.first();
  await headerCta.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel("Nome")).toBeVisible();
  await expect(dialog.getByLabel("Nome")).toBeFocused();
  await expect(dialog.getByLabel("E-mail")).toBeVisible();
  await expect(dialog.getByLabel("Telefone + DDD")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(headerCta).toBeFocused();
});

test("falha na captação mantém o formulário aberto, não redireciona e permite nova tentativa", async ({ page }) => {
  let attempts = 0;
  await page.route(ENDPOINT, async (route) => {
    attempts += 1;
    if (attempts <= 2) {
      await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ ok: false }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
  });
  await page.route(CHECKOUT, (route) => route.fulfill({ status: 200, contentType: "text/html", body: "checkout" }));

  await page.goto("/workshop-long-hair-fue.html");
  await page.locator(".hero__actions [data-lead-modal-trigger]").click();
  const dialog = page.getByRole("dialog");
  await fillLeadForm(dialog);
  const submit = dialog.locator("button[type=submit]");
  await submit.click();

  await expect(dialog).toBeVisible();
  await expect(dialog.locator("[data-lead-status]")).toHaveText("Não foi possível enviar seus dados. Tente novamente.");
  await expect(page).toHaveURL(/workshop-long-hair-fue\.html$/);
  await expect(submit).toBeEnabled();
  await expect(submit).toHaveText("Garantir minha vaga");

  await submit.click();
  await expect(dialog.locator("[data-lead-status]")).toHaveText("Inscrição confirmada! Você será redirecionado para o pagamento.");
});

test("envio bem-sucedido confirma a inscrição, dispara Lead e redireciona para o checkout", async ({ page }) => {
  await page.route(ENDPOINT, (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) }));
  await page.route(CHECKOUT, (route) => route.fulfill({ status: 200, contentType: "text/html", body: "checkout" }));
  await page.addInitScript(() => {
    window.dataLayer = [];
    window.__fbqCalls = [];
    window.fbq = (...args) => window.__fbqCalls.push(args);
  });

  await page.goto("/workshop-long-hair-fue.html");
  await page.locator(".hero__actions [data-lead-modal-trigger]").click();
  const dialog = page.getByRole("dialog");
  await fillLeadForm(dialog);
  await dialog.locator("button[type=submit]").click();

  await expect(dialog.locator("[data-lead-status]")).toHaveText("Inscrição confirmada! Você será redirecionado para o pagamento.");
  expect(await page.evaluate(() => window.__fbqCalls.some(([command, eventName]) => command === "track" && eventName === "Lead"))).toBeTruthy();
  expect(await page.evaluate(() => window.dataLayer.some((entry) => entry.event === "lead"))).toBeTruthy();
  await page.waitForURL(CHECKOUT, { timeout: 6000 });
});

test("Vercel declara ambos rewrites para a landing standalone", () => {
  const config = JSON.parse(fs.readFileSync(path.join(root, "vercel.json"), "utf8"));
  expect(config.rewrites).toEqual([
    { source: "/workshop-long-hair-fue", destination: "/workshop-long-hair-fue.html" },
    { source: "/workshop-long-hair-fue/", destination: "/workshop-long-hair-fue.html" },
  ]);
  expect(fs.existsSync(path.join(root, "workshop-long-hair-fue.html"))).toBe(true);
});

test("homepage continua sendo a rota raiz, independente da landing standalone", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
  await expect(page.locator("[data-lead-modal-trigger]").first()).toBeVisible();
  await expect(page.locator("link[rel=stylesheet]").first()).toHaveAttribute("href", "styles.css");
  await expect(page.locator("link[rel=stylesheet][href*='workshop-long-hair-fue-assets']")).toHaveCount(0);
  await expect(page.locator("main h1").first()).not.toContainText("o raciocínio técnico por trás dos fios longos");
});
