import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
const server = spawn(process.execPath, ["scripts/serve.mjs"], { stdio: "ignore" });
let browser;
try {
  for (let n = 0; n < 80; n++) {
    try {
      if ((await fetch("http://localhost:3000")).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  browser = await chromium.launch({
    executablePath:
      process.platform === "win32"
        ? "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
        : undefined,
  });
  await fs.mkdir("docs/evidence/redlark-m1", { recursive: true });
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
    await page.screenshot({ path: `docs/evidence/redlark-m1/home-${width}.png` });
    await page.goto("http://localhost:3000/contact/", { waitUntil: "networkidle" });
    await page.screenshot({ path: `docs/evidence/redlark-m1/contact-${width}.png` });
    await page.close();
  }
} finally {
  await browser?.close();
  server.kill();
}
