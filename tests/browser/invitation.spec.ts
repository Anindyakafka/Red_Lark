import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
for (const locale of ["en", "hi"])
  for (const width of [390, 1440])
    test(`staff invitation needs explicit acceptance ${locale} ${width}`, async ({
      page,
    }, info) => {
      await page.setViewportSize({ width, height: 1000 });
      let accepted = 0;
      await page.route("**/api/**", (route) => {
        if (new URL(route.request().url()).pathname === "/api/auth/invite") {
          accepted++;
          return route.fulfill({ json: { ok: true } });
        }
        return route.fulfill({ json: { csrf: "fixture", account: null } });
      });
      await page.goto(`/${locale}/verify/#invite=${"a".repeat(56)}`);
      await expect(
        page.getByRole("button", { name: "Accept staff invitation", exact: true }),
      ).toBeVisible();
      expect(accepted).toBe(0);
      expect(
        (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze())
          .violations,
      ).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.screenshot({ path: info.outputPath("invitation.png"), fullPage: true });
      await page.getByRole("button", { name: "Accept staff invitation", exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`/${locale}/reset-password/`));
      expect(accepted).toBe(1);
    });
test("expired invitation offers recovery without showing raw API errors", async ({ page }) => {
  await page.route("**/api/session", (route) =>
    route.fulfill({ json: { csrf: "fixture", account: null } }),
  );
  await page.route("**/api/auth/invite", (route) =>
    route.fulfill({ status: 400, json: { error: "invitation_expired" } }),
  );
  await page.goto(`/en/verify/#invite=${"b".repeat(56)}`);
  await page.getByRole("button", { name: "Accept staff invitation", exact: true }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "invalid, expired or already used",
  );
  await expect(page.getByRole("link", { name: "Forgot password?", exact: true })).toBeVisible();
  await expect(page).not.toHaveURL(/#invite=/);
});
