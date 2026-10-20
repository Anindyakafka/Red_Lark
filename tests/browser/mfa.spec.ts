import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Synthetic fixture only: never use, record or screenshot a real enrollment secret.
const setupKey = "JBSWY3DPEHPK3PXP";
const qrCode = `data:image/svg+xml;base64,${Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240"><rect width="240" height="240" fill="white"/></svg>',
).toString("base64")}`;

for (const locale of ["en", "hi"]) {
  test(`authenticator setup shows QR and an isolated manual key, clears both after verification: ${locale}`, async ({
    page,
  }) => {
    await page.route("**/api/**", async (route) => {
      const path = new URL(route.request().url()).pathname;
      const json =
        path === "/api/session"
          ? { csrf: "fixture-token", account: { email: "fixture@example.invalid", admin: false } }
          : path === "/api/auth/mfa/factors"
            ? { factors: [] }
            : path === "/api/auth/mfa/enroll"
              ? { factorId: "fixture-factor", secret: setupKey, qrCode }
              : path === "/api/account"
                ? { profile: null, works: [] }
                : { ok: true };
      await route.fulfill({ json });
    });
    await page.goto(`/${locale}/account/settings/`);
    const panel = page.locator("form").filter({ has: page.locator("#mfa-code") });
    await page.getByRole("button", { name: "Set up authenticator", exact: true }).click();
    await expect(page.locator("#mfa-setup-key")).toHaveValue(setupKey);
    await expect(page.locator("#mfa-setup-key")).toHaveAttribute("readonly", "");
    const image = page.locator('img[src^="data:image/svg+xml;base64,"]');
    await expect(image).toBeVisible();
    expect(await image.evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBe(240);
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.locator("#mfa-code").fill("123456");
    await panel.locator('button[type="submit"], button:not([type])').click();
    await expect(page.locator("#mfa-setup-key")).toHaveCount(0);
    await expect(image).toHaveCount(0);
  });
}
