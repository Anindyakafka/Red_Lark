import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
try {
  process.loadEnvFile(".env.local");
} catch {
  /* Build variables may be supplied by Netlify. */
}
const origin = "https://files.redlarkworkshop.com";
let endpoint = "";
if (process.env.R2_ENDPOINT) {
  const url = new URL(process.env.R2_ENDPOINT);
  if (
    url.protocol !== "https:" ||
    !url.hostname.endsWith(".r2.cloudflarestorage.com") ||
    url.pathname !== "/"
  )
    throw new Error("Invalid owned R2 endpoint");
  endpoint = url.origin;
}
fs.writeFileSync(
  "src/config/upload-origin.json",
  JSON.stringify({ origin: endpoint }, null, 2) + "\n",
);
if (process.argv.includes("--prepare")) {
  console.log("Owned upload origin prepared for Edge CSP.");
  process.exit(0);
}
const file = "out/_headers";
let source = fs.readFileSync(file, "utf8");
source = source
  .replace("img-src 'self' data: blob:", `img-src 'self' data: blob: ${origin}`)
  .replace("connect-src 'self'", `connect-src 'self' ${origin}${endpoint ? " " + endpoint : ""}`);
const baseCsp = source.match(/^  Content-Security-Policy: (.+)$/m)?.[1];
if (!baseCsp || /script-src[^;]*'unsafe-inline'/.test(baseCsp))
  throw new Error("A strict base CSP is required before generating script hashes.");
const cspHashes = {};
function pages(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) pages(absolute);
    else if (entry.name.endsWith(".html")) {
      const route =
        entry.name === "index.html"
          ? `/${path.relative("out", path.dirname(absolute)).replaceAll(path.sep, "/")}/`.replace(
              "//",
              "/",
            )
          : `/${path.relative("out", absolute).replaceAll(path.sep, "/")}`;
      const html = fs.readFileSync(absolute, "utf8");
      const hashes = new Set();
      for (const script of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
        if (/\bsrc\s*=/.test(script[1]) || !script[2]) continue;
        hashes.add(createHash("sha256").update(script[2]).digest("base64"));
      }
      cspHashes[route] = [...hashes];
    }
  }
}
pages("out");
fs.writeFileSync("src/config/csp-hashes.json", JSON.stringify(cspHashes) + "\n");
for (const [route, hashes] of Object.entries(cspHashes)) {
  const hashSources = hashes.map((hash) => `'sha256-${hash}'`).join(" ");
  const policy = baseCsp.replace("script-src 'self'", `script-src 'self' ${hashSources}`);
  source += `\n${route}\n  Content-Security-Policy: ${policy}\n`;
}
source += "\n/api/*\n  Cache-Control: private, no-store\n  X-Robots-Tag: noindex, nofollow\n";
fs.writeFileSync(file, source);
console.log(
  `Strict CSP generated for ${Object.keys(cspHashes).length} HTML pages with per-page script hashes.`,
);
