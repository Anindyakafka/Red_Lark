import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
for (const locale of ["en", "hi", "bn", "ml"]) {
  test(`${locale}: document language, alternates, routing and accessible core pages`, async ({
    page,
  }) => {
    await page.goto(`/${locale}/`);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(4);
    if (locale !== "en") await expect(page.locator(".translation-notice")).toBeVisible();
    for (const route of ["/collection/", "/contact/", "/privacy/", "/404/"]) {
      await page.goto(`/${locale}${route}`);
      expect(
        (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze())
          .violations,
      ).toEqual([]);
      await page.setViewportSize({ width: 390, height: 844 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
  });
}
test("locale switch preserves path and unknown localized pages return localized 404", async ({
  page,
  request,
}) => {
  await page.goto("/en/collection/");
  await page.locator('.language-switcher a[lang="ml"]').click();
  await expect(page).toHaveURL(/\/ml\/collection\//);
  const response = await request.get("/ml/no-such-print/");
  expect(response.status()).toBe(404);
  expect(await response.text()).toContain('lang="ml"');
});
