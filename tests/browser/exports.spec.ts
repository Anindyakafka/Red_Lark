import fs from "node:fs/promises";
import { test, expect } from "@playwright/test";
import { posters } from "../../src/lib/catalog";

test("PDF, 300-PPI PNG, A4 tiles and ink preview ZIP are real files", async ({ page }) => {
  test.setTimeout(120000);
  await page.goto("/studio/?format=poster-placard");
  await expect(page.locator(".studio-paper")).toBeVisible();
  await page.getByLabel("Paper preset").selectOption("A4");
  for (const [name, extension, signature] of [
    ["PDF ↓", ".pdf", "%PDF"],
    ["PNG / 300 PPI", ".png", "PNG"],
    ["A4 TILED PDF", ".pdf", "%PDF"],
    ["INK PREVIEWS ZIP", ".zip", "PK"],
  ]) {
    const waiting = page.waitForEvent("download");
    await page.getByRole("button", { name, exact: true }).click();
    const download = await waiting;
    expect(download.suggestedFilename()).toContain(extension);
    const file = await download.path();
    expect(file).not.toBeNull();
    const bytes = await fs.readFile(file!);
    expect(bytes.length).toBeGreaterThan(200);
    expect(bytes.subarray(0, 8).toString("latin1")).toContain(signature);
    if (extension === ".png") {
      expect(bytes.readUInt32BE(16)).toBe(2480);
      expect(bytes.readUInt32BE(20)).toBe(3508);
      const physical = bytes.indexOf("pHYs");
      expect(physical).toBeGreaterThan(0);
      expect(bytes.readUInt32BE(physical + 4)).toBe(11811);
    }
    await expect(page.locator(".studio-notice[role=status]")).toContainText("EXPORTED");
  }
});

test("uploads are locally re-encoded, metadata discarded, and cannot enter share links", async ({
  page,
}) => {
  const network: string[] = [];
  page.on("request", (r) => {
    if (r.method() === "POST") network.push(r.url());
  });
  await page.goto("/studio/?format=poster-placard");
  await expect(page.locator(".studio-paper")).toBeVisible();
  await page
    .getByLabel("Import a local image")
    .setInputFiles("public/posters/a-future-we-share/A3.png");
  await expect(page.locator(".studio-notice[role=status]")).toContainText("EXIF/GPS discarded");
  await page.waitForTimeout(650);
  const image = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem("redlark.studio.v2")!);
    return s.layers.find((l: { kind: string }) => l.kind === "image").image as string;
  });
  expect(image).toMatch(/^data:image\/png;base64,/);
  const bytes = Buffer.from(image.split(",")[1], "base64");
  expect(bytes.includes(Buffer.from("eXIf"))).toBe(false);
  expect(bytes.readUInt32BE(16)).toBeLessThanOrEqual(1800);
  expect(bytes.readUInt32BE(20)).toBeLessThanOrEqual(1800);
  await page.getByRole("button", { name: "[SHARE LINK]", exact: true }).click();
  await expect(page.locator("main [role=alert]")).toContainText("exclude uploaded images");
  expect(network).toEqual([]);
});

test("keyboard edit, lock, hide, reorder, remove and undo work", async ({ page }) => {
  await page.goto("/studio/?format=poster-placard");
  await expect(page.locator(".studio-paper")).toBeVisible();
  await page.getByRole("button", { name: "+ RECTANGLE", exact: true }).click();
  const x = page.getByLabel("x", { exact: true });
  await expect(x).toHaveValue("50");
  await page.locator(".canvas-scroll").focus();
  await page.keyboard.press("ArrowRight");
  await expect(x).toHaveValue("51");
  await page.getByRole("button", { name: "Lock rectangle", exact: true }).click();
  await expect(x).toBeDisabled();
  await page.locator(".canvas-scroll").focus();
  await page.keyboard.press("ArrowRight");
  await expect(x).toHaveValue("51");
  await page.getByRole("button", { name: "Unlock rectangle", exact: true }).click();
  await page.getByRole("button", { name: "Hide rectangle", exact: true }).click();
  await expect(page.getByRole("button", { name: "Show rectangle", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Show rectangle", exact: true }).click();
  await page.getByRole("button", { name: "Send rectangle back", exact: true }).click();
  await page.getByRole("button", { name: "[REMOVE LAYER]", exact: true }).click();
  await expect(page.getByRole("button", { name: "Lock rectangle", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "[UNDO]", exact: true }).click();
  await expect(page.getByRole("button", { name: "Lock rectangle", exact: true })).toBeVisible();
});

test("storage failure, font/network failure, unsupported browser and bad shared state are honest", async ({
  browser,
}) => {
  for (const state of ["storage", "font", "unsupported", "hash"] as const) {
    const context = await browser.newContext();
    const page = await context.newPage();
    if (state === "storage")
      await page.addInitScript(() =>
        Object.defineProperty(Storage.prototype, "setItem", {
          value: () => {
            throw new Error("blocked");
          },
        }),
      );
    if (state === "unsupported")
      await page.addInitScript(() =>
        Object.defineProperty(window, "PointerEvent", { value: undefined }),
      );
    if (state === "font") await page.route("**/fonts/*.ttf", (route) => route.abort());
    await page.goto(
      `http://localhost:3000/studio/?format=poster-placard${state === "hash" ? "#design=broken" : ""}`,
    );
    if (state === "storage") {
      await expect(page.locator(".studio-paper")).toBeVisible();
      await expect(page.getByText("[STORAGE UNAVAILABLE]", { exact: false })).toBeVisible();
    } else if (state === "hash") await expect(page.locator("main [role=alert]")).toBeVisible();
    else
      await expect(page.locator(".studio-loading")).toContainText(
        state === "font" ? "font" : "UNSUPPORTED",
      );
    await context.close();
  }
});

test("client navigation has no missing static segment files and focused controls clear mobile CTA", async ({
  page,
}) => {
  const failures: string[] = [];
  page.on("response", (r) => {
    if (r.status() >= 400) failures.push(r.url());
  });
  await page.goto(`/poster/${posters[0].slug}/`);
  await page.getByRole("link", { name: "Collection", exact: true }).first().click();
  await expect(page).toHaveURL(/collection/);
  await expect(page.locator(".poster-grid")).toBeVisible();
  expect(failures).toEqual([]);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByLabel("SEARCH THE ARCHIVE").focus();
  const rect = await page.getByLabel("SEARCH THE ARCHIVE").boundingBox();
  const bar = await page.locator(".mobile-cta").boundingBox();
  expect(rect!.y + rect!.height).toBeLessThanOrEqual(bar!.y);
});
