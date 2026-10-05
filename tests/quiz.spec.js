// @ts-check
const { test, expect } = require("@playwright/test");

const WHATSAPP_HOST = /^https:\/\/wa\.me\/\d{10,15}\?text=.+/;

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

test.describe("Quiz interativo", () => {
  test("a página carrega e a seção #quiz existe", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("#quiz")).toBeVisible();
    await expect(page.locator("[data-quiz-app]")).toBeVisible();

    const start = page.locator("[data-quiz-start]");
    await expect(start).toBeVisible();
    await expect(start).toHaveText("Começar");
    await expect(page.locator("[data-quiz-progress-label]")).toHaveText("Início");
  });

  test("clicar em Começar mostra a primeira pergunta e atualiza o progresso", async ({ page }) => {
    await startQuiz(page);

    await expect(page.locator("[data-quiz-card] h3")).toHaveText("Você é médico(a)?");
    await expect(page.locator("[data-quiz-progress-label]")).toHaveText("Etapa 1 de 4");
    await expect(page.locator("[data-quiz-answer]")).toHaveCount(3);

    const width = await page.locator("[data-quiz-progress-bar]").evaluate((el) => el.style.width);
    expect(width).toBe("25%");
  });

  test("responder todas as perguntas exibe resultado personalizado, CTA wa.me e refazer", async ({ page }) => {
    await startQuiz(page);

    await answer(page, 0, "Etapa 2 de 4");
    await answer(page, 0, "Etapa 3 de 4");
    await answer(page, 0, "Etapa 4 de 4");
    await answer(page, 0, "Resultado");

    // Copy personalizada coerente com as respostas escolhidas
    await expect(page.locator("[data-quiz-card] h3")).toContainText("Seu foco em indicação");
    const result = page.locator(".quiz-result");
    await expect(result).toBeVisible();
    await expect(result).toHaveAttribute("aria-label", /Orientação personalizada/);
    await expect(result.locator("p")).toHaveCount(3);
    for (const paragraph of await result.locator("p").allTextContents()) {
      expect(paragraph.trim().length).toBeGreaterThan(0);
    }

    // CTA de WhatsApp com href wa.me válido e resumo embutido
    const cta = page.locator(".quiz-whatsapp");
    await expect(cta).toBeVisible();
    const href = await cta.getAttribute("href");
    expect(href).toMatch(WHATSAPP_HOST);
    expect(decodeURIComponent(href || "")).toContain("Resumo do quiz:");

    // Botão para refazer
    const restart = page.locator("[data-quiz-restart]");
    await expect(restart).toBeVisible();
    await expect(restart).toHaveText("Refazer quiz");

    // Não deve existir bloco visível "Resumo das respostas"
    await expect(page.getByText("Resumo das respostas", { exact: false })).toHaveCount(0);
  });

  test("refazer quiz volta para a tela inicial", async ({ page }) => {
    await startQuiz(page);
    await answer(page, 0, "Etapa 2 de 4");
    await answer(page, 0, "Etapa 3 de 4");
    await answer(page, 0, "Etapa 4 de 4");
    await answer(page, 0, "Resultado");

    await page.locator("[data-quiz-restart]").click();

    await expect(page.locator("[data-quiz-progress-label]")).toHaveText("Início");
    await expect(page.locator("[data-quiz-start]")).toBeVisible();
    await expect(page.locator("[data-quiz-restart]")).toHaveCount(0);
  });

  test("ramificação Não sou médico(a) exibe orientação institucional", async ({ page }) => {
    await startQuiz(page);

    await answer(page, 2, "Orientação");

    await expect(page.locator("[data-quiz-card] .quiz-card__kicker")).toHaveText("Orientação institucional");
    await expect(page.locator("[data-quiz-card] h3")).toContainText("Obrigado pelo interesse no Workshop Long Hair FUE");
    await expect(page.locator("[data-quiz-card]")).toContainText("exclusivo para médicos");

    // Não deve exibir o resultado personalizado nesse ramo
    await expect(page.locator(".quiz-result")).toHaveCount(0);

    const cta = page.locator(".quiz-whatsapp");
    await expect(cta).toBeVisible();
    expect(await cta.getAttribute("href")).toMatch(WHATSAPP_HOST);

    await expect(page.locator("[data-quiz-restart]")).toBeVisible();
  });
});
