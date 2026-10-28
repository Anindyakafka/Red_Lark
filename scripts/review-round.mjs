import fs from "node:fs/promises";
import { spawn } from "node:child_process";
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { measurePage } from "./lighthouse-series.mjs";
import { launch } from "chrome-launcher";
const round = Number(process.argv[2]);
if (!Number.isInteger(round) || round < 1 || round > 15)
  throw new Error("Use npm run qa:round -- N (1–15)");
const dir = `docs/evidence-local/round-${round}`;
await fs.mkdir(dir, { recursive: true });
const catalog = JSON.parse(await fs.readFile("src/generated/catalog.json", "utf8"));
const executable =
  process.env.BROWSER_PATH ??
  (process.platform === "win32"
    ? "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
    : undefined);
const server = spawn(process.execPath, ["scripts/serve.mjs"], {
  env: { ...process.env, QA_FIXTURES: "1" },
  stdio: "pipe",
});
server.stdout.on("data", (chunk) => process.stdout.write(chunk));
server.stderr.on("data", (chunk) => process.stderr.write(chunk));
let browser, chrome;
const summary = {
  round,
  screenshots: [],
  axe: [],
  lighthouse: [],
  externalRequests: [],
  errors: [],
};
try {
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch("http://localhost:3000")).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  browser = await chromium.launch({ executablePath: executable });
  const routes = [
    ["home", "/"],
    ["collection", "/collection/"],
    ["poster", `/poster/${catalog.posters[0].slug}/`],
    ["studio", "/studio/"],
    ["404", "/404/"],
    ["privacy", "/privacy/"],
    ["submit-errors", "/submit/"],
  ];
  for (const width of [390, 1440]) {
    const context = await browser.newContext({
      baseURL: "http://localhost:3000",
      viewport: { width, height: width === 390 ? 844 : 1000 },
      colorScheme: "light",
      hasTouch: width === 390,
    });
    const page = await context.newPage();
    page.on("request", (req) => {
      if (
        !req.url().startsWith("http://localhost:3000") &&
        !req.url().startsWith("data:") &&
        !req.url().startsWith("blob:")
      )
        summary.externalRequests.push(req.url());
    });
    page.on("pageerror", (e) => summary.errors.push(e.message));
    for (const [name, url] of routes) {
      await page.goto(url, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      if (name === "studio") await page.locator(".studio-paper").waitFor();
      if (name === "collection") {
        await page.getByLabel("Theme", { exact: true }).selectOption("Labor");
        await page.evaluate(() => {
          const bar = document.querySelector(".filter-bar");
          if (bar) window.scrollTo(0, bar.getBoundingClientRect().top + window.scrollY - 8);
        });
      }
      if (name === "submit-errors")
        await page.getByRole("button", { name: "[PREPARE EMAIL]" }).click();
      const file = `${name}-${width}.png`;
      await page.screenshot({ path: `${dir}/${file}`, fullPage: false });
      summary.screenshots.push(file);
      const a = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      summary.axe.push({
        page: name,
        width,
        violations: a.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
      });
    }
    await page.goto("/");
    await page.getByRole("button", { name: "[DARK]" }).click();
    await page.screenshot({ path: `${dir}/home-dark-${width}.png` });
    const a = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    summary.axe.push({
      page: "home-dark",
      width,
      violations: a.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
    });
    await context.close();
  }
  await browser.close();
  browser = null;
  chrome = await launch({
    chromePath: executable,
    chromeFlags: [
      "--headless=new",
      "--disable-extensions",
      "--no-first-run",
      "--disable-background-networking",
    ],
  });
  for (const [name, url] of routes.slice(0, 3)) {
    summary.lighthouse.push(
      await measurePage({ name, url: "http://localhost:3000" + url, dir, port: chrome.port }),
    );
    console.log(name, JSON.stringify(summary.lighthouse.at(-1)));
  }
} finally {
  if (browser) await browser.close();
  if (chrome) await chrome.kill();
  server.kill();
  summary.externalRequests = [...new Set(summary.externalRequests)];
  summary.errors = [...new Set(summary.errors)];
  await fs.writeFile(`${dir}/summary.json`, JSON.stringify(summary, null, 2));
}
console.log(`Round ${round} evidence written to ${dir}`);
