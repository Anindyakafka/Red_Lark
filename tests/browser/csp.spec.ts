import { test, expect } from "@playwright/test";

for (const route of ["/en/", "/en/collection/", "/en/workshop/", "/en/contribute/", "/en/poster/borders-are-lines/", "/en/404/"]) {
  test(`strict CSP still hydrates ${route}`, async ({ page }) => {
    const violations: string[] = [];
    page.on("console", (message) => {
      if (/Content Security Policy|Content-Security-Policy|Refused to execute/i.test(message.text()))
        violations.push(message.text());
    });
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    const policy = response?.headers()["content-security-policy"] ?? "";
    expect(policy).toContain("script-src 'self'");
    expect(policy).not.toMatch(/script-src[^;]*'unsafe-inline'/);
    await expect(page.locator("main")).toBeVisible();
    await page.waitForLoadState("networkidle");
    expect(violations).toEqual([]);
  });
}
