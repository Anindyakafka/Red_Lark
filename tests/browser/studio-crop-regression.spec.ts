import { test, expect } from "@playwright/test";
import fs from "node:fs/promises";
import sharp from "sharp";
import { addElement, openOption, closeOptions } from "./studio-helpers";

test("crop is available immediately after selecting a vector at mobile width", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/en/workshop/?format=poster-placard");
  await expect(page.locator(".studio-paper")).toBeVisible();
  await addElement(page, "rectangle");
  await expect(page.locator(".canvas-controls").getByRole("button", { name: "Crop", exact: true })).toBeVisible();
  await closeOptions(page);
  await page.locator(".canvas-controls").getByRole("button", { name: "Crop", exact: true }).click();
  await page.getByText("Crop dimensions", { exact: true }).click();
  await page.getByLabel("Crop width (%)", { exact: true }).fill("50");
  await page.getByRole("button", { name: "Apply crop", exact: true }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("redlark.studio.v3") || "{}").layers?.at(-1)?.crop?.width)).toBeCloseTo(0.5);
  await page.getByRole("button", { name: "UNDO", exact: true }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("redlark.studio.v3") || "{}").layers?.at(-1)?.crop)).toBeUndefined();
  await page.getByRole("button", { name: "REDO", exact: true }).click();
  await openOption(page, "export");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: /SVG/ }).click();
  const svg = (await fs.readFile((await (await pending).path())!)).toString();
  expect(svg).toContain('data-crop="rectangle"');
});

test("an archive source keeps a whole-poster crop and individually editable layers", async ({ page }) => {
  await page.goto("/en/workshop/?format=poster-placard");
  await expect(page.locator(".studio-paper")).toBeVisible();
  await openOption(page, "images");
  await page.getByLabel("Find an element").fill("1c");
  await page.locator(".source-shelf button").first().click();
  await expect(page.getByRole("button", { name: "Edit this layer" })).toBeVisible();
  await page.locator("#studio-option-images").getByRole("button", { name: "Crop", exact: true }).click();
  await page.getByText("Crop dimensions", { exact: true }).click();
  await page.getByLabel("Crop width (%)", { exact: true }).fill("50");
  await page.getByRole("button", { name: "Apply crop", exact: true }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("redlark.studio.v3") || "{}").groups?.[0]?.crop?.width)).toBeCloseTo(0.5);
  await openOption(page, "layers");
  await page.locator(".layer-name", { hasText: "Image 1c" }).click();
  await expect(page.locator("#studio-option-layers").getByRole("button", { name: "Edit whole poster" })).toBeVisible();
});

test("keyboard crop opens with C and a locked layer explains why it cannot crop", async ({ page }) => {
  await page.goto("/en/workshop/?format=poster-placard");
  await expect(page.locator(".studio-paper")).toBeVisible();
  await addElement(page, "circle");
  await closeOptions(page);
  await page.keyboard.press("c");
  await expect(page.getByRole("region", { name: "Crop controls" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("region", { name: "Crop controls" })).toHaveCount(0);
  await openOption(page, "layers");
  await page.getByRole("button", { name: "Lock circle" }).click();
  await closeOptions(page);
  await expect(page.locator(".canvas-controls").getByRole("button", { name: "Crop" })).toBeDisabled();
  await page.keyboard.press("c");
  await expect(page.getByRole("status").filter({ hasText: "Unlock the layer to crop." })).toBeVisible();
});

test("touch dragging a vector crop handle changes its bounds", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  try {
    await page.goto("/en/workshop/?format=poster-placard");
    await expect(page.locator(".studio-paper")).toBeVisible();
    await addElement(page, "rectangle");
    await closeOptions(page);
    await page.locator(".canvas-controls").getByRole("button", { name: "Crop" }).click();
    await page.getByText("Crop dimensions", { exact: true }).click();
    await page.locator(".canvas-scroll").scrollIntoViewIfNeeded();
    const bounds = (await page.locator('[data-crop-handle="e"]').boundingBox())!;
    const start = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
    const cdp = await context.newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [start] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: start.x - 20, y: start.y }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect.poll(async () => Number(await page.getByLabel("Crop width (%)").inputValue())).toBeLessThan(100);
  } finally {
    await context.close();
  }
});

test("a cropped vector exports clipped 300-PPI PNG, SVG and PDF", async ({ page }) => {
  test.setTimeout(120000);
  await page.addInitScript(() => localStorage.setItem("redlark.studio.v3", JSON.stringify({ version: 3, preset: "A4", background: "#f3f0e6", colors: 2, layers: [] })));
  await page.goto("/en/workshop/?format=poster-placard");
  await expect(page.locator(".studio-paper")).toBeVisible();
  await openOption(page, "paper");
  await page.getByLabel("Paper preset").selectOption("A4");
  await addElement(page, "rectangle");
  await closeOptions(page);
  await page.locator(".canvas-controls").getByRole("button", { name: "Crop" }).click();
  await page.getByText("Crop dimensions", { exact: true }).click();
  await page.getByLabel("Crop width (%)").fill("40");
  await page.getByRole("button", { name: "Apply crop" }).click();
  for (const [label, format] of [["SVG", "svg"], ["PNG / 300 PPI", "png"], ["PDF", "pdf"]] as const) {
    await openOption(page, "export");
    const pending = page.waitForEvent("download");
    await page.getByRole("button", { name: new RegExp(`^${label.replace("/", "\\/")}`) }).click();
    const bytes = await fs.readFile((await (await pending).path())!);
    if (format === "svg") expect(bytes.toString()).toContain('data-crop="rectangle"');
    if (format === "png") {
      const result = await sharp(bytes).raw().toBuffer({ resolveWithObject: true });
      expect(result.info.width).toBe(2480);
      expect(result.info.height).toBe(3508);
      const rgb = await sharp(bytes).removeAlpha().raw().toBuffer({ resolveWithObject: true });
      const pixel = (x: number, y: number) => [...rgb.data.subarray((y * rgb.info.width + x) * 3, (y * rgb.info.width + x) * 3 + 3)];
      expect(pixel(300, 800)[0]).toBeGreaterThan(pixel(300, 800)[1] + 50);
      expect(pixel(700, 800)[0] - pixel(700, 800)[1]).toBeLessThan(30);
    }
    if (format === "pdf") expect(bytes.subarray(0, 4).toString()).toBe("%PDF");
  }
});
