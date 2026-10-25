import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs";
import AxeBuilder from "@axe-core/playwright";
const hindi = JSON.parse(fs.readFileSync("messages/hi.json", "utf8")) as {
  strings: Record<string, string>;
};
const fixture = {
  id: "12345678-1234-1234-1234-123456789012",
  title: "Upload repair fixture",
  artist_name: "Test contributor",
  alt: "",
  status: "pending",
  licence_id: "CC-BY-SA-4.0",
  format_slug: "poster-placard",
  tags: ["Local solidarity"],
  work_tags: [{ tags: { label: "Local solidarity", custom: true } }],
  work_files: [
    {
      id: "99999999-1234-1234-1234-123456789012",
      kind: "preview",
      mime: "image/png",
      bytes: 100,
      dpi: 300,
    },
  ],
  work_categories: [
    { category_slug: "workers" },
    { category_slug: "anti-fascism" },
    { category_slug: "farmers" },
  ],
  feedback: "",
  ai_use: "none",
  ai_disclosure: "",
  consent_contact: "",
  consent_upi: "",
  languages: ["English"],
};
async function logged(page: Page, admin = false) {
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.startsWith("/api/preview/"))
      return route.fulfill({
        contentType: "image/png",
        body: fs.readFileSync("public/icons/icon-512.png"),
      });
    if (path === "/api/session")
      return route.fulfill({
        json: { csrf: "fixture", account: { admin, aal2: true, fresh: true, pendingCount: 1 } },
      });
    if (path === "/api/account")
      return route.fulfill({ json: { profile: null, works: [fixture] } });
    if (path === "/api/admin/queue") return route.fulfill({ json: { works: [fixture] } });
    return route.fulfill({ json: { ok: true, factors: [] } });
  });
}
test.afterEach(async ({ page }, info) => {
  const dir = `docs/evidence/upload-repair/${process.env.QA_REPRO === "1" ? "before" : "after"}`;
  fs.mkdirSync(dir, { recursive: true });
  await page.screenshot({
    path: `${dir}/${info.title.replace(/[^a-z0-9]+/gi, "-")}.png`,
    fullPage: true,
  });
});
test("1 optional image description has help and a 300 character counter", async ({ page }) => {
  await logged(page);
  await page.goto("/en/account/works/new/");
  await page.locator(".format-picker button").nth(6).click();
  const alt = page.getByLabel("Describe the image (optional)", { exact: true });
  await expect(alt).not.toHaveAttribute("required", "");
  await expect(alt).toHaveAttribute("maxlength", "300");
  await expect(page.getByText("0 / 300", { exact: true })).toBeVisible();
});
test("2 tags provide a combobox and commit Enter without submitting", async ({ page }) => {
  await logged(page);
  await page.goto("/en/account/works/new/");
  await page.locator(".format-picker button").nth(6).click();
  const tags = page.getByRole("combobox", { name: "Tags", exact: true });
  await tags.fill("Local solidarity");
  await tags.press("Enter");
  await expect(
    page.getByRole("button", { name: "Remove tag Local solidarity", exact: true }),
  ).toBeVisible();
  await expect(page.locator("#upload-file")).toBeVisible();
});
test("3 licence cards preselect share and remix and prevent CC0 NC", async ({ page }) => {
  await logged(page);
  await page.goto("/en/account/works/new/");
  await page.locator(".format-picker button").nth(6).click();
  await expect(
    page.getByRole("radio", {
      name: "Share it and let others remix it, as long as remixes stay open too. Recommended.",
      exact: true,
    }),
  ).toBeChecked();
  await page
    .getByRole("radio", { name: "Anyone can use it for anything, no credit needed.", exact: true })
    .check();
  await expect(
    page.getByLabel("Only for non-commercial use (nobody can sell it)", { exact: true }),
  ).toBeDisabled();
});
test("4 categories support searchable multiple checkboxes and survive errors", async ({ page }) => {
  await logged(page);
  await page.goto("/en/account/works/new/");
  await page.locator(".format-picker button").nth(6).click();
  await page.getByLabel("Search categories", { exact: true }).fill("Workers");
  await page.getByRole("checkbox", { name: "Workers", exact: true }).check();
  await expect(
    page.getByRole("button", { name: "Remove category Workers", exact: true }),
  ).toBeVisible();
  await page.locator("form button.accent").click();
  await expect(page.getByRole("checkbox", { name: "Workers", exact: true })).toBeChecked();
});
test("5 admin review queue is directly reachable", async ({ page }) => {
  await logged(page, true);
  expect((await page.goto("/en/admin/review/"))?.status()).toBe(200);
  await expect(page.getByRole("button", { name: "Save metadata", exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Review contribution", exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Upload repair fixture", exact: true }),
  ).toBeVisible();
});

test("tags support suggestions, comma, blur, Backspace, limits and error retention", async ({
  page,
}) => {
  await logged(page);
  await page.goto("/en/account/works/new/");
  await page.locator(".format-picker button").nth(6).click();
  const input = page.getByRole("combobox", { name: "Tags", exact: true });
  await input.fill("pro");
  await input.press("ArrowDown");
  await input.press("Enter");
  await expect(page.getByRole("button", { name: "Remove tag Protest", exact: true })).toHaveCount(
    1,
  );
  await input.fill("PROTEST");
  await input.press(",");
  await expect(page.getByRole("button", { name: "Remove tag Protest", exact: true })).toHaveCount(
    1,
  );
  await input.fill("Local solidarity");
  await input.press(",");
  await input.fill("History");
  await input.press("Tab");
  await expect(page.getByRole("button", { name: "Remove tag History", exact: true })).toBeVisible();
  await input.focus();
  await input.press("Backspace");
  await expect(page.getByRole("button", { name: "Remove tag History", exact: true })).toHaveCount(
    0,
  );
  await page.getByRole("button", { name: "Remove tag Local solidarity", exact: true }).click();
  await input.fill("x".repeat(31));
  await input.press("Enter");
  await expect(
    page.getByText("Keep each tag to 30 characters or fewer.", { exact: true }),
  ).toBeVisible();
  await input.fill("");
  for (let i = 0; i < 9; i++) {
    await input.fill(`Local ${i}`);
    await input.press("Enter");
  }
  await input.fill("One too many");
  await input.press("Enter");
  await expect(page.getByText("Choose up to 10 tags.", { exact: true })).toBeVisible();
  await input.fill("");
  await page.locator("form button.accent").click();
  await expect(page.getByRole("button", { name: "Remove tag Protest", exact: true })).toBeVisible();
  await expect(page.locator("input[name=tags]")).toHaveCount(10);
});

test("untouched recommended licence and blank description submit with all selected facets", async ({
  page,
}) => {
  await logged(page);
  await page.route("**/api/account/work", async (route) => {
    const data = route.request().postDataJSON();
    expect(data.licence_id).toBe("CC-BY-SA-4.0");
    expect(data.alt).toBe("");
    expect(data.tags).toEqual(["Protest", "Local solidarity"]);
    expect(data.categories).toEqual(["workers", "farmers", "anti-war"]);
    await route.fulfill({ json: { id: fixture.id } });
  });
  await page.route("**/api/upload/sign", (route) =>
    route.fulfill({ json: { id: fixture.id, url: "http://localhost:3000/__fixture/upload" } }),
  );
  await page.route("**/__fixture/upload", (route) => route.fulfill({ status: 200 }));
  await page.route("**/api/upload/complete", (route) =>
    route.fulfill({ json: { dpiA4: 20, dpiA2: 10, warning: "low_resolution" } }),
  );
  await page.route("**/api/account/submit", (route) =>
    route.fulfill({ json: { ok: true, mailPending: true } }),
  );
  await page.goto("/en/account/works/new/");
  await page.locator(".format-picker button").nth(6).click();
  await page.locator("#upload-title").fill("Original fixture");
  for (const slug of ["Workers", "Farmers", "Anti-War"]) {
    await page.getByLabel("Search categories", { exact: true }).fill(slug);
    await page.locator(".category-options input[type=checkbox]").check();
  }
  const tags = page.getByRole("combobox", { name: "Tags", exact: true });
  await tags.fill("Protest");
  await tags.press("Enter");
  await tags.fill("Local solidarity");
  await tags.press("Tab");
  await page.locator("#upload-file").setInputFiles({
    name: "fixture.png",
    mimeType: "image/png",
    buffer: fs.readFileSync("public/icons/icon-16.png"),
  });
  await page.locator("input[name=permission]").check();
  await page.locator("form button.accent").click();
  await expect(
    page.getByRole("heading", { name: "Submission saved for review.", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("You chose: Share and remix, keep it open", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/Email delivery is pending/)).toBeVisible();
});

test("fresh MFA verification opens the review queue without a manual reload", async ({ page }) => {
  await logged(page, true);
  let fresh = false;
  await page.route("**/api/session", (route) =>
    route.fulfill({
      json: {
        csrf: "fixture",
        account: { admin: true, fresh, aal2: fresh, pendingCount: fresh ? 1 : null },
      },
    }),
  );
  await page.route("**/api/auth/mfa/factors", (route) =>
    route.fulfill({ json: { factors: [{ id: fixture.id, status: "verified" }] } }),
  );
  await page.route("**/api/auth/mfa/verify", (route) => {
    fresh = true;
    return route.fulfill({ json: { ok: true } });
  });
  await page.goto("/en/admin/review/");
  await page.locator("#mfa-code").fill("123456");
  await page.getByRole("button", { name: "Verify code", exact: true }).click();
  await expect(page.getByRole("heading", { name: fixture.title, exact: true })).toBeVisible();
  await expect(page.locator("#mfa-code")).toHaveCount(0);
});

test("review actions match the work status and keep earlier feedback visible", async ({ page }) => {
  await logged(page, true);
  await page.route("**/api/admin/queue", (route) =>
    route.fulfill({
      json: {
        works: [
          {
            ...fixture,
            status: "approved",
            publication_state: "published",
            feedback: "Approved after checking the source.",
          },
        ],
      },
    }),
  );
  await page.goto(`/en/admin/review/${fixture.id}/`);
  await expect(page.locator(`#review-action-${fixture.id} option`)).toHaveCount(1);
  await expect(page.locator(`#review-action-${fixture.id}`)).toHaveValue("taken_down");
  await expect(
    page.getByText("Review feedback: Approved after checking the source.", { exact: true }),
  ).toBeVisible();
});

for (const locale of ["en", "hi"] as const)
  for (const width of [390, 1440]) {
    const t = (s: string) =>
      locale === "hi" ? (hindi.strings as Record<string, string>)[s] || s : s;
    test(`localized contribution fields and axe ${locale} ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await logged(page);
  await page.goto(`/${locale}/account/works/new/`);
      await page.locator(".format-picker button").nth(6).click();
      await expect(
        page.getByLabel(t("Describe the image (optional)"), { exact: true }),
      ).toBeVisible();
      await page.getByLabel(t("Search categories"), { exact: true }).fill("Workers");
      await page.locator(".category-options input[type=checkbox]").check();
      await page.getByLabel(t("Search categories"), { exact: true }).fill("Farmers");
      await page.locator(".category-options input[type=checkbox]").check();
      await page.getByLabel(t("Search categories"), { exact: true }).fill("Anti-War");
      await page.locator(".category-options input[type=checkbox]").check();
      await expect(page.locator("input[name=categories]")).toHaveCount(3);
      const input = page.getByRole("combobox", { name: t("Tags"), exact: true });
      await input.fill("Solidarity");
      await input.press("Enter");
      await input.press("Escape");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      expect(
        (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze())
          .violations,
      ).toEqual([]);
      await input.focus();
      expect(
        (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze())
          .violations,
      ).toEqual([]);
    });
    test(`localized admin fields and axe ${locale} ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await logged(page, true);
      await page.route("**/api/admin/metadata", (route) => {
        const data = route.request().postDataJSON();
        expect(data.alt).toBe("A red hand on white paper.");
        expect(data.tags).toEqual(["Local solidarity"]);
        expect(data.categories).toHaveLength(3);
        return route.fulfill({ json: { ok: true } });
      });
      await page.goto(`/${locale}/admin/review/${fixture.id}/`);
      await expect(page.getByRole("heading", { name: fixture.title, exact: true })).toBeVisible();
      await expect(page.locator("header a.admin-link")).toHaveAttribute(
        "href",
        `/${locale}/admin/review/`,
      );
      await expect(
        page.getByText(t("Fallback description in use:"), { exact: false }),
      ).toBeVisible();
      await page
        .getByLabel(t("Describe the image (optional)"), { exact: true })
        .fill("A red hand on white paper.");
      await page.getByRole("button", { name: t("Save metadata"), exact: true }).click();
      await expect(page.getByText(t("Metadata saved."), { exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      expect(
        (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze())
          .violations,
      ).toEqual([]);
    });
  }
