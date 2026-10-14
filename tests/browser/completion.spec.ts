import fs from "node:fs/promises";
import { test, expect } from "@playwright/test";
import { posters } from "../../src/lib/catalog";
test("all paper presets declare the right PDF boxes; A2 PNG dimensions are high resolution", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.goto("/studio/");
  await expect(page.locator(".studio-paper")).toBeVisible();
  for (const [preset, width, height] of [
    ["A4", 210, 297],
    ["A3", 297, 420],
    ["A2", 420, 594],
    ["18x24", 457.2, 609.6],
  ]) {
    await page.getByLabel("Paper preset").selectOption(String(preset));
    const waiting = page.waitForEvent("download");
    await page.getByRole("button", { name: "PDF ↓", exact: true }).click();
    const download = await waiting;
    const bytes = await fs.readFile((await download.path())!);
    const box = bytes.toString("latin1").match(/\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)/);
    expect(box).not.toBeNull();
    expect(Number(box![1])).toBeCloseTo((Number(width) / 25.4) * 72, 1);
    expect(Number(box![2])).toBeCloseTo((Number(height) / 25.4) * 72, 1);
  }
  await page.getByLabel("Paper preset").selectOption("A2");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "PNG / 300 PPI", exact: true }).click();
  const output = await pending;
  const bytes = await fs.readFile((await output.path())!);
  expect(bytes.readUInt32BE(16)).toBe(4961);
  expect(bytes.readUInt32BE(20)).toBe(7016);
});
test("touch pinch changes zoom and mobile controls stay usable", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.goto("http://localhost:3000/studio/");
  await expect(page.locator(".studio-paper")).toBeVisible();
  await page.locator(".studio-paper").scrollIntoViewIfNeeded();
  const box = await page.locator(".studio-paper").boundingBox();
  const cdp = await context.newCDPSession(page);
  const x = box!.x + box!.width / 2,
    y = Math.max(100, box!.y + 80);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { x: x - 30, y },
      { x: x + 30, y },
    ],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [
      { x: x - 55, y },
      { x: x + 55, y },
    ],
  });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect(page.locator(".paper-wrap")).not.toHaveAttribute("style", /width: 100%/);
  await page.getByRole("button", { name: "[ELEMENTS]", exact: true }).click();
  await page.getByRole("button", { name: "+ RECTANGLE", exact: true }).click();
  await expect(page.getByLabel("width", { exact: true })).toBeVisible();
  await context.close();
});
test("bad remix source, print modes and shared source credits are handled", async ({ page }) => {
  await page.goto("/studio/?remix=missing-source");
  await expect(page.locator("main [role=alert]")).toContainText("REMIX BLOCKED");
  await page.getByRole("button", { name: "[START FRESH]", exact: true }).click();
  await expect(page.locator(".studio-paper")).toBeVisible();
  await page.getByLabel("Print mode").selectOption("1");
  await expect(page.getByLabel("Separation preview").locator("option")).toHaveCount(2);
  await page.getByLabel("Separation preview").selectOption({ index: 1 });
  await expect(page.locator(".studio-paper metadata")).toContainText("USER ADDITIONS");
  await page.goto(`/studio/?remix=${posters[0].slug}`);
  await expect(page.locator(".studio-paper")).toBeVisible();
  await page.getByRole("button", { name: "[SHARE LINK]", exact: true }).click();
  const link = await page.locator(".share-input").inputValue();
  const other = await page.context().newPage();
  await other.goto(link);
  await expect(other.locator(".studio-paper metadata")).toContainText(posters[0].title);
  await expect(other.locator(".studio-notice[role=status]")).toContainText("SHARED DESIGN");
});
