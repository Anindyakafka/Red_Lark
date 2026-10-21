import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
for (const locale of ["en", "hi"])
  for (const width of [360, 390, 1440])
    test(`landing contribution and visitor authentication ${locale} ${width}`, async ({
      page,
    }, info) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.route("**/api/session", (route) =>
        route.fulfill({ json: { csrf: "fixture", account: null } }),
      );
      await page.goto(`/${locale}/`);
      const ctas = page.locator(".hero-ctas a");
      expect(
        await ctas.evaluateAll((links) =>
          links.map((link) => new URL((link as HTMLAnchorElement).href).pathname),
        ),
      ).toEqual([`/${locale}/collection/`, `/${locale}/studio/`, `/${locale}/submit/`]);
      await expect(page.locator(`header a[href="/${locale}/login/"]`)).toBeVisible();
      await expect(page.locator(`header a[href="/${locale}/signup/"]`)).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      expect(
        (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze())
          .violations,
      ).toEqual([]);
      await page.screenshot({ path: info.outputPath("landing.png"), fullPage: true });
    });
test("admin badge has no warning glyph and navigation does not challenge a verified session", async ({
  page,
}) => {
  let checks = 0;
  await page.route("**/api/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/session") {
      checks++;
      return route.fulfill({
        json: {
          csrf: "fixture",
          account: { admin: true, aal2: true, fresh: true, pendingCount: null },
        },
      });
    }
    if (path === "/api/admin/queue") return route.fulfill({ json: { works: [] } });
    if (path === "/api/admin/audit")
      return route.fulfill({ json: { audit: [], total: 0, offset: 0 } });
    return route.fulfill({ json: { ok: true } });
  });
  await page.goto("/en/");
  await expect(page.locator("header .admin-link")).toHaveText("Admin");
  await expect(page.locator("header .admin-link span")).toHaveCount(0);
  await page.locator("header .admin-link").click();
  await expect(page.locator("#mfa-code")).toHaveCount(0);
  await page.locator('main a[href="/en/admin/audit/"]').click();
  await expect(page.locator(".audit-filters")).toBeVisible();
  await expect(page.locator("#mfa-code")).toHaveCount(0);
  await page.reload();
  await expect(page.locator(".audit-filters")).toBeVisible();
  expect(checks).toBeGreaterThan(2);
});
