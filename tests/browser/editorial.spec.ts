import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import english from "../../content/copy/landing.en.json" with { type: "json" };
for (const locale of ["en", "hi", "bn", "ml"])
  test(`${locale}: blog, RSS and policy routes are complete and marked honestly`, async ({
    page,
  }) => {
    test.setTimeout(120000);
    await page.goto(`/${locale}/blog/`);
    const links = await page
      .locator(".index-card h2 a")
      .evaluateAll((nodes) => nodes.map((node) => (node as HTMLAnchorElement).href));
    expect(links).toHaveLength(2);
    for (const link of links) {
      expect((await page.goto(link))?.status()).toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator(".legal-draft")).toContainText("PLACEHOLDER");
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    }
    for (const policy of ["ai-policy", "licensing", "contributor-guidelines", "takedown"]) {
      expect((await page.goto(`/${locale}/policies/${policy}/`))?.status()).toBe(200);
      await expect(page.locator(".legal-draft")).toContainText("legal review");
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    }
    const response = await page.request.get(`/${locale}/feed.xml`);
    expect(response.status()).toBe(200);
    const xml = await response.text();
    expect(
      await page.evaluate(
        (xml) =>
          new DOMParser().parseFromString(xml, "application/xml").querySelectorAll("parsererror")
            .length,
        xml,
      ),
    ).toBe(0);
    if (locale === "en") {
      await page.goto("/en/policies/ai-policy/");
      await expect(page.locator("[data-policy-copy]")).toHaveText(english.ai);
      await page.goto("/en/about/");
      await expect(page.locator("[data-about-copy]")).toHaveText(english.about);
    }
  });
test("complex native editorial headings wrap at every required width", async ({ page }) => {
  for (const width of [360, 390, 768, 1024, 1440])
    for (const path of [
      "/ml/blog/artist-interview-outline/",
      "/ml/policies/ai-policy/",
      "/hi/about/",
    ]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `${path} ${width}`,
      ).toBe(true);
    }
});
