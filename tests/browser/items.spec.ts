import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("item codes, actual downloads, AI disclosure, consent and print guidance", async ({
  page,
}) => {
  for (const locale of ["en", "hi", "bn", "ml"]) {
    await page.goto(`/${locale}/poster/a-future-we-share/`);
    const action = await page.locator(".desktop-download-cta").boundingBox();
    expect(action && action.y + action.height < 1000).toBe(true);
    await expect(page.locator(".work-specifications")).toContainText("1a");
    await expect(page.locator(".work-specifications")).toContainText("2c");
    await expect(page.locator('[data-ai-use="generated"]')).toContainText("placeholder");
    await expect(page.locator("[data-public-contact], [data-public-upi]")).toHaveCount(0);
    await expect(page.locator('.downloads a[href$="A2.jpg"]')).toContainText("300 DPI");
    await expect(page.locator('.downloads a[href$="A4.png"]')).toBeVisible();
    await expect(page.locator(".print-instructions li")).toHaveCount(6);
    await expect(page.locator(".more-by-artist .rail-grid a")).toHaveCount(4);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  }
});
