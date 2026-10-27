import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const id = "12345678-1234-1234-1234-123456789012";
const work = {
  id,
  title: "Staff review fixture",
  artist_name: "Test artist",
  alt: "",
  status: "pending",
  publication_state: "private",
  licence_id: "CC-BY-SA-4.0",
  format_slug: "poster-placard",
  tags: [],
  work_tags: [],
  work_categories: [],
  work_files: [],
  ai_use: "none",
  languages: ["English"],
};
async function staff(page: Page) {
  await page.route("**/api/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/session")
      return route.fulfill({
        json: { csrf: "fixture", account: { admin: true, aal2: true, fresh: true } },
      });
    if (path === "/api/admin/queue") return route.fulfill({ json: { works: [work] } });
    if (path === "/api/auth/mfa/factors")
      return route.fulfill({ json: { factors: [{ id: "factor", status: "verified" }] } });
    return route.fulfill({ json: { ok: true } });
  });
}
test("admin can find an approved work and save its editorial metadata", async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await staff(page);
  const approved = { ...work, status: "approved", publication_state: "published" };
  await page.route("**/api/admin/queue", (route) => route.fulfill({ json: { works: [approved] } }));
  let submitted: Record<string, unknown> | null = null;
  await page.route("**/api/admin/metadata", (route) => {
    submitted = route.request().postDataJSON();
    return route.fulfill({ json: { ok: true, rebuilding: true } });
  });
  await page.goto("/en/admin/review/?status=approved");
  await expect(page.getByLabel("Filter by status")).toHaveValue("approved");
  await page.getByRole("link", { name: work.title, exact: true }).click();
  await expect(page.getByRole("button", { name: "Save metadata" })).toBeVisible();
  await expect(page.getByText("Published changes appear after the archive rebuild.")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: info.outputPath("approved-metadata-mobile.png"), fullPage: true });
  await page.getByLabel("Title", { exact: true }).fill("Edited public title");
  await page.getByRole("button", { name: "Save metadata" }).click();
  await expect(page.getByText("Metadata saved. Archive rebuild requested.")).toBeVisible();
  expect(submitted).toMatchObject({
    id,
    title: "Edited public title",
    format_slug: "poster-placard",
  });
});
test("review preserves entered feedback across expired MFA and safely retries after verification", async ({
  page,
}, info) => {
  await staff(page);
  let saved = 0;
  await page.route("**/api/admin/review", (route) =>
    ++saved === 1
      ? route.fulfill({ status: 403, json: { error: "fresh_mfa_required" } })
      : route.fulfill({ json: { ok: true } }),
  );
  await page.goto(`/en/admin/review/${id}/`);
  await page
    .getByRole("combobox", { name: "Decision", exact: true })
    .selectOption("changes_requested");
  await page
    .getByLabel("Reason (required except for approval)", { exact: true })
    .fill("Please add the source credit before publication.");
  await page.getByRole("button", { name: "Save decision", exact: true }).click();
  await expect(
    page.getByText(
      "Your review is still here. Verify an authenticator code below, then save again.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByLabel("Reason (required except for approval)", { exact: true }),
  ).toHaveValue("Please add the source credit before publication.");
  await page.screenshot({ path: info.outputPath("review-reauth.png"), fullPage: true });
  await page.getByLabel("Authenticator code", { exact: true }).fill("123456");
  await page.getByRole("button", { name: "Verify code", exact: true }).click();
  await expect(page.getByLabel("Verify your session", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Save decision", exact: true }).click();
  await expect(page.getByText(/Review saved\. Approved publication/)).toBeVisible();
  expect(saved).toBe(2);
});
test("review retries one rejected CSRF token and explains stale status without losing feedback", async ({
  page,
}) => {
  await staff(page);
  let attempts = 0;
  await page.route("**/api/admin/review", (route) =>
    ++attempts === 1
      ? route.fulfill({ status: 403, json: { error: "request_rejected" } })
      : route.fulfill({ status: 409, json: { error: "invalid_transition" } }),
  );
  await page.goto(`/en/admin/review/${id}/`);
  await page
    .getByLabel("Reason (required except for approval)", { exact: true })
    .fill("Review text remains here.");
  await page.getByRole("button", { name: "Save decision", exact: true }).click();
  await expect(page.getByText(/This artwork has already changed status/)).toBeVisible();
  expect(attempts).toBe(2);
  await expect(
    page.getByLabel("Reason (required except for approval)", { exact: true }),
  ).toHaveValue("Review text remains here.");
});
for (const locale of ["en", "hi", "bn", "ml"])
  for (const width of [390, 1440])
    test(`audit collapsed table filters and accessibility ${locale} ${width}`, async ({
      page,
    }, info) => {
      await page.setViewportSize({ width, height: 1000 });
      await staff(page);
      let submitted: Record<string, unknown> = {};
      await page.route("**/api/admin/audit", (route) => {
        submitted = route.request().postDataJSON();
        return route.fulfill({
          json: {
            audit: [
              {
                id: 1,
                action: "works:UPDATE",
                created_at: "2026-10-21T09:00:00Z",
                actor_id: "fixture",
                detail: { table: "works" },
              },
            ],
            total: 101,
            offset: submitted.offset || 0,
          },
        });
      });
      await page.goto(`/${locale}/admin/audit/`);
      await expect(page.locator(".audit-table details")).toHaveCount(1);
      await expect(page.locator(".audit-table details[open]")).toHaveCount(0);
      await page.locator(".audit-table summary").click();
      await expect(page.locator(".audit-table details[open]")).toHaveCount(1);
      await page.locator('input[name="start"]').fill("2026-10-20T10:00");
      await page.locator('input[name="end"]').fill("2026-10-21T11:00");
      await page.locator('input[name="action"]').fill("works:UPDATE");
      await page
        .locator(".audit-filters button[type=submit], .audit-filters button:not([type])")
        .click();
      await expect.poll(() => submitted.start).toBe("2026-10-20T10:00:00Z");
      expect(submitted.end).toBe("2026-10-21T11:00:59.999Z");
      expect(submitted.action).toBe("works:UPDATE");
      await page.locator(".audit-table summary").click();
      await expect(page.locator(".audit-table details[open]")).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
            .analyze()
        ).violations,
      ).toEqual([]);
      await page.screenshot({ path: info.outputPath("audit.png"), fullPage: true });
    });
