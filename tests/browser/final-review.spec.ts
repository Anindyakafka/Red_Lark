import fs from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

function routes(directory: string, prefix: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory())
      return routes(path.join(directory, entry.name), `${prefix}${entry.name}/`);
    return entry.name === "index.html" ? [prefix] : [];
  });
}

for (const locale of ["en", "hi", "bn", "ml"])
  test(`fresh eyes: every exported ${locale} page has accessible content`, async ({ page }) => {
    test.setTimeout(600000);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const paths = routes(path.resolve("out", locale), `/${locale}/`);
    expect(paths.length).toBeGreaterThan(75);
    for (const route of paths)
      await test.step(route, async () => {
        expect((await page.goto(route))?.status()).toBe(200);
        await expect(page.locator("html")).toHaveAttribute("lang", locale);
        await expect(page.locator("h1")).toHaveCount(1);
        await expect(page.locator("main")).toHaveCount(1);
        await page.evaluate(() => document.fonts.ready);
        expect(await page.locator("body").innerText(), route).not.toMatch(/[\[\]]/);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        const audit = await new AxeBuilder({ page }).analyze();
        expect(audit.violations, route).toEqual([]);
      });
    expect(errors).toEqual([]);
  });

test("fresh eyes: dark native pages and no-JS editorial remain usable", async ({
  browser,
  page,
}) => {
  test.setTimeout(120000);
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/ml/policies/ai-policy/");
  expect(
    await page.locator("h1").evaluate((node) => parseFloat(getComputedStyle(node).fontSize)),
  ).toBeLessThanOrEqual(40);
  for (const route of [
    "/ml/",
    "/hi/collection/",
    "/ml/poster/a-future-we-share/",
    "/en/contact/",
  ]) {
    await page.goto(route);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  const context = await browser.newContext({ javaScriptEnabled: false });
  const nojs = await context.newPage();
  await nojs.goto("/ml/blog/artist-interview-outline/");
  await expect(nojs.locator("h1")).toHaveCount(1);
  await expect(nojs.locator("article")).not.toBeEmpty();
  await context.close();
});
