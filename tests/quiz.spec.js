// @ts-check
const { test, expect } = require("@playwright/test");

const PAYMENT_URL = "https://mpago.la/244hsWi";
const LEAD_ENDPOINT_PATTERN = "**/macros/s/**/exec";
const LEAD_CAPTURED_SESSION_KEY = "longHairFueLeadCaptured";
const NOT_DOCTOR_SESSION_KEY = "longHairFueNotDoctor";
const THANK_YOU_MESSAGE =
  "As informações foram registradas e o seu desconto já está disponível. A seguir, abriremos um quiz para que conheça melhor o Workshop.";
const INFO_REGISTERED_MESSAGE = "Suas informações já foram registradas. A equipe do evento entrará em contato em breve.";
const FORBIDDEN_COPY = new RegExp(["Solicitar informa" + "ções", "1" + "00", "capaci" + "dade"].join("|"), "i");

// A página não deve abrir o WhatsApp em nenhum CTA ou fluxo.
async function expectNoWhatsAppLinks(page) {
  await expect(page.locator('a[href*="wa.me"], a[href*="api.whatsapp.com"]')).toHaveCount(0);
  expect(page.url()).not.toMatch(/wa\.me|api\.whatsapp\.com/i);
}

async function startQuiz(page) {
  await page.goto("/");
  await expect(page.locator("#quiz")).toBeVisible();
  await page.locator("[data-quiz-start]").click();
  await expect(page.locator("[data-quiz-card] h3")).toHaveText("Você é médico(a)?");
}

// A resposta leva ao próximo card; a barra de progresso (sem rótulo) apenas
// acompanha. Esperamos pelo conteúdo do card para manter o teste determinístico.
async function answer(page, optionIndex, expectedHeading) {
  await page.locator(`[data-quiz-answer="${optionIndex}"]`).click();
  await expect(page.locator("[data-quiz-card] h3")).toContainText(expectedHeading);
}

async function completePositiveQuiz(page) {
  await startQuiz(page);
  await answer(page, 0, "Qual é sua relação atual com transplante capilar?");
  await answer(page, 0, "O que mais desperta seu interesse no Long Hair FUE?");
  await answer(page, 0, "Você pretende participar de um workshop presencial");
  await answer(page, 0, "Seu foco em indicação");
}

async function fillLeadForm(page) {
  await page.getByLabel("Nome").fill("Dra. Ana Exemplo");
  await page.getByLabel("E-mail").fill("ana@example.com");
  await page.getByLabel("Telefone + DDD").fill("21999999999");
}

async function captureLeadSession(page) {
  await page.addInitScript(([key]) => window.sessionStorage.setItem(key, "true"), [LEAD_CAPTURED_SESSION_KEY]);
}

async function captureLeadAndNotDoctorSession(page) {
  await page.addInitScript(
    ([leadKey, notDoctorKey]) => {
      window.sessionStorage.setItem(leadKey, "true");
      window.sessionStorage.setItem(notDoctorKey, "true");
    },
    [LEAD_CAPTURED_SESSION_KEY, NOT_DOCTOR_SESSION_KEY],
  );
}

test.describe("Quiz interativo", () => {
  test.beforeEach(async ({ page }) => {
    await page.route(LEAD_ENDPOINT_PATTERN, async (route) => {
      await route.fulfill({ status: 200, contentType: "text/html", body: "ok" });
    });
  });

  test("a página carrega e a seção #quiz existe", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("#quiz")).toBeVisible();
    await expect(page.locator("[data-quiz-app]")).toBeVisible();
    await expect(page.locator(".brand__logo")).toHaveAttribute("src", "img/Logo Dra. Patrícia (Horizontal).png");
    await expect(page.locator(".brand__logo")).toHaveAttribute("alt", "Dra. Patricia Veloso");

    const start = page.locator("[data-quiz-start]");
    await expect(start).toBeVisible();
    await expect(start).toHaveText("Responder o quiz");
    // O rótulo de progresso foi removido; resta apenas a trilha/barra visual.
    await expect(page.locator("[data-quiz-progress-label]")).toHaveCount(0);
    await expect(page.locator(".quiz-progress__track")).toBeVisible();
    await expect(page.locator("[data-quiz-progress-bar]")).toHaveCount(1);
    await expect(page.locator("[data-quiz-card]")).toContainText("Em menos de 1 minuto");
  });

  test("clicar em Começar mostra a primeira pergunta e atualiza o progresso", async ({ page }) => {
    await startQuiz(page);

    await expect(page.locator("[data-quiz-card] h3")).toHaveText("Você é médico(a)?");
    await expect(page.locator("[data-quiz-progress-label]")).toHaveCount(0);
    await expect(page.locator("[data-quiz-answer]")).toHaveCount(3);

    const width = await page.locator("[data-quiz-progress-bar]").evaluate((el) => el.style.width);
    expect(width).toBe("25%");
  });

  test("fluxo positivo envia payload JSON ao Apps Script e usa checkout dinâmico", async ({ page }) => {
    let checkoutUrl = "";
    /** @type {null | Record<string, any>} */
    let capturedPayload = null;

    await page.route(LEAD_ENDPOINT_PATTERN, async (route) => {
      const request = route.request();
      expect(request.method()).toBe("POST");
      expect(request.headers()["content-type"]).toContain("text/plain;charset=utf-8");
      capturedPayload = JSON.parse(request.postData() || "{}");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, lead_id: capturedPayload.lead_id, checkout_url: checkoutUrl }),
      });
    });

    await page.goto("/?utm_source=google&utm_medium=cpc&utm_campaign=workshop&utm_content=hero&utm_term=long%20hair");
    checkoutUrl = new URL("/checkout-dinamico?pref_id=lead-dinamico", page.url()).href;
    await expect(page.locator("#quiz")).toBeVisible();
    await page.locator("[data-quiz-start]").click();
    await expect(page.locator("[data-quiz-card] h3")).toHaveText("Você é médico(a)?");
    await answer(page, 0, "Qual é sua relação atual com transplante capilar?");
    await answer(page, 0, "O que mais desperta seu interesse no Long Hair FUE?");
    await answer(page, 0, "Você pretende participar de um workshop presencial");
    await answer(page, 0, "Seu foco em indicação");

    // Copy personalizada coerente com as respostas escolhidas
    await expect(page.locator("[data-quiz-card] h3")).toContainText("Seu foco em indicação");
    const result = page.locator(".quiz-result");
    await expect(result).toBeVisible();
    await expect(result).toHaveAttribute("aria-label", /Orientação personalizada/);
    await expect(result.locator("p")).toHaveCount(3);
    for (const paragraph of await result.locator("p").allTextContents()) {
      expect(paragraph.trim().length).toBeGreaterThan(0);
    }

    const cta = page.locator(".quiz-cta");
    await expect(cta).toBeVisible();
    await expect(cta).toHaveText("Garantir minha vaga agora");
    await cta.click();

    await expect(page.locator("[data-lead-form]")).toBeVisible();
    await expect(page.locator("[data-quiz-card] h3")).toHaveText("Complete seus dados para garantir sua vaga");
    await expect(page.locator("[data-lead-form]")).toContainText("Após o envio, você será direcionado para a página segura de pagamento.");
    await expect(page.locator("[data-lead-form]")).toContainText("Seus dados serão usados apenas para dar continuidade ao seu interesse no workshop");
    await expect(page.getByLabel("Nome")).toBeVisible();
    await expect(page.getByLabel("E-mail")).toBeVisible();
    await expect(page.getByLabel("Telefone + DDD")).toBeVisible();

    await fillLeadForm(page);
    await page.getByRole("button", { name: "Ir para pagamento" }).click();
    await expect(page).toHaveURL(checkoutUrl);
    expect(capturedPayload).toMatchObject({
      action: "lead",
      source: "quiz",
      mode: "payment",
      name: "Dra. Ana Exemplo",
      email: "ana@example.com",
      phone: "21999999999",
      utm: {
        utm_source: "google",
        utm_medium: "cpc",
        utm_campaign: "workshop",
        utm_content: "hero",
        utm_term: "long hair",
      },
      quiz: {
        Perfil: "Médico(a)",
        "Relação com transplante capilar": "Já realiza transplante capilar",
        "Interesse principal": "Indicação e seleção",
        "Intenção de participação": "Quer avançar",
      },
    });
    expect(capturedPayload?.lead_id).toEqual(expect.any(String));
    expect(capturedPayload?.page).toContain("utm_source=google");
    expect(capturedPayload?.user_agent).toEqual(expect.any(String));
    // Data/hora sempre no fuso de Brasília, independente do fuso do visitante.
    expect(capturedPayload?.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}-03:00$/);
    expect(capturedPayload?.created_at).toMatch(/-03:00$/);
    expect(capturedPayload?.created_at_local).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
    expect(capturedPayload?.timezone).toBe("America/Sao_Paulo");
    // Carimbo de quando o UTM foi capturado na sessão.
    expect(capturedPayload?.utm?.utm_captured_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}-03:00$/);
    expect(capturedPayload?.utm?.utm_captured_at_local).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
  });

  test("refazer quiz volta para a tela inicial", async ({ page }) => {
    await completePositiveQuiz(page);
    await page.locator(".quiz-cta").click();
    await expect(page.locator("[data-lead-form]")).toBeVisible();

    await page.locator("[data-quiz-restart]").click();

    await expect(page.locator("[data-quiz-progress-label]")).toHaveCount(0);
    await expect(page.locator("[data-quiz-start]")).toBeVisible();
    await expect(page.locator("[data-quiz-start]")).toHaveText("Responder o quiz");
    await expect(page.locator("[data-quiz-restart]")).toHaveCount(0);
    await expect(page.locator("[data-lead-form]")).toHaveCount(0);
  });

  test("fluxo incerto exibe captação de lead, confirma o envio e não redireciona para WhatsApp", async ({ page }) => {
    await startQuiz(page);
    await answer(page, 0, "Qual é sua relação atual com transplante capilar?");
    await answer(page, 0, "O que mais desperta seu interesse no Long Hair FUE?");
    await answer(page, 0, "Você pretende participar de um workshop presencial");
    await answer(page, 1, "Seu foco em indicação");

    await page.locator(".quiz-cta").click();

    await expect(page.locator("[data-lead-form]")).toBeVisible();
    await expect(page.locator("[data-lead-form]")).toHaveAttribute("data-lead-mode", "lead");
    await expect(page.locator("[data-quiz-card] h3")).toHaveText("Complete seus dados para falar com a equipe");
    await expect(page.locator("[data-lead-form]")).toContainText("Após o envio, sua inscrição garantirá o valor promocional do primeiro lote aberto");

    await fillLeadForm(page);
    await page.getByRole("button", { name: "Enviar Informações" }).click();

    // O envio bem-sucedido abre o popup de agradecimento em vez do status inline.
    const thankYou = page.locator("[data-thank-you-dialog]");
    await expect(thankYou).toBeVisible();
    await expect(page.locator("#thank-you-title")).toHaveText("Obrigado!");
    await expect(thankYou).toContainText(THANK_YOU_MESSAGE);
    await expect(page.locator("[data-lead-status]")).toHaveText("");
    await expectNoWhatsAppLinks(page);
  });

  test("validação acessível impede envio inválido", async ({ page }) => {
    await completePositiveQuiz(page);
    await page.locator(".quiz-cta").click();

    await page.getByRole("button", { name: "Ir para pagamento" }).click();

    await expect(page.getByText("Informe seu nome.")).toBeVisible();
    await expect(page.getByLabel("Nome")).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByText("Informe um e-mail válido.")).toBeVisible();
    await expect(page.getByLabel("E-mail")).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByText("Informe um telefone válido com DDD.")).toBeVisible();
    await expect(page.getByLabel("Telefone + DDD")).toHaveAttribute("aria-invalid", "true");
    await expect(page).toHaveURL(/\/$/);
  });

  test("ramificação Não sou médico(a) exibe orientação sem CTA de lead", async ({ page }) => {
    await startQuiz(page);

    await answer(page, 2, "Obrigado pelo interesse no Workshop Long Hair FUE.");

    await expect(page.locator("[data-quiz-card] .quiz-card__kicker")).toHaveText("Orientação institucional");
    await expect(page.locator("[data-quiz-card] h3")).toContainText("Obrigado pelo interesse no Workshop Long Hair FUE");
    await expect(page.locator("[data-quiz-card]")).toContainText("exclusivo para médicos");

    // Não deve exibir o resultado personalizado nesse ramo
    await expect(page.locator(".quiz-result")).toHaveCount(0);

    await expect(page.locator(".quiz-cta")).toHaveCount(0);
    await expect(page.locator("[data-quiz-open-form]")).toHaveCount(0);
    await expect(page.locator("[data-quiz-checkout]")).toHaveCount(0);
    await expect(page.locator("[data-lead-form]")).toHaveCount(0);

    const restart = page.locator("[data-quiz-restart]");
    await expect(restart).toBeVisible();
    await expect(restart).toHaveText("Refazer quiz");
    await expect(page.locator("[data-quiz-card] button")).toHaveCount(1);
    await expect(page.locator("[data-quiz-card]")).toContainText("Não há diagnóstico ou promessa médica neste fluxo.");
  });

  test("com lead capturado, fluxo incerto/valores direciona para checkout sem formulário lead", async ({ page }) => {
    await captureLeadSession(page);
    await startQuiz(page);
    await answer(page, 0, "Qual é sua relação atual com transplante capilar?");
    await answer(page, 0, "O que mais desperta seu interesse no Long Hair FUE?");
    await answer(page, 0, "Você pretende participar de um workshop presencial");
    await answer(page, 1, "Seu foco em indicação");

    const cta = page.locator(".quiz-cta");
    await expect(cta).toBeVisible();
    await expect(cta).toHaveText(/pagamento|vaga/i);
    await cta.click();

    await expect(page.locator("[data-lead-form]")).toHaveCount(0);
    await expect(page).toHaveURL(/(mpago\.la\/244hsWi|mercadopago\.com\.br)/);
  });

  test("com lead capturado, primeira pergunta Não sou médico(a) não exibe CTA no quiz e CTA externo abre informações registradas", async ({ page }) => {
    await captureLeadSession(page);
    await startQuiz(page);

    await answer(page, 2, "Obrigado pelo interesse no Workshop Long Hair FUE.");

    await expect
      .poll(() => page.evaluate(([key]) => window.sessionStorage.getItem(key), [NOT_DOCTOR_SESSION_KEY]))
      .toBeTruthy();

    await expect(page.locator(".quiz-cta")).toHaveCount(0);
    await expect(page.locator("[data-quiz-open-form]")).toHaveCount(0);
    await expect(page.locator("[data-quiz-checkout]")).toHaveCount(0);
    await expect(page.locator("[data-lead-form]")).toHaveCount(0);
    await expect(page).toHaveURL(/\/$/);
    const infoDialog = page.locator("[data-thank-you-dialog]");
    await expect(page.locator("[data-thank-you-modal]")).toBeHidden();

    await page.locator(".hero__actions [data-lead-modal-trigger]").click();
    await expect(page.locator("[data-lead-modal]")).toBeHidden();
    await expect(page).toHaveURL(/\/$/);
    await expect(infoDialog).toBeVisible();
    await expect(page.locator("#thank-you-title")).toHaveText("Informações registradas");
    await expect(infoDialog).toContainText(INFO_REGISTERED_MESSAGE);
  });

  test("ao refazer quiz e escolher Médico(a), limpa flag Não médico(a) e permite checkout", async ({ page }) => {
    await captureLeadAndNotDoctorSession(page);
    await completePositiveQuiz(page);

    await expect
      .poll(() => page.evaluate(([key]) => window.sessionStorage.getItem(key), [NOT_DOCTOR_SESSION_KEY]))
      .toBeNull();

    const cta = page.locator(".quiz-cta");
    await expect(cta).toBeVisible();
    await expect(cta).toHaveText("Garantir minha vaga agora");
    await cta.click();

    await expect(page.locator("[data-lead-form]")).toHaveCount(0);
    await expect(page).toHaveURL(/(mpago\.la\/244hsWi|mercadopago\.com\.br)/);
  });

  test("página não exibe termos proibidos, não tem links de WhatsApp e usa imagem no kicker inicial", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText(FORBIDDEN_COPY)).toHaveCount(0);

    // O kicker inicial agora é a imagem quiz.png, não mais um texto.
    const kickerImg = page.locator("img[data-quiz-kicker]");
    await expect(kickerImg).toHaveCount(1);
    await expect(kickerImg).toBeVisible();
    await expect(kickerImg).toHaveAttribute("src", "img/quiz.png");
    await expect(kickerImg).toHaveAttribute("alt", "Workshop Long Hair FUE");
    await expect(page.locator("[data-quiz-card] .quiz-card__kicker")).toHaveCount(0);

    await expectNoWhatsAppLinks(page);
  });
});
