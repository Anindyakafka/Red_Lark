import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
for (const locale of ["en", "hi"])
  for (const width of [390, 1440])
    test(`password reset verifies MFA without losing the password ${locale} ${width}`, async ({
      page,
    }, info) => {
      await page.setViewportSize({ width, height: 1000 });
      let attempts = 0;
      await page.route("**/api/**", (route) => {
        const path = new URL(route.request().url()).pathname;
        if (path === "/api/session")
          return route.fulfill({
            json: { csrf: "fixture", account: { admin: true, aal2: false, fresh: false } },
          });
        if (path === "/api/auth/mfa/factors")
          return route.fulfill({ json: { factors: [{ id: "fixture", status: "verified" }] } });
        if (path === "/api/auth/reset")
          return ++attempts === 1
            ? route.fulfill({ status: 403, json: { error: "password_mfa_required" } })
            : route.fulfill({ json: { ok: true } });
        return route.fulfill({ json: { ok: true } });
      });
      await page.goto(`/${locale}/reset-password/`);
      const password = page.locator("#auth-password");
      await password.fill("Only-a-browser-fixture-123!");
      await page.locator("main form > button[type=submit]").click();
      await expect(page.locator("#mfa-code")).toBeVisible();
      await expect(page.locator("#mfa-code")).toBeFocused();
      await expect(password).toHaveValue("Only-a-browser-fixture-123!");
      await expect(page.locator("form form")).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.screenshot({ path: info.outputPath("password-mfa.png"), fullPage: true });
      expect(
        (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze())
          .violations,
      ).toEqual([]);
      await page.locator("#mfa-code").fill("123456");
      await page.locator("#mfa-code").press("Enter");
      await expect(page.locator("#mfa-code")).toHaveCount(0);
      await expect(password).toHaveValue("Only-a-browser-fixture-123!");
      await page.locator("main form > button[type=submit]").click();
      await expect(page.locator("#auth-password")).toHaveCount(0);
      expect(attempts).toBe(2);
    });
