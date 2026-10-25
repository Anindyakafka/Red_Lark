import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { openOption } from "./studio-helpers";
for (const locale of ["en", "ml"])
  for (const width of [375, 1440])
    test(`Studio theme and local-only design requests ${locale} ${width}`, async ({
      page,
    }, info) => {
      await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
      await page.setViewportSize({ width, height: 1000 });
      const external: string[] = [];
      page.on("request", (request) => {
        if (!request.url().startsWith("http://localhost:") && !request.url().startsWith("data:"))
          external.push(request.url());
      });
      await page.route("**/api/session", (route) =>
        route.fulfill({ json: { csrf: "fixture", account: null } }),
      );
      await page.goto(`/${locale}/workshop/?remix=borders-are-lines`);
      await expect(page.locator(".studio-paper")).toBeVisible();
      await openOption(page, "text");
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await page.keyboard.press("Escape");
      await page.locator(".studio-workspace").scrollIntoViewIfNeeded();
      await page.screenshot({ path: info.outputPath("dark-workspace.png") });
      expect(external).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    });
test("Collection and print downloads remain browsable without JavaScript", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false }),
    page = await context.newPage();
  await page.goto("/en/collection/");
  await expect(page.locator(".poster-card")).toHaveCount(1);
  await page.locator(".card-title-row a").first().click();
  await expect(page.locator(".downloads a").first()).toBeVisible();
  await context.close();
});
