import { test, expect } from "@playwright/test";
test("pointer move/resize/rotate, zoom/pan and paper presets operate", async ({ page }) => {
  await page.goto("/studio/?format=poster-placard");
  await expect(page.locator(".studio-paper")).toBeVisible();
  await page.getByRole("button", { name: "+ RECTANGLE", exact: true }).click();
  const overlay = page.locator(".studio-paper > g[transform]").last();
  const first = await overlay.locator("rect").first().boundingBox();
  await page.mouse.move(first!.x + first!.width / 2, first!.y + first!.height / 2);
  await page.mouse.down();
  await page.mouse.move(first!.x + first!.width / 2 + 40, first!.y + first!.height / 2 + 20, {
    steps: 5,
  });
  await page.mouse.up();
  expect(Number(await page.getByLabel("x", { exact: true }).inputValue())).toBeGreaterThan(50);
  const handle = await overlay.locator("rect").last().boundingBox();
  await page.mouse.move(handle!.x + handle!.width / 2, handle!.y + handle!.height / 2);
  await page.mouse.down();
  await page.mouse.move(handle!.x + handle!.width / 2 + 40, handle!.y + handle!.height / 2 + 25, {
    steps: 5,
  });
  await page.mouse.up();
  expect(Number(await page.getByLabel("width", { exact: true }).inputValue())).toBeGreaterThan(180);
  const rotate = await overlay.locator("circle").boundingBox();
  await page.mouse.move(rotate!.x + rotate!.width / 2, rotate!.y + rotate!.height / 2);
  await page.mouse.down();
  await page.mouse.move(rotate!.x + rotate!.width / 2 + 80, rotate!.y + rotate!.height / 2 + 40, {
    steps: 5,
  });
  await page.mouse.up();
  expect(Number(await page.getByLabel("rotation", { exact: true }).inputValue())).not.toBe(0);
  await page.getByRole("slider").fill("1.5");
  await expect(page.locator(".paper-wrap")).toHaveAttribute("style", /150%/);
  await page.getByRole("button", { name: "[PAN]", exact: true }).click();
  await expect(page.getByRole("button", { name: "[PAN ON]", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "[FIT]", exact: true }).click();
  await expect(page.locator(".paper-wrap")).toHaveAttribute("style", /100%/);
  await page.getByLabel("Paper preset").selectOption("Social");
  await expect(page.locator(".studio-paper")).toHaveAttribute("viewBox", "0 0 600 750");
});
test("clear bookmarks and filter reset clear local and URL state", async ({ page }) => {
  await page.goto("/collection/?q=homes");
  await expect(page.locator(".poster-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Save Homes for all", exact: true }).click();
  await page.getByRole("button", { name: /CLEAR 1 LOCAL BOOKMARKS/ }).click();
  expect(await page.evaluate(() => localStorage.getItem("redlark.saved.v1"))).toBeNull();
  await page.locator(".filter-all").click();
  await expect(page).not.toHaveURL(/q=/);
  await expect(page.locator(".poster-card")).toHaveCount(18);
});
test("honeypot and export failure show honest recoverable errors", async ({ page }) => {
  await page.goto("/contact/");
  await page.locator('[name="website"]').evaluate((e: HTMLInputElement) => {
    e.value = "spam";
  });
  await page.getByRole("button", { name: "[PREPARE EMAIL]" }).click();
  await expect(page.locator("main [role=alert]")).toContainText("spam check");
  await page.goto("/studio/?format=poster-placard");
  await expect(page.locator(".studio-paper")).toBeVisible();
  await page.evaluate(() => {
    HTMLCanvasElement.prototype.toBlob = function (callback) {
      callback(null);
    };
  });
  await page.getByRole("button", { name: "PNG / 300 PPI", exact: true }).click();
  await expect(page.locator("main [role=alert]")).toContainText("EXPORT FAILED");
  await expect(page.locator(".studio-paper")).toBeVisible();
});
