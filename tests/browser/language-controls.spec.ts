import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const locale of ["en", "hi", "bn", "ml"])
  for (const width of [360, 390, 768, 1024, 1440])
    test(`language controls align without decorative brackets ${locale} ${width}`, async ({
      page,
    }, info) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.route("**/api/session", (route) =>
        route.fulfill({ json: { csrf: "fixture", account: null } }),
      );
      await page.goto(`/${locale}/`);
      await page.evaluate(() => document.fonts.ready);
      const header = page.locator(".language-switcher a");
      const boxes = await header.evaluateAll((links) =>
        links.map((link) => {
          const { y, height } = link.getBoundingClientRect();
          return { y, height };
        }),
      );
      expect(boxes).toHaveLength(4);
      expect(new Set(boxes.map((box) => Math.round(box.y))).size).toBe(1);
      expect(new Set(boxes.map((box) => Math.round(box.height))).size).toBe(1);
      const picker = page.locator(".language-choice a");
      const heights = await picker.evaluateAll((links) =>
        links.map((link) => Math.round(link.getBoundingClientRect().height)),
      );
      expect(new Set(heights).size).toBe(1);
      expect(await page.locator("body").innerText()).not.toMatch(/[\[\]]/);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      expect(
        (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze())
          .violations,
      ).toEqual([]);
      await page.locator(".site-header").screenshot({ path: info.outputPath("header.png") });
      await page
        .locator(".language-choice")
        .screenshot({ path: info.outputPath("language-picker.png") });
      await page.screenshot({ path: info.outputPath("landing.png"), fullPage: true });
    });

test("archive, forms, policies and Studio do not display decorative brackets", async ({ page }) => {
  test.setTimeout(120000);
  await page.route("**/api/session", (route) =>
    route.fulfill({ json: { csrf: "fixture", account: null } }),
  );
  for (const locale of ["en", "hi", "bn", "ml"])
    for (const path of [
      "collection",
      "poster/borders-are-lines",
      "categories",
      "discover",
      "artists",
      "about",
      "contact",
      "contribute",
      "login",
      "privacy",
      "policies",
      "blog",
      "missing-page",
      "workshop",
    ]) {
      await page.goto(`/${locale}/${path}/`);
      if (path === "workshop") {
        await page.getByRole("button", { name: "Poster/Placard", exact: true }).click();
        await expect(page.locator(".studio-paper")).toBeVisible();
      }
      expect(await page.locator("body").innerText(), `${locale}/${path}`).not.toMatch(/[\[\]]/);
      if (path === "contact") {
        await page.locator('main form button[type="submit"]').click();
        expect(await page.locator("body").innerText()).not.toMatch(/[\[\]]/);
      }
    }
});
