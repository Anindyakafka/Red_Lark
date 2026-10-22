import { openOption, addElement } from "./studio-helpers";
import { test, expect } from "@playwright/test";
import { posters, artists } from "../../src/lib/catalog";
import categories from "../../content/categories.json" with { type: "json" };
test("fresh-eyes clickthrough of poster, artist and category indexes", async ({ page }) => {
  test.setTimeout(120000);
  for (const p of posters) {
    await page.goto("/collection/");
    await page.locator(`.card-title-row a[href="/en/poster/${p.slug}/"]`).click();
    await expect(page).toHaveURL(new RegExp(`/poster/${p.slug}/`));
    await expect(page.locator(".downloads")).toBeVisible();
    await expect(page.getByRole("link", { name: /REMIX IN STUDIO/ })).toBeVisible();
  }
  for (const a of artists) {
    await page.goto("/artists/");
    await page.locator(`.index-card a[href="/en/artist/${a.id}/"]`).click();
    await expect(page).toHaveURL(new RegExp(`/artist/${a.id}/`));
  }
  for (const category of categories) {
    await page.goto("/categories/");
    await page.locator(`.category-grid a[href="/en/category/${category.slug}/"]`).click();
    await expect(page).toHaveURL(new RegExp(`/category/${category.slug}/`));
    await expect(page.locator(".poster-card")).toHaveCount(
      posters.filter((p) => p.categories.includes(category.slug)).length,
    );
  }
});
test("fresh-eyes form focus and true empty Studio recovery", async ({ page }) => {
  await page.goto("/login/");
  await page.getByRole("button", { name: "Email me a sign-in link", exact: true }).click();
  await expect(page.locator("#auth-email")).toBeFocused();
  await page.goto("/contact/");
  await openOption(page, "layers");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.locator("#message")).toBeFocused();
  await page.goto("/studio/?format=poster-placard");
  await expect(page.locator(".studio-paper")).toBeVisible();
  await page.evaluate(() => {
    const raw = JSON.parse(
      localStorage.getItem("redlark.studio.v2") ??
        '{"version":2,"preset":"A3","background":"#f3f0e6","colors":2,"layers":[]}',
    );
    raw.layers = [];
    localStorage.setItem("redlark.studio.v2", JSON.stringify(raw));
  });
  await page.reload();
  await expect(page.getByText("EMPTY CANVAS", { exact: false })).toBeVisible();
  await addElement(page, "text");
  await openOption(page, "text");
  await expect(page.getByLabel("Words", { exact: true })).toBeVisible();
});
test("curation is empty honestly and font bundle is a real download", async ({ page }) => {
  await page.goto("/community/");
  await expect(page.getByText("NO REVIEWED SUBMISSIONS YET", { exact: true })).toBeVisible();
  await page.goto("/discover/");
  const waiting = page.waitForEvent("download");
  await page.getByRole("link", { name: /DOWNLOAD FONT PACK/ }).click();
  expect((await waiting).suggestedFilename()).toBe("redlark-type-kit.zip");
});
test("single-ink mode remains single-ink after custom colour and shelf additions", async ({
  page,
}) => {
  await page.goto("/studio/?format=poster-placard");
  await expect(page.locator(".studio-paper")).toBeVisible();
  await openOption(page, "color");
  await page.getByLabel("Print mode").selectOption("1");
  await openOption(page, "color");
  await page.getByLabel("Ink colour", { exact: true }).fill("#354c44");
  await addElement(page, "rectangle");
  await openOption(page, "color");
  await expect(page.getByLabel("Separation preview").locator("option")).toHaveCount(2);
});
