import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { posters, artists, themes, slugify } from "../../src/lib/catalog";
const paths = [
  "/",
  "/collection/",
  "/discover/",
  "/artists/",
  "/themes/",
  "/studio/",
  "/community/",
  "/submit/",
  "/about/",
  "/contact/",
  "/privacy/",
  "/terms/",
  "/thank-you/",
  "/404/",
  "/search/image/",
  ...posters.map((p) => `/poster/${p.slug}/`),
  ...artists.map((a) => `/artist/${a.id}/`),
  ...themes.map((t) => `/theme/${slugify(t)}/`),
];
for (const path of paths)
  test(`route + axe: ${path}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const r = await page.goto(path);
    expect(r?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await page.evaluate(() => document.fonts.ready);
    if (path === "/studio/") await expect(page.locator(".studio-paper")).toBeVisible();
    const a = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      a.violations.map((v) => ({
        id: v.id,
        description: v.description,
        nodes: v.nodes.map((n) => n.target),
      })),
    ).toEqual([]);
    expect(errors).toEqual([]);
  });
test("all specified breakpoints have no horizontal document overflow", async ({ page }) => {
  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const path of [
      "/",
      "/collection/",
      `/poster/${posters[0].slug}/`,
      "/studio/",
      "/privacy/",
      "/submit/",
      "/404/",
    ]) {
      await page.goto(path);
      if (path === "/studio/") await expect(page.locator(".studio-paper")).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        `${path} at ${width}`,
      ).toBe(true);
    }
  }
});
test("filters/search/count/save are real and search errors are accessible", async ({ page }) => {
  await page.goto("/collection/");
  await page.getByLabel("Category", { exact: true }).selectOption("displacement-and-migration");
  await expect(page.locator(".poster-card")).toHaveCount(5);
  await page.getByLabel("SEARCH THE ARCHIVE").fill("homes");
  await page.getByRole("button", { name: "[SEARCH]" }).click();
  await expect(page.locator(".poster-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Save Homes for all", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Unsave Homes for all", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByLabel("SEARCH THE ARCHIVE").fill("a".repeat(151));
  await page.getByRole("button", { name: "[SEARCH]" }).click();
  await expect(page.locator("main [role=alert]")).toContainText("150");
});
test("forms expose required/reply errors and honest email handoff", async ({ page }) => {
  for (const route of ["/contact/", "/submit/"]) {
    await page.goto(route);
    await page.getByRole("button", { name: "[PREPARE EMAIL]" }).click();
    await expect(page.locator("main [role=alert]")).toContainText("field");
    await expect(page.locator('[aria-invalid="true"]').first()).toBeVisible();
    await page
      .getByLabel(route === "/contact/" ? "YOUR MESSAGE" : "TELL US ABOUT THE WORK", {
        exact: false,
      })
      .fill("A meaningful message for the archive.");
    await page.getByLabel("REPLY EMAIL").fill("wrong");
    if (route === "/submit/") {
      await page.getByLabel("ARTWORK / SOURCE LINK").fill("https://example.org/original");
      await page.getByLabel("LICENCE + ARTIST CREDIT").fill("CC0 / original author");
      await page.getByRole("checkbox").check();
    }
    await page.getByRole("button", { name: "[PREPARE EMAIL]" }).click();
    await expect(page.locator("#reply-error")).toBeVisible();
    await page.getByLabel("REPLY EMAIL").fill("");
    await page.getByRole("button", { name: "[PREPARE EMAIL]" }).click();
    await expect(page).toHaveURL(/thank-you/);
    await expect(page.locator("main")).toContainText("email");
  }
});
test("ND gate renders no remix and links to artist", async ({ page }) => {
  await page.goto("/__qa/license-gate/");
  await expect(page.getByText("This licence forbids derivatives.")).toBeVisible();
  await expect(page.getByRole("link", { name: /REMIX/ })).toHaveCount(0);
  await expect(page.locator('a[href*="/studio"]')).toHaveCount(0);
  await expect(page.getByRole("link", { name: /artist/ })).toBeVisible();
});
test("Studio add text, colour, lock, undo, export, share and local restore", async ({ page }) => {
  await page.goto("/studio/");
  await expect(page.locator(".studio-paper")).toBeVisible();
  await page.getByRole("button", { name: "+ TEXT", exact: true }).click();
  await page.getByLabel("Words", { exact: true }).fill("TEST THE PRINT");
  await page.getByLabel("Ink colour", { exact: true }).fill("#151515");
  await expect(page.getByLabel("Ink colour", { exact: true })).toHaveValue("#151515");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "SVG ↓", exact: true }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/\.svg$/);
  await expect(page.getByRole("status")).toContainText("EXPORTED SVG");
  await page.waitForTimeout(700);
  await page.reload();
  await expect(page.locator(".studio-paper")).toBeVisible();
  await expect(page.getByRole("status")).toContainText("RESTORED");
  await page.getByRole("button", { name: "[SHARE LINK]", exact: true }).click();
  await expect(page.locator(".share-input")).toHaveValue(/#design=/);
});
test("remix loads the chosen base and retains source credits", async ({ page }) => {
  await page.goto(`/studio/?remix=${posters[0].slug}`);
  await expect(page.locator(".studio-paper")).toBeVisible();
  await expect(page.getByRole("status")).toContainText("REMIX READY");
  await expect(page.locator(".studio-paper metadata")).toContainText(posters[0].title);
});
test("mobile browse CTA hidden in Studio; tools and exports are reachable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/collection/");
  await expect(page.locator(".mobile-cta")).toBeVisible();
  await page.goto("/studio/");
  await expect(page.locator(".studio-paper")).toBeVisible();
  await expect(page.locator(".mobile-cta")).toHaveCount(0);
  await page.getByRole("button", { name: "[ELEMENTS]", exact: true }).click();
  await page.getByRole("button", { name: "+ TEXT", exact: true }).click();
  await expect(page.getByLabel("Words", { exact: true })).toBeVisible();
});
test("unknown URL uses custom 404 with search; metadata and security endpoints exist", async ({
  page,
  request,
}) => {
  const r = await page.goto("/missing-page/");
  expect(r?.status()).toBe(404);
  await expect(page.getByLabel("SEARCH THE COLLECTION")).toBeVisible();
  for (const file of ["/robots.txt", "/sitemap.xml", "/site.webmanifest", "/favicon.ico"]) {
    expect((await request.get(file)).status()).toBe(200);
  }
  const response = await request.get("/");
  expect(response.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(response.headers()["permissions-policy"]).toContain("geolocation=()");
});
