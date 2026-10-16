import fs from "node:fs/promises";
import { spawn } from "node:child_process";
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { launch } from "chrome-launcher";
import { measurePage } from "./lighthouse-series.mjs";
const round = Number(process.argv[2] ?? 3);
if (!Number.isInteger(round) || round < 1 || round > 15)
  throw new Error("Use npm run qa:round -- N (1–15)");
const suffix = process.env.QA_EVIDENCE_SUFFIX ?? "";
if (!/^[a-z0-9-]*$/.test(suffix)) throw new Error("Invalid QA evidence suffix");
const dir = `docs/evidence/redlark-round-${round}${suffix}`;
await fs.mkdir(dir, { recursive: true });
const executable =
  process.env.BROWSER_PATH ??
  (process.platform === "win32"
    ? "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
    : undefined);
const server = spawn(process.execPath, ["scripts/serve.mjs"], {
  env: { ...process.env, QA_FIXTURES: "1" },
  stdio: "ignore",
});
const summary = {
  round,
  screenshots: [],
  axe: [],
  lighthouse: [],
  externalRequests: [],
  errors: [],
  held: ["login/admin: backend implementation explicitly held; no fake screenshots"],
};
let browser, chrome;
try {
  for (let i = 0; i < 80; i++) {
    try {
      if ((await fetch("http://localhost:3000/en/")).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  browser = await chromium.launch({ executablePath: executable });
  const routes = [
    ["landing", "/"],
    ["collection", "/collection/"],
    ["item", "/poster/a-future-we-share/"],
    ["studio", "/studio/"],
    ["privacy", "/privacy/"],
    ["contact-errors", "/contact/"],
    ["submit-errors", "/submit/"],
    ["404", "/404/"],
  ];
  for (const locale of process.env.QA_SCREENSHOTS === "0" ? [] : ["en", "ml"])
    for (const width of [390, 1440]) {
      const context = await browser.newContext({
        viewport: { width, height: width === 390 ? 844 : 1000 },
        hasTouch: width === 390,
      });
      const page = await context.newPage();
      page.on("pageerror", (e) => summary.errors.push(e.message));
      page.on("request", (req) => {
        if (!/^(http:\/\/localhost:3000|blob:|data:)/.test(req.url()))
          summary.externalRequests.push(req.url());
      });
      for (const [name, route] of routes) {
        await page.goto(`http://localhost:3000/${locale}${route}`, { waitUntil: "networkidle" });
        await page.evaluate(() => document.fonts.ready);
        if (name === "studio") {
          await page.getByRole("button", { name: "Poster/Placard", exact: true }).click();
          await page.locator(".studio-paper").waitFor();
        }
        if (name === "collection") {
          const select = page.locator('select[aria-label="Category"]');
          if (await select.count()) await select.selectOption("workers");
          else await page.locator('select[aria-label="Category"]').selectOption("workers");
        }
        if (name.endsWith("errors")) await page.locator('button[type="submit"]').first().click();
        const positions = name === "landing" ? ["top", "middle", "bottom"] : ["top"];
        for (const position of positions) {
          if (position === "middle")
            await page.locator(".landing-objectives").scrollIntoViewIfNeeded();
          if (position === "bottom")
            await page.locator(".landing-formats").scrollIntoViewIfNeeded();
          const file = `${name}-${position}-${locale}-${width}.png`;
          await page.screenshot({ path: `${dir}/${file}` });
          summary.screenshots.push(file);
        }
        const audit = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze();
        summary.axe.push({
          page: `${locale}${route}`,
          width,
          violations: audit.violations.map((v) => ({
            id: v.id,
            nodes: v.nodes.map((n) => n.target),
          })),
        });
      }
      await context.close();
      console.log(`Captured ${locale} at ${width}`);
    }
  // Key Hindi routes also receive axe, beyond the required screenshot languages.
  const hindiContext = await browser.newContext();
  const hindi = await hindiContext.newPage();
  for (const route of ["/", "/collection/", "/poster/a-future-we-share/"]) {
    await hindi.goto(`http://localhost:3000/hi${route}`);
    const audit = await new AxeBuilder({ page: hindi })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    summary.axe.push({
      page: `hi${route}`,
      width: 1440,
      violations: audit.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
    });
  }
  await hindi.close();
  chrome = await launch({
    chromePath: executable,
    chromeFlags: [
      "--headless=new",
      "--disable-extensions",
      "--no-first-run",
      "--disable-background-networking",
    ],
  });
  for (const locale of process.env.QA_METRICS_LOCALES?.split(",") ?? ["en", "hi"])
    for (const [name, route] of routes
      .slice(0, 3)
      .filter(
        ([name]) =>
          !process.env.QA_METRICS_PAGES || process.env.QA_METRICS_PAGES.split(",").includes(name),
      )) {
      const result = await measurePage({
        name: `${name}-${locale}`,
        url: `http://localhost:3000/${locale}${route}`,
        dir,
        port: chrome.port,
      });
      summary.lighthouse.push(result);
      console.log(`${name}-${locale}`, JSON.stringify(result));
    }
} finally {
  await browser?.close();
  await chrome?.kill();
  server.kill();
  summary.externalRequests = [...new Set(summary.externalRequests)];
  await fs.writeFile(`${dir}/summary.json`, JSON.stringify(summary, null, 2));
}
if (
  summary.axe.some((a) => a.violations.length) ||
  summary.externalRequests.length ||
  summary.errors.length ||
  summary.lighthouse.some((r) => Object.values(r.scores ?? {}).some((v) => v < 95))
)
  process.exitCode = 1;
