import { openOption } from "./studio-helpers";
import { test, expect } from "@playwright/test";
import { freshScene } from "../../src/studio/model";
test("choose format before loading fonts, combine coded image/caption and export", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.goto("/en/workshop/");
  await expect(page.locator(".studio-format-picker button")).toHaveCount(10);
  expect(requests.some((url) => url.includes("full.ttf") || url.includes("shaping/"))).toBe(false);
  await page.getByRole("button", { name: "Poster/Placard", exact: true }).click();
  await expect(page.locator(".studio-paper")).toBeVisible();
  await openOption(page, "images");
  await page.getByLabel("Find an element").fill("1c");
  await page.locator(".source-shelf button").first().click();
  await expect(page.locator(".layer-name", { hasText: "Image 1c" })).toHaveCount(1);
  await openOption(page, "images");
  await page.getByLabel("Find an element").fill("2e");
  await page.locator(".caption-shelf button").first().click();
  await openOption(page, "text");
  await expect(page.getByLabel("Words", { exact: true })).toHaveValue("BORDERS\nARE LINES");
  const download = page.waitForEvent("download");
  await openOption(page, "export");
  await page.getByRole("button", { name: "Download for Free", exact: false }).click();
  expect((await download).suggestedFilename()).toMatch(/\.png$/);
});
test("native text shaping errors are recoverable and bad share links preserve existing drafts", async ({
  page,
}) => {
  const draft = JSON.stringify(freshScene());
  await page.addInitScript((value) => localStorage.setItem("redlark.studio.v2", value), draft);
  await page.goto("/en/workshop/?format=poster-placard#design=broken");
  await expect(page.locator("main [role=alert]")).toBeVisible();
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => localStorage.getItem("redlark.studio.v2"))).toBe(draft);
  await page.goto("/en/workshop/?format=poster-placard");
  await expect(page.locator(".studio-paper")).toBeVisible();
  await openOption(page, "text");
  await page.getByLabel("Words", { exact: true }).fill("ഒരുമിച്ച്");
  await openOption(page, "text");
  await expect(page.getByLabel("Words", { exact: true })).toHaveValue("ഒരുമിച്ച്");
  await openOption(page, "text");
  await page.getByLabel("Words", { exact: true }).fill("ഒരുമിച്ച് हिन्दी");
  await expect(page.locator("main [role=alert]")).toContainText("separate text layers");
  await expect(page.locator(".studio-paper")).toBeVisible();
  await openOption(page, "text");
  await expect(page.getByLabel("Words", { exact: true })).toHaveValue("ഒരുമിച്ച്");
});
