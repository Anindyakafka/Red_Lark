import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";
async function fixtures(page: Page) {
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/session")
      return route.fulfill({ json: { csrf: "fixture-token", account: null } });
    if (path === "/api/account") return route.fulfill({ json: { profile: null, works: [] } });
    if (path === "/api/auth/mfa/factors") return route.fulfill({ json: { factors: [] } });
    if (path === "/api/admin/queue")
      return route.fulfill({ status: 403, json: { error: "fresh_mfa_required" } });
    return route.fulfill({ status: 503, json: { error: "service_unavailable" } });
  });
}
for (const locale of ["en", "hi", "bn", "ml"])
  for (const route of [
    "login",
    "signup",
    "forgot-password",
    "reset-password",
    "account",
    "admin",
    "submit",
    "takedown",
  ]) {
    test(`backend page + axe ${locale}/${route}`, async ({ page }) => {
      await fixtures(page);
      await page.goto(`/${locale}/${route}/`);
      await expect(page.locator("h1")).toHaveCount(1);
      await page.evaluate(() => document.fonts.ready);
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
            .analyze()
        ).violations,
      ).toEqual([]);
      for (const width of [360, 390]) {
        await page.setViewportSize({ width, height: 900 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        const cta = await page.locator(".page-intro .button").boundingBox();
        expect(cta && cta.y + cta.height, `${locale}/${route} CTA at ${width}`).toBeLessThanOrEqual(
          900,
        );
      }
    });
  }
test("password forms focus errors; generic inbox and password reset links work without enumeration", async ({
  page,
}) => {
  await fixtures(page);
  await page.goto("/en/login/");
  await page.getByRole("button", { name: "Use a password instead", exact: true }).click();
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.locator("#auth-email")).toBeFocused();
  await expect(page.locator("#auth-email")).toHaveAttribute("aria-describedby", "auth-email-error");
  await page.getByRole("link", { name: "Forgot password?", exact: true }).click();
  await page.route("**/api/auth/forgot", (route) =>
    route.fulfill({ json: { ok: true, inbox: true } }),
  );
  await page.getByLabel("Email", { exact: true }).fill("fixture@example.invalid");
  await page.getByRole("button", { name: "Send reset link", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Check your inbox" })).toBeVisible();
  await expect(page.locator("main")).toContainText("does not confirm whether an account exists");
});
test("public signup is invitation-only and guest uploads remain available", async ({ page }) => {
  await fixtures(page);
  await page.route("**/api/auth/signup-link", (route) =>
    route.fulfill({ json: { ok: true, inbox: true } }),
  );
  await page.goto("/en/signup/");
  await expect(
    page.getByRole("heading", { name: "Staff accounts are invitation only.", exact: true }).last(),
  ).toBeVisible();
  await expect(page.getByLabel("Email", { exact: true })).toHaveCount(0);
  await page.route("**/api/account", (route) =>
    route.fulfill({ status: 401, json: { error: "sign_in_required" } }),
  );
  await page.goto("/en/submit/");
  await expect(page.locator("main")).toContainText("No account needed");
  await page.getByRole("button", { name: "Poster/Placard", exact: true }).click();
  await expect(page.locator("input[type=file]")).toBeVisible();
});

test("admin is gated by fresh MFA and never shows a counterfeit queue", async ({ page }) => {
  await fixtures(page);
  await page.goto("/en/admin/");
  await expect(page).toHaveURL(/\/en\/login\//);
  await expect(page.getByRole("button", { name: "Save decision" })).toHaveCount(0);
});
test("contact and takedown keep messages on network/provider failure and expose required URL errors", async ({
  page,
}) => {
  await fixtures(page);
  await page.goto("/en/takedown/");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.locator("#work_url")).toBeFocused();
  await expect(page.locator("#work_url-error")).toBeVisible();
  await page.getByLabel("Artwork URL").fill("https://redlarkworkshop.com/en/poster/fixture/");
  await page.getByLabel("YOUR MESSAGE").fill("A rights concern about this fixture.");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.locator("main [role=alert]")).toBeVisible();
  await expect(page.getByLabel("YOUR MESSAGE")).toHaveValue("A rights concern about this fixture.");
});
test("backend visual evidence: English/Malayalam at 390 and 1440", async ({ page }) => {
  test.setTimeout(120000);
  const dir = "docs/evidence/backend-pages-round-1";
  fs.mkdirSync(dir, { recursive: true });
  for (const locale of ["en", "ml"])
    for (const width of [390, 1440])
      for (const route of ["login", "account", "admin", "contact"]) {
        await fixtures(page);
        await page.setViewportSize({ width, height: 1000 });
        await page.goto(`/${locale}/${route}/`);
        await page.evaluate(() => document.fonts.ready);
        if (route === "contact")
          await page
            .locator("main form button[type=submit], main form button:not([type])")
            .first()
            .click();
        await page.screenshot({ path: `${dir}/${locale}-${route}-${width}.png`, fullPage: true });
      }
});
