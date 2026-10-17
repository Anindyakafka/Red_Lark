import { test, expect } from "@playwright/test";
import { freshScene } from "../../src/studio/model";
test("choose format before loading fonts, combine coded image/caption and export", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.goto("/en/studio/");
  await expect(page.locator(".studio-format-picker button")).toHaveCount(10);
  expect(requests.some((url) => url.includes("full.ttf") || url.includes("shaping/"))).toBe(false);
  await page.getByRole("button", { name: "Poster/Placard", exact: true }).click();
  await expect(page.locator(".studio-paper")).toBeVisible();
  await page.getByLabel("Find an element").fill("1a");
  await page.locator(".source-shelf button").first().click();
  await expect(page.locator(".layer-name", { hasText: "Image 1a" })).toHaveCount(1);
  await page.getByLabel("Find an element").fill("2c");
  await page.locator(".caption-shelf button").first().click();
  await expect(page.getByLabel("Words", { exact: true })).toHaveValue("A FUTURE\nWE SHARE");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download for Free", exact: false }).click();
  expect((await download).suggestedFilename()).toMatch(/\.png$/);
});
test("native text shaping errors are recoverable and bad share links preserve existing drafts", async ({
  page,
}) => {
  const draft = JSON.stringify(freshScene());
  await page.addInitScript((value) => localStorage.setItem("redlark.studio.v2", value), draft);
  await page.goto("/en/studio/?format=poster-placard#design=broken");
  await expect(page.locator("main [role=alert]")).toBeVisible();
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => localStorage.getItem("redlark.studio.v2"))).toBe(draft);
  await page.goto("/en/studio/?format=poster-placard");
  await expect(page.locator(".studio-paper")).toBeVisible();
  await page.getByLabel("Words", { exact: true }).fill("ഒരുമിച്ച്");
  await expect(page.getByLabel("Words", { exact: true })).toHaveValue("ഒരുമിച്ച്");
  await page.getByLabel("Words", { exact: true }).fill("ഒരുമിച്ച് हिन्दी");
  await expect(page.locator("main [role=alert]")).toContainText("separate text layers");
  await expect(page.locator(".studio-paper")).toBeVisible();
  await expect(page.getByLabel("Words", { exact: true })).toHaveValue("ഒരുമിച്ച്");
});
