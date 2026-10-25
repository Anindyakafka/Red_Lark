import fs from "node:fs/promises";
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { openOption, closeOptions, addElement } from "./studio-helpers";
import { installShareAlikeFixture } from "./studio-license-fixture";
test.beforeEach(async ({ page }) => {
  await page.route("**/api/session", (route) =>
    route.fulfill({ json: { csrf: "fixture", account: null } }),
  );
});

test("ShareAlike remix keeps a clean canvas and configurable default-on attribution in every export", async ({
  page,
}) => {
  test.setTimeout(120000);
  const replacements = await installShareAlikeFixture(page);
  await page.goto("/en/workshop/?remix=borders-are-lines");
  await expect(page.locator(".studio-paper")).toBeVisible();
  expect(replacements()).toBeGreaterThan(0);
  await expect(page.locator(".studio-paper metadata")).toContainText("CC-BY-SA-4.0");
  await expect(page.locator(".studio-paper [data-export-credit]")).toHaveCount(0);
  await openOption(page, "export");
  const credit = page.getByLabel("Add credit line", { exact: true });
  await expect(credit).toBeChecked();
  await credit.uncheck();
  await expect(page.getByText(/Metadata can be lost when printing or reposting/)).toBeVisible();
  for (const name of ["SVG ↓", "PNG / 300 PPI", "PDF ↓"]) {
    const pending = page.waitForEvent("download");
    await page.getByRole("button", { name, exact: true }).click();
    const file = await pending,
      bytes = await fs.readFile((await file.path())!);
    expect(bytes.includes(Buffer.from("CC-BY-SA-4.0"))).toBe(true);
    if (name.startsWith("SVG")) {
      expect(bytes.toString()).toContain("The Wet Ink Workshop");
      expect(bytes.toString()).not.toContain("data-export-credit");
    }
  }
  await credit.check();
  await page.getByLabel("Credit x", { exact: true }).fill("30");
  await page.getByLabel("Credit type size", { exact: true }).fill("9");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "SVG ↓", exact: true }).click();
  const bytes = await fs.readFile((await (await pending).path())!);
  expect(bytes.toString()).toContain('data-export-credit="true"');
  expect(bytes.toString()).toContain('x="30"');
});

for (const locale of ["en", "hi", "bn", "ml"])
  for (const width of [375, 768, 1440])
    test(`compact Studio panels preserve canvas and keyboard access ${locale} ${width}`, async ({
      page,
    }, info) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`/${locale}/workshop/?remix=borders-are-lines`);
      await expect(page.locator(".studio-paper")).toBeVisible();
      await page.locator(".studio-workspace").scrollIntoViewIfNeeded();
      const viewport = page.locator(".canvas-scroll"),
        before = await viewport.boundingBox();
      expect(await page.locator(".studio-paper [data-export-credit]").count()).toBe(0);
      expect(await page.locator(".studio-paper").innerHTML()).not.toContain(
        "PLACEHOLDER / 16 / CC0",
      );
      for (const id of ["text", "color", "layers", "images", "shapes", "paper", "export", "help"]) {
        await openOption(page, id);
        expect(await page.locator(".studio-option-panel:visible").count()).toBe(1);
        expect(await viewport.boundingBox()).toEqual(before);
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
        await page.keyboard.press("Escape");
        await expect(page.locator(`#studio-option-${id}`)).toBeHidden();
        await expect(page.locator(`#studio-trigger-${id}`)).toBeFocused();
      }
      await openOption(page, "paper");
      await page.locator("#studio-trigger-paper").click();
      await expect(page.locator("#studio-option-paper")).toBeHidden();
      await openOption(page, "layers");
      const outside = (await viewport.boundingBox())!;
      await page.mouse.click(outside.x + 10, outside.y + 10);
      await expect(page.locator("#studio-option-layers")).toBeHidden();
      await page.screenshot({ path: info.outputPath("workspace.png"), fullPage: true });
      await openOption(page, "export");
      await expect(page.getByLabel("Add credit line", { exact: true })).not.toBeChecked();
      await page.screenshot({ path: info.outputPath("export-options.png") });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    });

test("crop edits survive save/undo/restore and exported SVG/PNG/PDF keep original image and attribution", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.goto("/en/workshop/?format=poster-placard");
  await expect(page.locator(".studio-paper")).toBeVisible();
  await openOption(page, "images");
  await page
    .getByLabel("Import a local image")
    .setInputFiles("public/posters/borders-are-lines/A3.png");
  await page.getByRole("button", { name: "Crop image", exact: true }).click();
  await expect(page.locator("[data-crop-handle]")).toHaveCount(9);
  await page.getByText("Crop dimensions", { exact: true }).click();
  await page.getByLabel("Crop left (%)", { exact: true }).fill("20");
  await page.getByLabel("Crop width (%)", { exact: true }).fill("50");
  await page.getByRole("button", { name: "Apply crop", exact: true }).click();
  await expect
    .poll(async () =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("redlark.studio.v2") || "{}").layers?.find(
            (l: { kind: string }) => l.kind === "image",
          )?.crop?.width,
      ),
    )
    .toBeCloseTo(0.5);
  const original = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("redlark.studio.v2")!).layers.find(
        (l: { kind: string }) => l.kind === "image",
      ).image,
  );
  await page.reload();
  await expect(page.locator(".studio-paper")).toBeVisible();
  await openOption(page, "layers");
  await page.getByRole("button", { name: "Local image (metadata stripped)", exact: true }).click();
  await page.getByLabel("rotation", { exact: true }).fill("37");
  await openOption(page, "images");
  await page.getByRole("button", { name: "Crop image", exact: true }).click();
  await page.getByRole("combobox", { name: "Crop ratio", exact: true }).selectOption("square");
  await expect(page.getByLabel("Lock crop ratio", { exact: true })).toBeChecked();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole("button", { name: "Cancel crop", exact: true }).click();
  await page.getByRole("button", { name: "UNDO", exact: true }).click();
  await openOption(page, "export");
  for (const name of ["SVG ↓", "PNG / 300 PPI", "PDF ↓"]) {
    const pending = page.waitForEvent("download");
    await page.getByRole("button", { name, exact: true }).click();
    const file = await pending,
      bytes = await fs.readFile((await file.path())!);
    expect(bytes.length).toBeGreaterThan(200);
    if (name.startsWith("SVG")) {
      const svg = bytes.toString(),
        nested = svg.match(/viewBox="([\d.e -]+)" preserveAspectRatio="none"/);
      expect(nested).not.toBeNull();
      const region = nested![1].split(" ").map(Number);
      for (const [index, value] of [0.2, 0, 0.5, 1].entries())
        expect(region[index]).toBeCloseTo(value, 8);
      expect(svg.includes(original)).toBe(true);
      expect(svg.includes("sourceLicense")).toBe(true);
    }
    if (name.startsWith("PNG")) {
      expect(bytes.includes(Buffer.from("iTXt"))).toBe(true);
      expect(bytes.includes(Buffer.from("sourceLicense"))).toBe(true);
      expect(bytes.readUInt32BE(bytes.indexOf("pHYs") + 4)).toBe(11811);
    }
    if (name.startsWith("PDF")) expect(bytes.toString("latin1")).toContain("%PDF");
  }
});

test("viewport wheel and mouse pan anchor zoom, preserve layer drags and fit without page zoom", async ({
  page,
}) => {
  await page.goto("/en/workshop/?format=poster-placard");
  await expect(page.locator(".studio-paper")).toBeVisible();
  await page.locator(".studio-workspace").scrollIntoViewIfNeeded();
  const viewport = page.locator(".canvas-scroll");
  const before = await viewport.evaluate((el) => ({
    zoom: Number((el as HTMLElement).dataset.zoom),
    x: Number((el as HTMLElement).dataset.panX),
    y: Number((el as HTMLElement).dataset.panY),
  }));
  const anchor = { x: 120, y: 180 };
  const prevented = await viewport.evaluate((el, p) => {
    const b = el.getBoundingClientRect();
    const event = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      ctrlKey: true,
      deltaY: -200,
      clientX: b.left + p.x,
      clientY: b.top + p.y,
    });
    return {
      prevented: !el.dispatchEvent(event),
      anchor: {
        x: event.clientX - b.left - (el as HTMLElement).clientLeft,
        y: event.clientY - b.top - (el as HTMLElement).clientTop,
      },
    };
  }, anchor);
  expect(prevented.prevented).toBe(true);
  await expect
    .poll(async () => Number(await viewport.getAttribute("data-zoom")))
    .toBeGreaterThan(1);
  const after = await viewport.evaluate((el) => ({
    zoom: Number((el as HTMLElement).dataset.zoom),
    x: Number((el as HTMLElement).dataset.panX),
    y: Number((el as HTMLElement).dataset.panY),
  }));
  expect((prevented.anchor.x - after.x) / after.zoom).toBeCloseTo(
    (prevented.anchor.x - before.x) / before.zoom,
    3,
  );
  expect((prevented.anchor.y - after.y) / after.zoom).toBeCloseTo(
    (prevented.anchor.y - before.y) / before.zoom,
    3,
  );
  const box = (await viewport.boundingBox())!;
  await page.mouse.move(box.x + 80, box.y + 80);
  await page.keyboard.down("Space");
  await page.mouse.down();
  await page.mouse.move(box.x + 140, box.y + 105, { steps: 4 });
  await page.mouse.up();
  await page.keyboard.up("Space");
  await expect
    .poll(async () => Number(await viewport.getAttribute("data-pan-x")))
    .toBeCloseTo(after.x + 60, 2);
  await page.mouse.dblclick(box.x + 15, box.y + 15);
  await expect(viewport).toHaveAttribute("data-zoom", "1");
  const panBefore = Number(await viewport.getAttribute("data-pan-x"));
  await page.mouse.move(box.x + 40, box.y + 50);
  await page.mouse.down({ button: "middle" });
  await page.mouse.move(box.x + 80, box.y + 70, { steps: 3 });
  await page.mouse.up({ button: "middle" });
  await expect
    .poll(async () => Number(await viewport.getAttribute("data-pan-x")))
    .toBeCloseTo(panBefore + 40, 2);
  await page.getByRole("button", { name: "FIT", exact: true }).click();
  await expect(viewport).toHaveAttribute("data-zoom", "1");
  await addElement(page, "rectangle");
  await closeOptions(page);
  await page.getByRole("slider").fill("2");
  await page.getByRole("button", { name: "SNAP ON", exact: true }).click();
  const layer = page.locator("[data-layer-id]").last(),
    rect = (await layer.locator("rect").first().boundingBox())!;
  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
  await page.mouse.down();
  await page.mouse.move(rect.x + rect.width / 2 + 30, rect.y + rect.height / 2 + 20, { steps: 3 });
  await page.mouse.up();
  await openOption(page, "layers");
  expect(Number(await page.getByLabel("x", { exact: true }).inputValue())).toBeGreaterThan(50);
});

test("real touch events pinch and translate from viewport margins without dragging layers", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
      baseURL,
      hasTouch: true,
      isMobile: true,
      viewport: { width: 375, height: 844 },
    }),
    page = await context.newPage();
  await page.goto("/en/workshop/?format=poster-placard");
  await expect(page.locator(".studio-paper")).toBeVisible();
  await page.locator(".canvas-scroll").scrollIntoViewIfNeeded();
  const viewport = page.locator(".canvas-scroll"),
    box = (await viewport.boundingBox())!,
    cdp = await context.newCDPSession(page);
  const points = [
    { x: box.x + 12, y: box.y + 55 },
    { x: box.x + 100, y: box.y + 55 },
  ];
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: points });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [
      { x: points[0].x + 5, y: points[0].y + 25 },
      { x: points[1].x + 40, y: points[1].y + 25 },
    ],
  });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect
    .poll(async () => Number(await viewport.getAttribute("data-zoom")))
    .toBeGreaterThan(1.1);
  expect(await page.evaluate(() => visualViewport?.scale)).toBe(1);
  for (let i = 0; i < 2; i++) {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: box.x + 20, y: box.y + 40 }],
    });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  }
  await expect(viewport).toHaveAttribute("data-zoom", "1");
  await page.getByRole("button", { name: "FIT", exact: true }).click();
  await expect(viewport).toHaveAttribute("data-zoom", "1");
  await context.close();
});

for (const pointer of ["mouse", "pen", "touch"] as const)
  test(`eight rotated crop handles work with ${pointer}`, async ({ browser, baseURL }) => {
    const context = await browser.newContext({
        baseURL,
        viewport: { width: 375, height: 1000 },
        hasTouch: pointer === "touch",
        isMobile: pointer === "touch",
      }),
      page = await context.newPage();
    await page.route("**/api/session", (route) =>
      route.fulfill({ json: { csrf: "fixture", account: null } }),
    );
    await page.goto("/en/workshop/?format=poster-placard");
    await expect(page.locator(".studio-paper")).toBeVisible();
    await openOption(page, "images");
    await page
      .getByLabel("Import a local image")
      .setInputFiles("public/posters/borders-are-lines/A3.png");
    await openOption(page, "layers");
    await page.getByLabel("rotation", { exact: true }).fill("37");
    await openOption(page, "images");
    await page.getByRole("button", { name: "Crop image", exact: true }).click();
    const cdp = await context.newCDPSession(page);
    for (const handle of ["nw", "n", "ne", "e", "se", "s", "sw", "w"]) {
      await page.getByRole("button", { name: "Reset crop", exact: true }).click();
      await page.locator(".canvas-scroll").scrollIntoViewIfNeeded();
      const box = (await page.locator(`[data-crop-handle="${handle}"]`).boundingBox())!,
        start = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
      expect(box.width).toBeGreaterThanOrEqual(43);
      expect(box.height).toBeGreaterThanOrEqual(43);
      const radians = (37 * Math.PI) / 180,
        dx = handle.includes("w") ? 15 : handle.includes("e") ? -15 : 0,
        dy = handle.includes("n") ? 15 : handle.includes("s") ? -15 : 0;
      const end = {
        x: start.x + dx * Math.cos(radians) - dy * Math.sin(radians),
        y: start.y + dx * Math.sin(radians) + dy * Math.cos(radians),
      };
      if (pointer === "touch") {
        await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [start] });
        await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [end] });
        await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      } else if (pointer === "pen") {
        await cdp.send("Input.dispatchMouseEvent", {
          type: "mousePressed",
          ...start,
          button: "left",
          buttons: 1,
          clickCount: 1,
          pointerType: "pen",
        });
        await cdp.send("Input.dispatchMouseEvent", {
          type: "mouseMoved",
          ...end,
          button: "left",
          buttons: 1,
          pointerType: "pen",
        });
        await cdp.send("Input.dispatchMouseEvent", {
          type: "mouseReleased",
          ...end,
          button: "left",
          buttons: 0,
          clickCount: 1,
          pointerType: "pen",
        });
      } else {
        await page.mouse.move(start.x, start.y);
        await page.mouse.down();
        await page.mouse.move(end.x, end.y, { steps: 3 });
        await page.mouse.up();
      }
      if (handle.includes("w") || handle.includes("e"))
        await expect
          .poll(async () =>
            Number(await page.getByLabel("Crop width (%)", { exact: true }).inputValue()),
          )
          .toBeLessThan(100);
      if (handle.includes("n") || handle.includes("s"))
        await expect
          .poll(async () =>
            Number(await page.getByLabel("Crop height (%)", { exact: true }).inputValue()),
          )
          .toBeLessThan(100);
    }
    await page.getByRole("button", { name: "Cancel crop", exact: true }).click();
    await context.close();
  });
