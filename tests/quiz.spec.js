// @ts-check
const { test, expect } = require("@playwright/test");

const PAYMENT_URL = "https://mpago.la/244hsWi";
const WHATSAPP_PHONE = "553884213318";
const WHATSAPP_MESSAGE = "Olá, estou interessado em mais informações sobre o Workshop Long Hair Fue \nministrado pela Dra. Patricia Veloso";
const FORBIDDEN_COPY = new RegExp(["Solicitar informa" + "ções", "1" + "00", "capaci" + "dade"].join("|"), "i");

async function startQuiz(page) {
  await page.goto("/");
  await expect(page.locator("#quiz")).toBeVisible();
  await page.locator("[data-quiz-start]").click();
  await expect(page.locator("[data-quiz-progress-label]")).toHaveText("Etapa 1 de 4");
}

async function answer(page, optionIndex, expectedProgress) {
  await page.locator(`[data-quiz-answer="${optionIndex}"]`).click();
  await expect(page.locator("[data-quiz-progress-label]")).toHaveText(expectedProgress);
}

async function completePositiveQuiz(page) {
  await startQuiz(page);
  await answer(page, 0, "Etapa 2 de 4");
  await answer(page, 0, "Etapa 3 de 4");
  await answer(page, 0, "Etapa 4 de 4");
  await answer(page, 0, "Resultado");
}

async function fillLeadForm(page) {
  await page.getByLabel("Nome").fill("Dra. Ana Exemplo");
  await page.getByLabel("E-mail").fill("ana@example.com");
  await page.getByLabel("Telefone").fill("21999999999");
}

test.describe("Quiz interativo", () => {
  test("a página carrega e a seção #quiz existe", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("#quiz")).toBeVisible();
    await expect(page.locator("[data-quiz-app]")).toBeVisible();
    await expect(page.locator(".brand__logo")).toHaveAttribute("src", "img/Logo Dra. Patrícia (Horizontal).png");
    await expect(page.locator(".brand__logo")).toHaveAttribute("alt", "Dra. Patricia Veloso");

    const start = page.locator("[data-quiz-start]");
    await expect(start).toBeVisible();
    await expect(start).toHaveText("Responder o quiz");
    await expect(page.locator("[data-quiz-progress-label]")).toHaveText("Início");
    await expect(page.locator("[data-quiz-card]")).toContainText("Em menos de 1 minuto");
  });

  test("clicar em Começar mostra a primeira pergunta e atualiza o progresso", async ({ page }) => {
    await startQuiz(page);

    await expect(page.locator("[data-quiz-card] h3")).toHaveText("Você é médico(a)?");
    await expect(page.locator("[data-quiz-progress-label]")).toHaveText("Etapa 1 de 4");
    await expect(page.locator("[data-quiz-answer]")).toHaveCount(3);

    const width = await page.locator("[data-quiz-progress-bar]").evaluate((el) => el.style.width);
    expect(width).toBe("25%");
  });

  test("fluxo positivo exibe formulário e redireciona para Mercado Pago após envio válido", async ({ page }) => {
    await completePositiveQuiz(page);

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
    await expect(page.locator("[data-lead-form]")).toContainText("Seus dados serão usados apenas para dar continuidade ao seu interesse no workshop. Esta página não armazena essas informações; após o envio, você será redirecionado para pagamento ou WhatsApp.");
    await expect(page.getByLabel("Nome")).toBeVisible();
    await expect(page.getByLabel("E-mail")).toBeVisible();
    await expect(page.getByLabel("Telefone")).toBeVisible();

    await fillLeadForm(page);
    await page.getByRole("button", { name: "Ir para pagamento" }).click();
    await expect(page).toHaveURL(/(mpago\.la\/244hsWi|mercadopago\.com\.br)/);
  });

  test("refazer quiz volta para a tela inicial", async ({ page }) => {
    await completePositiveQuiz(page);
    await page.locator(".quiz-cta").click();
    await expect(page.locator("[data-lead-form]")).toBeVisible();

    await page.locator("[data-quiz-restart]").click();

    await expect(page.locator("[data-quiz-progress-label]")).toHaveText("Início");
    await expect(page.locator("[data-quiz-start]")).toBeVisible();
    await expect(page.locator("[data-quiz-start]")).toHaveText("Responder o quiz");
    await expect(page.locator("[data-quiz-restart]")).toHaveCount(0);
    await expect(page.locator("[data-lead-form]")).toHaveCount(0);
  });

  test("fluxo incerto exibe formulário de WhatsApp com número configurado", async ({ page }) => {
    await startQuiz(page);
    await answer(page, 0, "Etapa 2 de 4");
    await answer(page, 0, "Etapa 3 de 4");
    await answer(page, 0, "Etapa 4 de 4");
    await answer(page, 1, "Resultado");

    await page.locator(".quiz-cta").click();

    await expect(page.locator("[data-lead-form]")).toBeVisible();
    await expect(page.locator("[data-quiz-card] h3")).toHaveText("Complete seus dados para falar com a equipe");
    await expect(page.locator("[data-lead-form]")).toContainText("Após o envio, abriremos o WhatsApp com uma mensagem pronta para solicitar mais informações.");

    await fillLeadForm(page);
    await page.getByRole("button", { name: "Conversar com a Equipe" }).click();

    const encodedMessage = await page.evaluate((message) => encodeURIComponent(message), WHATSAPP_MESSAGE);
    expect(encodedMessage).toContain("%0Aministrado");
    await expect(page).toHaveURL(new RegExp(`(wa\\.me|api\\.whatsapp\\.com).*${WHATSAPP_PHONE}`));
    const whatsappUrl = new URL(page.url());
    expect(page.url()).toContain(WHATSAPP_PHONE);
    expect(whatsappUrl.searchParams.get("text")).toBe(WHATSAPP_MESSAGE);
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
    await expect(page.getByLabel("Telefone")).toHaveAttribute("aria-invalid", "true");
    await expect(page).toHaveURL(/\/$/);
  });

  test("ramificação Não sou médico(a) carrega formulário de WhatsApp", async ({ page }) => {
    await startQuiz(page);

    await answer(page, 2, "Orientação");

    await expect(page.locator("[data-quiz-card] .quiz-card__kicker")).toHaveText("Orientação institucional");
    await expect(page.locator("[data-quiz-card] h3")).toContainText("Obrigado pelo interesse no Workshop Long Hair FUE");
    await expect(page.locator("[data-quiz-card]")).toContainText("exclusivo para médicos");

    // Não deve exibir o resultado personalizado nesse ramo
    await expect(page.locator(".quiz-result")).toHaveCount(0);

    const cta = page.locator(".quiz-cta");
    await expect(cta).toBeVisible();
    await expect(cta).toHaveText("Falar com a equipe");
    await cta.click();
    await expect(page.locator("[data-lead-form]")).toBeVisible();
    await expect(page.locator("[data-quiz-card] h3")).toHaveText("Complete seus dados para falar com a equipe");

    await expect(page.locator("[data-quiz-restart]")).toBeVisible();
  });

  test("página não exibe termos proibidos e usa texto no kicker inicial", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText(FORBIDDEN_COPY)).toHaveCount(0);
    await expect(page.locator("[data-quiz-kicker]")).toHaveText("Workshop Long Hair FUE");
    await expect(page.locator("[data-quiz-kicker] img")).toHaveCount(0);
  });
});
