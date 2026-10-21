import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";

test("without JavaScript, private form fields use POST and never enter the address bar", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/en/reset-password/");
  await expect(page.locator("main form")).toHaveAttribute("method", "post");
  await expect(
    page.getByText(
      "Enable JavaScript to use account forms. Form fields are never submitted in a URL.",
      { exact: true },
    ),
  ).toBeVisible();
  await page.locator("#auth-password").fill("fixture-only-not-a-password");
  const request = page.waitForRequest((request) => request.method() === "POST");
  await page.getByRole("button", { name: "Set new password", exact: true }).click();
  const posted = await request;
  expect(posted.url()).not.toContain("fixture");
  expect(posted.url()).not.toContain("?");
  await page.goto("/en/contact/");
  await expect(page.locator("main form")).toHaveAttribute("method", "post");
  await expect(
    page.getByText(
      "Enable JavaScript to send this form, or use the displayed contact email. Form fields are never submitted in a URL.",
      { exact: true },
    ),
  ).toBeVisible();
  await context.close();
});
const id = "12345678-1234-1234-1234-123456789012";
const work = {
  id,
  title: "Browser fixture, never published",
  status: "changes_requested",
  feedback: "Please clarify the source.",
  licence_id: "CC-BY-SA-4.0",
  ai_use: "none",
  ai_disclosure: "",
  alt: "Red letters on an off-white paper background.",
  consent_contact: "",
  consent_upi: "",
  caption: "Fixture caption",
  artist_name: "Test fixture",
  source: "https://example.invalid/source",
  tags: ["test"],
  format_slug: "poster-placard",
  languages: ["English"],
  work_categories: [],
  work_files: [],
};
async function fixtures(page: Page, role: "visitor" | "contributor" | "admin" = "visitor") {
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/session")
      return route.fulfill({
        json: {
          csrf: "fixture",
          account: role === "visitor" ? null : { admin: role === "admin", aal2: true, fresh: true },
        },
      });
    if (path === "/api/account")
      return role === "visitor"
        ? route.fulfill({ status: 401, json: { error: "sign_in_required" } })
        : route.fulfill({ json: { profile: null, works: [work] } });
    if (path === "/api/auth/mfa/factors") return route.fulfill({ json: { factors: [] } });
    if (path === "/api/admin/queue")
      return role === "admin"
        ? route.fulfill({ json: { works: [{ ...work, status: "pending" }] } })
        : route.fulfill({ status: 403, json: { error: "fresh_mfa_required" } });
    if (["/api/admin/inbox", "/api/admin/audit", "/api/admin/users"].includes(path))
      return route.fulfill({ json: { messages: [], takedowns: [], audit: [], profiles: [] } });
    return route.fulfill({ json: { ok: true, inbox: true } });
  });
}
for (const locale of ["en", "hi"])
  for (const route of [
    "login",
    "signup",
    "check-your-inbox",
    "verify",
    "forgot-password",
    "reset-password",
    "logout",
    "account",
    "account/profile",
    "account/settings",
    "account/works/new",
    `account/works/${id}`,
    "admin",
    `admin/review/${id}`,
    "admin/messages",
    "admin/takedowns",
    "admin/users",
    "admin/audit",
    "takedown",
    "thank-you",
    "404",
  ]) {
    test(`private route and axe ${locale}/${route}`, async ({ page }) => {
      await fixtures(page, route.startsWith("admin") ? "admin" : "contributor");
      await page.goto(`/${locale}/${route}/`);
      await expect(page.locator("h1")).toHaveCount(1);
      await page.evaluate(() => document.fonts.ready);
      if (route.startsWith("admin") || route.startsWith("account"))
        await expect(page.getByText("Checking your session…", { exact: true })).toHaveCount(0);
      const axe = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(axe.violations).toEqual([]);
      await page.setViewportSize({ width: 390, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      if (!["404", "thank-you", "takedown"].includes(route))
        await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    });
  }
test("header has visitor links, contributor menu, admin control and a working assembled contact address", async ({
  page,
}) => {
  await fixtures(page);
  await page.goto("/en/contact/");
  await expect(
    page.locator("header").getByRole("link", { name: "Log in", exact: true }),
  ).toBeVisible();
  await expect(
    page.locator("header").getByRole("link", { name: "Sign up", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "redlarkworkshop@gmail.com", exact: true }),
  ).toHaveAttribute("href", "mailto:redlarkworkshop@gmail.com");
  await fixtures(page, "admin");
  await page.reload();
  await page.locator(".account-menu summary").click();
  await expect(
    page.locator("header").getByRole("link", { name: "Dashboard", exact: true }),
  ).toBeVisible();
  await expect(page.locator("header").getByRole("link", { name: /^Admin/ })).toBeVisible();
});
test("upload wizard edits an owned revision, preserves metadata and validates file and permission", async ({
  page,
}) => {
  await fixtures(page, "contributor");
  await page.goto(`/en/account/works/${id}/`);
  await page.getByRole("button", { name: "Poster/Placard", exact: true }).click();
  await expect(page.locator("#upload-title")).toHaveValue(work.title);
  await expect(page.locator("#upload-alt")).toHaveValue(work.alt);
  await page.getByRole("button", { name: "Upload", exact: true }).click();
  await expect(page.locator("#upload-file")).toBeFocused();
  await expect(page.locator("#upload-file")).toHaveAttribute(
    "aria-describedby",
    "upload-file-error",
  );
  await expect(
    page.getByText("Note: Your artwork will be featured after the website admin review", {
      exact: true,
    }),
  ).toBeVisible();
});

test("language switching preserves a private revision address through the static shell rewrite", async ({
  page,
}) => {
  await fixtures(page, "contributor");
  await page.goto(`/en/account/works/${id}/`);
  await page.getByRole("link", { name: "हिन्दी", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/hi/account/works/${id}/`));
  await expect(page.locator("html")).toHaveAttribute("lang", "hi");
  await page.locator(".format-picker button").nth(6).click();
  await expect(page.locator("#upload-title")).toHaveValue(work.title);
});

test("mobile header keeps its geometry during dark hydration, theme changes and account states", async ({
  browser,
}) => {
  for (const colorScheme of ["light", "dark"] as const)
    for (const width of [360, 390]) {
      const context = await browser.newContext({ colorScheme, viewport: { width, height: 844 } });
      const page = await context.newPage();
      await page.addInitScript(() => {
        const state = window as typeof window & { headerCls: number };
        state.headerCls = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const shift = entry as PerformanceEntry & { value: number; hadRecentInput: boolean };
            if (!shift.hadRecentInput) state.headerCls += shift.value;
          }
        }).observe({ type: "layout-shift", buffered: true });
      });
      await fixtures(page);
      await page.goto("/en/collection/", { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      expect(
        await page.evaluate(() => (window as typeof window & { headerCls: number }).headerCls),
      ).toBeLessThan(0.05);
      const before = await page.locator(".site-header").boundingBox();
      await page.locator(".theme-toggle").click();
      expect((await page.locator(".site-header").boundingBox())?.height).toBe(before?.height);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await context.close();
    }
});
test("email link is primary, password is optional and inbox responses remain generic", async ({
  page,
}) => {
  await fixtures(page);
  await page.goto("/en/login/");
  await expect(page.locator("#auth-password")).toHaveCount(0);
  await page.getByRole("button", { name: "Email me a sign-in link", exact: true }).click();
  await expect(page.locator("#auth-email")).toBeFocused();
  await page.getByRole("button", { name: "Use a password instead", exact: true }).click();
  await expect(page.locator("#auth-password")).toBeVisible();
  await page.getByRole("button", { name: "Use an email link instead", exact: true }).click();
  await page.getByLabel("Email", { exact: true }).fill("fixture@example.invalid");
  await page.getByRole("button", { name: "Email me a sign-in link", exact: true }).click();
  await expect(page).toHaveURL(/check-your-inbox/);
  await expect(page.locator("main")).toContainText("does not confirm whether an account exists");
});

test("upload wizard sends only a private signed PUT before submitting for review and warns on low DPI", async ({
  page,
}) => {
  await fixtures(page, "contributor");
  const stages: string[] = [];
  await page.route("**/api/account/work", async (route) => {
    stages.push("draft");
    expect(route.request().postDataJSON().licence_id).toBe("CC-BY-NC-ND-4.0");
    await route.fulfill({ json: { id } });
  });
  await page.route("**/api/upload/sign", async (route) => {
    stages.push("sign");
    await route.fulfill({ json: { id, url: "http://localhost:3000/__fixture/private-put" } });
  });
  await page.route("**/__fixture/private-put", async (route) => {
    stages.push("private-put");
    expect(route.request().method()).toBe("PUT");
    await route.fulfill({ status: 200 });
  });
  await page.route("**/api/upload/complete", async (route) => {
    stages.push("sanitize");
    await route.fulfill({ json: { dpiA2: 100, warning: "low_resolution" } });
  });
  await page.route("**/api/account/submit", async (route) => {
    stages.push("review");
    expect(route.request().postDataJSON().contact_consent).toBe(false);
    expect(route.request().postDataJSON().upi_consent).toBe(false);
    await route.fulfill({ json: { ok: true } });
  });
  await page.goto("/en/account/works/new/");
  await page.getByRole("button", { name: "Sticker", exact: true }).click();
  await page.locator("#upload-title").fill("Fixture, never published");
  await page.locator("#upload-alt").fill("Large red lettering on a white rectangle.");
  await page
    .getByRole("radio", {
      name: "People can print and share it exactly as it is, but not remix or change it.",
      exact: true,
    })
    .check();
  await page
    .getByLabel("Only for non-commercial use (nobody can sell it)", { exact: true })
    .check();
  await page.locator("#upload-file").setInputFiles({
    name: "fixture.png",
    mimeType: "image/png",
    buffer: fs.readFileSync("public/icons/icon-16.png"),
  });
  await page.locator("input[name=permission]").check();
  await page.getByRole("button", { name: "Upload", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Submission saved for review.", exact: true }),
  ).toBeVisible();
  await expect(page.locator("main")).toContainText("Resolution warning");
  expect(stages).toEqual(["draft", "sign", "private-put", "sanitize", "review"]);
});

test("admin review requires a written reason and never grants browser-provided roles", async ({
  page,
}) => {
  await fixtures(page, "admin");
  await page.goto(`/en/admin/review/${id}/`);
  await page.locator(`#review-action-${id}`).selectOption("changes_requested");
  await page.getByRole("button", { name: "Save decision", exact: true }).click();
  await expect(page.locator(`#reason-${id}`)).toBeFocused();
  await expect(page.locator(`#reason-${id}-error`)).toBeVisible();
  await fixtures(page, "contributor");
  await page.reload();
  await expect(page.locator("main")).toContainText("You don't have admin access");
  await expect(page.getByRole("button", { name: "Save decision", exact: true })).toHaveCount(0);
});

test("account settings support export and explicit anonymise-or-remove deletion; logout is a protected POST", async ({
  page,
}) => {
  await fixtures(page, "contributor");
  await page.route("**/api/account/export", (route) =>
    route.fulfill({ json: { profile: { artist_name: "Fixture" }, works: [] } }),
  );
  await page.goto("/en/account/settings/");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export account data", exact: true }).click();
  expect((await download).suggestedFilename()).toBe("redlark-account.json");
  await page.getByRole("button", { name: "Delete account", exact: true }).click();
  await page.locator("#delete-effect").selectOption("anonymise");
  await expect(page.locator("#delete-confirm")).toBeVisible();
  await page.getByRole("button", { name: "Permanently delete account", exact: true }).click();
  await expect(page.locator("#delete-confirm")).toBeFocused();
  await expect(page.locator("#delete-confirm-error")).toBeVisible();
  let logout = false;
  await page.route("**/api/auth/logout", async (route) => {
    expect(route.request().method()).toBe("POST");
    logout = true;
    await route.fulfill({ json: { ok: true } });
  });
  await page.goto("/en/logout/");
  expect(logout).toBe(false);
  await page.getByRole("button", { name: "Sign out everywhere", exact: true }).click();
  await expect(page).toHaveURL(/\/login\//);
  expect(logout).toBe(true);
});

test("profile validation keeps optional contact private and focuses accessible field errors", async ({
  page,
}) => {
  await fixtures(page, "contributor");
  await page.goto("/en/account/profile/");
  await expect(page.locator("input[name=contact_public]")).not.toBeChecked();
  await expect(page.locator("input[name=upi_public]")).not.toBeChecked();
  await page.locator("#profile-contact").fill("invalid-address");
  await page.getByRole("button", { name: "Save profile", exact: true }).click();
  await expect(page.locator("#profile-contact")).toBeFocused();
  await expect(page.locator("#profile-contact")).toHaveAttribute(
    "aria-describedby",
    "profile-contact-error",
  );
  await expect(page.locator("#profile-contact-error")).toBeVisible();
});

test("review screenshots include real UI states with explicitly mocked private data", async ({
  page,
}, testInfo) => {
  // Fresh per-run artifacts avoid rewriting historical evidence and Windows file locks.
  const dir = testInfo.outputPath("screenshots");
  fs.mkdirSync(dir, { recursive: true });
  for (const locale of ["en", "ml"])
    for (const width of [390, 1440])
      for (const route of [
        "account/profile",
        "account/settings",
        "account/works/new",
        `admin/review/${id}`,
        "admin/messages",
      ]) {
        await fixtures(page, route.startsWith("admin") ? "admin" : "contributor");
        await page.setViewportSize({ width, height: 1000 });
        await page.goto(`/${locale}/${route}/`);
        if (route === "account/works/new")
          await page.locator(".format-picker button").nth(6).click();
        await page.evaluate(() => document.fonts.ready);
        await page.screenshot({
          path: `${dir}/${locale}-${route.replaceAll("/", "-")}-${width}.png`,
          fullPage: true,
        });
      }
});
