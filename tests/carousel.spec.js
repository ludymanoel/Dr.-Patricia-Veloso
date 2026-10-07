// @ts-check
const { test, expect } = require("@playwright/test");

// Viewport estreito garante que os carrosséis tenham conteúdo rolável
// (hasScrollableContent) e que o autoplay automático seja iniciado.
test.use({ viewport: { width: 390, height: 844 } });

const CAROUSELS = ["Registros visuais", "Antes e depois Long Hair FUE"];

function carousel(page, label) {
  return page.locator(`[data-carousel][aria-label="${label}"]`);
}

test.describe("Carrossel — registros", () => {
  for (const label of CAROUSELS) {
    test(`não exibe mais controles de Pausar/Anterior/Próximo — ${label}`, async ({ page }) => {
      await page.goto("/");
      const root = carousel(page, label);

      await expect(root).toBeVisible();
      await expect(root.locator(".carousel__controls")).toHaveCount(0);
      await expect(root.locator("[data-carousel-toggle]")).toHaveCount(0);
      await expect(root.locator("[data-carousel-prev]")).toHaveCount(0);
      await expect(root.locator("[data-carousel-next]")).toHaveCount(0);
    });

    test(`avança o scrollLeft automaticamente (autoplay) sem controles — ${label}`, async ({ page }) => {
      await page.goto("/");
      const viewport = carousel(page, label).locator("[data-carousel-viewport]");

      await expect
        .poll(() => viewport.evaluate((el) => el.scrollWidth > el.clientWidth + 8))
        .toBe(true);

      const initial = await viewport.evaluate((el) => el.scrollLeft);
      await expect
        .poll(() => viewport.evaluate((el) => el.scrollLeft), { timeout: 12000 })
        .toBeGreaterThan(initial + 4);
    });
  }
});

test("prefers-reduced-motion mantém o autoplay parado (sem controles)", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const viewport = carousel(page, CAROUSELS[0]).locator("[data-carousel-viewport]");
  await expect
    .poll(() => viewport.evaluate((el) => el.scrollWidth > el.clientWidth + 8))
    .toBe(true);

  await page.waitForTimeout(5000);
  expect(await viewport.evaluate((el) => el.scrollLeft)).toBeLessThanOrEqual(4);
});

test("programa usa layout estático acessível em vez de carrossel", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("#programa [data-carousel]")).toHaveCount(0);
  await expect(page.locator("#programa .program-list")).toHaveCount(0);
  await expect(page.locator("#programa .program-visual")).toHaveCount(0);
  await expect(page.locator('#programa img[src="img/conteúdo (imagem 1).png"]')).toBeVisible();
  await expect(page.locator('#programa img[src="img/conteúdo (imagem 1).png"]')).toHaveAttribute("alt", /Conteúdo programático/);
  await expect(page.locator('#programa [aria-label="Transcrição dos tópicos do programa"] p')).toHaveCount(12);
});
