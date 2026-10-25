import { test, expect } from "@playwright/test";
import copy from "../../content/copy/landing.en.json" with { type: "json" };
import categories from "../../content/categories.json" with { type: "json" };
import hiCopy from "../../content/copy/landing.hi.json" with { type: "json" };
import bnCopy from "../../content/copy/landing.bn.json" with { type: "json" };
import mlCopy from "../../content/copy/landing.ml.json" with { type: "json" };
import AxeBuilder from "@axe-core/playwright";

test("landing category destinations and localized policy hubs resolve accessibly", async ({
  page,
}) => {
  for (const category of categories) {
    const response = await page.goto(`/en/category/${category.slug}/`);
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
  }
  for (const locale of ["en", "hi", "bn", "ml"]) {
    const response = await page.goto(`/${locale}/policies/`);
    expect(response?.status()).toBe(200);
    const result = await new AxeBuilder({ page }).analyze();
    expect(result.violations).toEqual([]);
  }
});
test("landing renders the complete About text and collection", async ({ page }) => {
  await page.goto("/en/");
  await expect(page.locator('[data-copy="about"]')).toHaveText(copy.about);
  await expect(page.locator(".landing-preview-heading h2")).toHaveText("COLLECTION");
  await expect(page.locator(".landing-about [data-copy='aboutHeading']")).toHaveCount(0);
  await expect(page.locator(".landing-objectives, .landing-ai")).toHaveCount(0);
});

test("localized About copy, About links and Workshop CTA remain intact", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const copies = { en: copy, hi: hiCopy, bn: bnCopy, ml: mlCopy };
  for (const locale of ["en", "hi", "bn", "ml"] as const) {
    const localeCopy = copies[locale];
    await page.goto(`/${locale}/`);
    await expect(page.locator('.landing-about [data-copy="about"]')).toHaveText(localeCopy.about);
    await expect(page.locator(`.landing-about a[href="/${locale}/about/"]`)).toBeVisible();
    await expect(page.locator(".mobile-cta")).not.toContainText(/studio/i);
    await page.goto(`/${locale}/about/`);
    await expect(page.locator("[data-about-copy]")).toHaveText(localeCopy.about);
    await expect(page.locator(".prose ol li")).toHaveText(localeCopy.objectives);
    await page.goto(`/${locale}/policies/ai-policy/`);
    await expect(page.locator("[data-policy-copy]")).toHaveText(localeCopy.ai);
  }
});
test("English landing remains complete without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("http://localhost:3000/en/");
  await expect(page.locator('[data-copy="about"]')).toHaveText(copy.about);
  await expect(page.locator(".landing-objectives, .landing-ai")).toHaveCount(0);
  await expect(page.locator('.hero-ctas a[href="/en/collection/"]')).toBeVisible();
  await context.close();
});

test("landing copy wraps at all five widths in every script", async ({ page }) => {
  for (const locale of ["en", "hi", "bn", "ml"])
    for (const width of [360, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(`/${locale}/`);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `${locale} ${width}`,
      ).toBe(true);
    }
});
