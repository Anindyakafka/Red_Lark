import { test, expect } from "@playwright/test";
import { openOption } from "./studio-helpers";
test("quick export restores the actual opener; native gesture fallback stays local; crop handles accept keys", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 1000 });
  await page.goto("/en/workshop/?format=poster-placard");
  await expect(page.locator(".studio-paper")).toBeVisible();
  const opener = page.locator(".studio-toolbar [data-studio-option=export]");
  await opener.click();
  await page.keyboard.press("Escape");
  await expect(opener).toBeFocused();
  await opener.click();
  const preview = page.locator("#studio-option-export details summary");
  for (let i = 0; i < 12 && !(await preview.evaluate((el) => el === document.activeElement)); i++)
    await page.keyboard.press("Tab");
  await expect(preview).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#studio-option-export details")).toHaveAttribute("open", "");
  await page.keyboard.press("Escape");
  await openOption(page, "text");
  await page.getByLabel("Words", { exact: true }).fill("DESIGN STAYS HERE");
  await openOption(page, "paper");
  await page.getByRole("combobox", { name: "Artwork format", exact: true }).selectOption("meme");
  await expect(page).toHaveURL(/format=meme/);
  await openOption(page, "text");
  await expect(page.getByLabel("Words", { exact: true })).toHaveValue("DESIGN STAYS HERE");
  await page.keyboard.press("Escape");
  const viewport = page.locator(".canvas-scroll");
  const cancelled = await viewport.evaluate((el) => {
    const box = el.getBoundingClientRect();
    let cancelled = true;
    for (const [type, scale] of [
      ["gesturestart", 1],
      ["gesturechange", 1.5],
      ["gestureend", 1.5],
    ] as const) {
      const event = new Event(type, { bubbles: true, cancelable: true });
      Object.defineProperties(event, {
        scale: { value: scale },
        clientX: { value: box.left + 100 },
        clientY: { value: box.top + 120 },
      });
      cancelled = !el.dispatchEvent(event) && cancelled;
    }
    return cancelled;
  });
  expect(cancelled).toBe(true);
  await expect(viewport).toHaveAttribute("data-zoom", "1.5");
  expect(
    await page
      .locator("main")
      .evaluate((el) =>
        el.dispatchEvent(new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaY: 50 })),
      ),
  ).toBe(true);
  await openOption(page, "images");
  await page
    .getByLabel("Import a local image")
    .setInputFiles("public/posters/borders-are-lines/A3.png");
  await page.getByRole("button", { name: "Crop image", exact: true }).click();
  const width = page.getByLabel("Crop width (%)", { exact: true });
  await expect(width).toHaveValue("100");
  await page.locator('[data-crop-handle="e"]').focus();
  await page.keyboard.press("ArrowLeft");
  expect(Number(await width.inputValue())).toBeLessThan(100);
  let downloads = 0;
  page.on("download", () => downloads++);
  await opener.click();
  await expect(page.locator(".studio-notice[role=status]")).toContainText(
    "Apply or cancel the current crop first.",
  );
  await expect(page.locator("#studio-option-export")).toBeHidden();
  expect(downloads).toBe(0);
  await expect(page.locator(".crop-toolbar")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".crop-toolbar")).toHaveCount(0);
});
