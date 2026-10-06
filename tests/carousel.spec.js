// @ts-check
const { test, expect } = require("@playwright/test");

// Viewport estreito garante que os carrosséis tenham conteúdo rolável
// (hasScrollableContent) e que o botão de autoplay fique habilitado.
test.use({ viewport: { width: 390, height: 844 } });

const CAROUSELS = [
  { name: "registros", label: "Registros visuais" },
];

function carousel(page, label) {
  return page.locator(`[data-carousel][aria-label="${label}"]`);
}

async function pauseAutoplayIfNeeded(page, root) {
  const toggle = root.locator("[data-carousel-toggle]");
  if ((await toggle.isEnabled()) && (await toggle.getAttribute("aria-pressed")) === "false") {
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
  }
}

for (const item of CAROUSELS) {
  test.describe(`Carrossel — ${item.name}`, () => {
    test("botão Pausar/Retomar alterna aria-pressed e o texto", async ({ page }) => {
      await page.goto("/");
      const root = carousel(page, item.label);
      const toggle = root.locator("[data-carousel-toggle]");

      await expect(toggle).toBeEnabled();
      await expect(toggle).toHaveText("Pausar");
      await expect(toggle).toHaveAttribute("aria-pressed", "false");

      await toggle.click();
      await expect(toggle).toHaveText("Retomar");
      await expect(toggle).toHaveAttribute("aria-pressed", "true");

      await toggle.click();
      await expect(toggle).toHaveText("Pausar");
      await expect(toggle).toHaveAttribute("aria-pressed", "false");
    });

    test("Próximo e Anterior alteram o scrollLeft do viewport", async ({ page }) => {
      await page.goto("/");
      const root = carousel(page, item.label);
      const viewport = root.locator("[data-carousel-viewport]");
      const next = root.locator("[data-carousel-next]");
      const prev = root.locator("[data-carousel-prev]");

      // Pausa o autoplay para tornar a asserção determinística
      await pauseAutoplayIfNeeded(page, root);

      await expect
        .poll(() => viewport.evaluate((el) => el.scrollWidth > el.clientWidth + 8))
        .toBe(true);

      const initial = await viewport.evaluate((el) => el.scrollLeft);
      expect(initial).toBeLessThanOrEqual(4);
      await expect(next).toBeEnabled();

      await next.click();
      await expect.poll(() => viewport.evaluate((el) => el.scrollLeft)).toBeGreaterThan(initial);
      await expect(prev).toBeEnabled();

      await prev.click();
      await expect.poll(() => viewport.evaluate((el) => el.scrollLeft)).toBeLessThanOrEqual(initial + 4);
    });
  });
}

test("prefers-reduced-motion desativa o autoplay em ambos os carrosséis", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  for (const item of CAROUSELS) {
    const toggle = carousel(page, item.label).locator("[data-carousel-toggle]");
    await expect(toggle).toHaveText("Autoplay desativado");
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await expect(toggle).toBeDisabled();
  }
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
