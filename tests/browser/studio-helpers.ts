import { expect, type Page } from "@playwright/test";
export async function openOption(page: Page, id: string) {
  if (await page.locator(`#studio-option-${id}`).isVisible()) return;
  await page.locator(`#studio-trigger-${id}`).click();
  await expect(page.locator(`#studio-option-${id}`)).toBeVisible();
}
export async function closeOptions(page: Page) {
  const panel = page.locator(".studio-option-panel:visible");
  if (await panel.count()) await panel.locator(".studio-panel-heading button").click();
}
export async function addElement(page: Page, kind: string) {
  await openOption(page, kind === "text" ? "text" : "shapes");
  await page.getByRole("button", { name: `+ ${kind.toUpperCase()}`, exact: true }).click();
}
