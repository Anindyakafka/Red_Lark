import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";
const token = "a".repeat(43);

test("quick CC0 contribution keeps Workshop remix permission", async ({ page }) => {
  await page.route("**/api/session", (route) =>
    route.fulfill({ json: { csrf: "fixture-token", account: null } }),
  );
  await page.route("**/api/account", (route) =>
    route.fulfill({ status: 401, json: { error: "sign_in_required" } }),
  );
  await page.goto("/en/contribute/");
  await expect(page.locator('.quick-contribution input[name="licence_id"]')).toHaveValue("CC0-1.0");
  await expect(page.locator('.quick-contribution input[name="remixable"]')).toHaveValue("true");
});

for (const locale of ["en", "hi", "bn", "ml"]) {
  test(`guest private upload and receipt without an account: ${locale}`, async ({ page }) => {
    const stages: string[] = [];
    await page.route("**/api/**", async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path === "/api/session")
        return route.fulfill({ json: { csrf: "fixture-token", account: null } });
      if (path === "/api/account")
        return route.fulfill({ status: 401, json: { error: "sign_in_required" } });
      const data = route.request().postDataJSON();
      if (path === "/api/guest/start") {
        stages.push("draft");
        expect(data.contact).toBe("");
        expect(data.artist_name).toBe("");
        expect(data.contact_consent).toBe(false);
        expect(data.upi_consent).toBe(false);
        return route.fulfill({ json: { id: "fixture-work", token } });
      }
      expect(data.token).toBe(token);
      if (path === "/api/guest/sign") {
        stages.push("sign");
        return route.fulfill({
          json: { id: "fixture-ticket", url: "http://localhost:3000/private-fixture-put" },
        });
      }
      if (path === "/api/guest/complete") {
        stages.push("sanitize");
        return route.fulfill({ json: { dpiA4: 150, dpiA2: 75, warning: "resolution_warning" } });
      }
      if (path === "/api/guest/submit") {
        stages.push("review");
        return route.fulfill({ json: { ok: true } });
      }
      if (path === "/api/guest/status")
        return route.fulfill({
          json: {
            title: "Guest fixture",
            status: "pending",
            feedback: "Awaiting review",
            slug: null,
            expiresAt: "2099-01-01",
          },
        });
      throw Error(`Unexpected API path: ${path}`);
    });
    await page.route("**/private-fixture-put", async (route) => {
      stages.push("private-put");
      expect(route.request().method()).toBe("PUT");
      await route.fulfill({ status: 200, body: "" });
    });
    await page.goto(`/${locale}/contribute/`);
    await page.locator(".optional-contribution-details > summary").click();
    await page.locator("#upload-format").selectOption("poster-placard");
    await page.locator("#upload-title").fill("Guest fixture");
    await page.locator("#upload-alt").fill("A black arrow on off-white paper.");
    // Switching format must preserve details rather than resetting the form.
    await page.locator("#upload-format").selectOption("sticker");
    await page.locator("#upload-format").selectOption("poster-placard");
    await expect(page.locator("#upload-title")).toHaveValue("Guest fixture");
    await page.locator("#upload-file").setInputFiles({
      name: "fixture.png",
      mimeType: "image/png",
      buffer: fs.readFileSync("public/icons/icon-192.png"),
    });
    await page.locator(".optional-contribution-details .handoff-form input[name=permission]").check();
    await page.setViewportSize({ width: 390, height: 844 });
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    if (["en", "ml"].includes(locale)) {
      fs.mkdirSync("docs/evidence-local/guest-submissions", { recursive: true });
      await page.screenshot({
        path: `docs/evidence-local/guest-submissions/${locale}-details-390.png`,
        fullPage: true,
      });
    }
    await page.locator(".optional-contribution-details .handoff-form button.accent").click();
    await expect.poll(() => stages).toEqual(["draft", "sign", "private-put", "sanitize", "review"]);
    await expect(page.locator("#upload-file")).toHaveCount(0);
    const link = page.locator("input[readonly]").filter({ visible: true });
    await expect(link).toHaveValue(new RegExp(`#submission=${token}$`));
    expect(stages).toEqual(["draft", "sign", "private-put", "sanitize", "review"]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.locator(`a[href$="#submission=${token}"]`).click();
    // Hash-only navigation is handled without a reload.
    await expect(page.getByRole("heading", { name: "Guest fixture", exact: true })).toBeVisible();
    await expect(page.locator("main")).toContainText("Awaiting review");
    if (["en", "ml"].includes(locale)) {
      await page.screenshot({
        path: `docs/evidence-local/guest-submissions/${locale}-status-390.png`,
        fullPage: true,
      });
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.screenshot({
        path: `docs/evidence-local/guest-submissions/${locale}-status-1440.png`,
        fullPage: true,
      });
    }
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
}

test("account menu dismisses on outside pointer, Escape, focus departure and link navigation", async ({
  page,
}) => {
  await page.route("**/api/session", (route) =>
    route.fulfill({ json: { csrf: "fixture-token", account: { admin: true } } }),
  );
  await page.goto("/en/collection/");
  const menu = page.locator("details.account-menu"),
    summary = menu.locator("summary");
  await summary.click();
  await expect(menu).toHaveAttribute("open", "");
  await page.locator("h1").click();
  await expect(menu).not.toHaveAttribute("open", "");
  await summary.click();
  await page.keyboard.press("Escape");
  await expect(menu).not.toHaveAttribute("open", "");
  await expect(summary).toBeFocused();
  await summary.click();
  await page.locator(".theme-toggle").focus();
  await expect(menu).not.toHaveAttribute("open", "");
  await summary.click();
  await menu.getByRole("link", { name: "Dashboard", exact: true }).click();
  await expect(menu).not.toHaveAttribute("open", "");
});
