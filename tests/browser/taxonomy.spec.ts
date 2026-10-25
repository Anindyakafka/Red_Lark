import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("format/category query links filter, survive locale switch and reset", async ({ page }) => {
  await page.goto("/en/collection/?kind=poster-placard");
  await expect(page.locator(".poster-card")).toHaveCount(1);
  await expect(page.getByLabel("Type", { exact: true })).toHaveValue("poster-placard");
  await page.locator('.language-switcher a[hreflang="ml"]').click();
  await expect(page).toHaveURL(/\/ml\/collection\/\?kind=poster-placard/);
  await expect(page.locator(".poster-card")).toHaveCount(1);
  await page.locator(".filter-all").click();
  await expect(page.locator(".poster-card")).toHaveCount(1);
  await expect(page).not.toHaveURL(/kind=/);
});
test("new indexes and signed-out account are accessible and truthful", async ({ page }) => {
  for (const locale of ["en", "ml"])
    for (const route of ["categories", "blog", "account"]) {
      expect((await page.goto(`/${locale}/${route}/`))?.status()).toBe(200);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      if (route === "account") {
        await expect(page.locator("form")).toHaveCount(0);
        await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
      }
    }
});
