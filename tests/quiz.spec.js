// @ts-check
const { test, expect } = require("@playwright/test");

const PRIMARY = "**/AKfycbxocr7uTtsN_hZ4h6WnlCO2RzyHM6DMvTayc3s1PXOxYBunNonLBuBxXkqAUZ1KjLg/exec";
const MIRROR = "**/AKfycbxo-Agl8ovuXKgdZpwnKL9af8jOBe7dcgkeeB6r1EPT2MVAuVrR4IJfPRNu1SlfafxYnw/exec";
const FALLBACK = "https://pay.kiwify.com.br/Kxl16ye";

test("exibe o link flutuante acessível do WhatsApp", async ({ page }) => {
  await page.goto("/");

  const whatsapp = page.getByRole("link", { name: "Falar com a equipe pelo WhatsApp" });
  await expect(whatsapp).toHaveAttribute("href", "https://wa.me/553884213318");
  await expect(whatsapp).toHaveAttribute("target", "_blank");
  await expect(whatsapp).toHaveAttribute("rel", "noopener noreferrer");
  await expect(whatsapp).toHaveAttribute("title", "Falar com a equipe pelo WhatsApp");
  await expect(whatsapp.locator("span")).toHaveCount(0);

  const size = await whatsapp.boundingBox();
  expect(size).not.toBeNull();
  expect(size.width).toBeGreaterThanOrEqual(44);
  expect(size.height).toBeGreaterThanOrEqual(44);
  expect(size.width).toBe(size.height);
});

test("a interface não exibe quiz nem navegação do quiz", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("#quiz")).toHaveCount(0);
  await expect(page.locator("[data-quiz-app], [data-quiz-start], [data-quiz-answer], [data-quiz-progress-bar]")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Quiz", exact: true })).toHaveCount(0);
});

test("principal com sucesso também envia cópia ao espelho e redireciona Kiwify", async ({ page }) => {
  const payloads = [];
  const checkoutUrl = "http://127.0.0.1:8123/checkout-dinamico?pref_id=lead";

  await page.addInitScript(() => {
    window.dataLayer = [];
    window.__fbqCalls = [];
    window.fbq = (...args) => window.__fbqCalls.push(args);
  });

  await page.route(PRIMARY, async (route) => {
    payloads.push(JSON.parse(route.request().postData()));
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, checkout_url: checkoutUrl }) });
  });
  await page.route(MIRROR, async (route) => {
    payloads.push(JSON.parse(route.request().postData()));
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
  });
  await page.route(FALLBACK, (route) => route.fulfill({ status: 200, contentType: "text/html", body: "kiwify" }));

  await page.goto("/");
  await page.locator(".hero__actions [data-lead-modal-trigger]").click();
  const form = page.locator("[data-lead-modal] form");
  await form.getByLabel("Nome").fill("Dra. Ana Exemplo");
  await form.getByLabel("E-mail").fill("ana@example.com");
  await form.getByLabel("Telefone + DDD").fill("21999999999");
  const submit = form.getByRole("button", { name: "Garantir minha vaga" });
  await submit.click();

  await expect(page.getByText("Inscrição confirmada! Você será redirecionado para o pagamento.")).toBeVisible();
  expect(await page.evaluate(() => window.dataLayer)).toHaveLength(1);
  expect(await page.evaluate(() => window.dataLayer[0])).toEqual({ event: "lead", lead_id: expect.any(String), mode: "payment", source: "inscricao" });
  expect(await page.evaluate(() => window.__fbqCalls.filter(([command, eventName]) => command === "track" && eventName === "Lead"))).toEqual([
    ["track", "Lead", { content_name: "Workshop Long Hair FUE", content_category: "workshop", source: "inscricao" }, { eventID: expect.any(String) }],
  ]);
  expect(await page.evaluate(() => {
    const leadCall = window.__fbqCalls.find(([command, eventName]) => command === "track" && eventName === "Lead");
    return window.dataLayer[0].lead_id === leadCall[3].eventID;
  })).toBe(true);
  expect(await page.evaluate(() => window.location.href)).not.toBe(FALLBACK);
  await expect(page).toHaveURL(FALLBACK, { timeout: 5000 });
  expect(payloads).toHaveLength(2);
  expect(payloads[0]).toEqual(payloads[1]);
  expect(payloads[0]).toMatchObject({ action: "lead", mode: "payment", name: "Dra. Ana Exemplo", email: "ana@example.com", phone: "21999999999" });
  expect(payloads[0].lead_id).toBeTruthy();
});

test("confirmação desaparece antes do redirecionamento", async ({ page }) => {
  await page.route(PRIMARY, (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) }));
  await page.route(MIRROR, (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) }));
  await page.route(FALLBACK, (route) => route.fulfill({ status: 200, contentType: "text/html", body: "kiwify" }));
  await page.goto("/");
  await page.locator(".hero__actions [data-lead-modal-trigger]").click();
  const form = page.locator("[data-lead-modal] form");
  await form.getByLabel("Nome").fill("Dra. Ana Exemplo");
  await form.getByLabel("E-mail").fill("ana@example.com");
  await form.getByLabel("Telefone + DDD").fill("21999999999");
  await form.locator("button[type=submit]").click();

  await expect(page.getByText("Inscrição confirmada! Você será redirecionado para o pagamento.")).toBeVisible();
  await expect(page.locator("[data-lead-modal]")).toBeHidden({ timeout: 4000 });
  await expect(page).toHaveURL(FALLBACK, { timeout: 5000 });
});

test("usa o espelho quando o endpoint principal falha", async ({ page }) => {
  await page.route(PRIMARY, (route) => route.fulfill({ status: 500, body: "failure" }));
  const mirrorPayload = [];
  await page.route(MIRROR, async (route) => {
    mirrorPayload.push(JSON.parse(route.request().postData()));
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
  });
  await page.route(FALLBACK, (route) => route.fulfill({ status: 200, contentType: "text/html", body: "kiwify" }));
  await page.goto("/");
  await page.locator(".hero__actions [data-lead-modal-trigger]").click();
  const form = page.locator("[data-lead-modal] form");
  await form.getByLabel("Nome").fill("Dra. Ana Exemplo");
  await form.getByLabel("E-mail").fill("ana@example.com");
  await form.getByLabel("Telefone + DDD").fill("21999999999");
  await form.locator("button[type=submit]").click();
  await expect(page).toHaveURL(FALLBACK, { timeout: 5000 });
  expect(mirrorPayload).toHaveLength(1);
});

test("resposta inválida no principal aciona o espelho", async ({ page }) => {
  await page.route(PRIMARY, (route) => route.fulfill({ status: 200, contentType: "text/html", body: "not json" }));
  await page.route(MIRROR, (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) }));
  await page.route(FALLBACK, (route) => route.fulfill({ status: 200, contentType: "text/html", body: "kiwify" }));
  await page.goto("/");
  await page.locator(".hero__actions [data-lead-modal-trigger]").click();
  const form = page.locator("[data-lead-modal] form");
  await form.getByLabel("Nome").fill("Dra. Ana Exemplo");
  await form.getByLabel("E-mail").fill("ana@example.com");
  await form.getByLabel("Telefone + DDD").fill("21999999999");
  await form.locator("button[type=submit]").click();
  await expect(page).toHaveURL(FALLBACK);
});

test("principal e espelho falham: mostra erro, mantém modal aberto e permite retry", async ({ page }) => {
  let attempts = 0;
  await page.route(PRIMARY, (route) => {
    attempts += 1;
    return route.fulfill({ status: 500, body: "failure" });
  });
  await page.route(MIRROR, (route) => route.abort("failed").catch(() => {}));
  await page.route(FALLBACK, (route) => route.fulfill({ status: 200, contentType: "text/html", body: "fallback" }));
  await page.goto("/");
  await page.locator(".hero__actions [data-lead-modal-trigger]").click();
  const form = page.locator("[data-lead-modal] form");
  await form.getByLabel("Nome").fill("Dra. Ana Exemplo");
  await form.getByLabel("E-mail").fill("ana@example.com");
  await form.getByLabel("Telefone + DDD").fill("21999999999");
  const submit = form.locator("button[type=submit]");
  await submit.click();
  await expect(form.locator("[data-lead-status]")).toHaveText("Não foi possível enviar seus dados. Tente novamente.");
  await expect(page.locator("[data-lead-modal]")).toBeVisible();
  await expect(submit).toBeEnabled();
  expect(page.url()).not.toBe(FALLBACK);

  await page.unroute(PRIMARY);
  await page.route(PRIMARY, (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) }));
  await page.unroute(MIRROR);
  await page.route(MIRROR, (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) }));
  await submit.click();
  await expect(form.locator("[data-lead-status]")).toHaveText("Inscrição confirmada! Você será redirecionado para o pagamento.");
  expect(attempts).toBe(1);
  expect(page.url()).not.toBe(FALLBACK);
});

test("espelho lento não bloqueia a abertura do checkout principal", async ({ page }) => {
  const checkoutUrl = "http://127.0.0.1:8123/checkout-rapido";
  let mirrorFinished = false;
  await page.route(PRIMARY, (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, checkout_url: checkoutUrl }) }));
  await page.route(MIRROR, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    mirrorFinished = true;
    await route.fulfill({ status: 500, body: "slow failure" });
  });
  await page.route(FALLBACK, (route) => route.fulfill({ status: 200, contentType: "text/html", body: "kiwify" }));
  await page.goto("/");
  await page.locator(".hero__actions [data-lead-modal-trigger]").click();
  const form = page.locator("[data-lead-modal] form");
  await form.getByLabel("Nome").fill("Dra. Ana Exemplo");
  await form.getByLabel("E-mail").fill("ana@example.com");
  await form.getByLabel("Telefone + DDD").fill("21999999999");
  await form.locator("button[type=submit]").click();

  await expect(page).toHaveURL(FALLBACK, { timeout: 5000 });
  expect(mirrorFinished).toBe(false);
  await expect.poll(() => mirrorFinished).toBe(true);
});
