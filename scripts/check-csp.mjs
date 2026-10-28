import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const policies = JSON.parse(fs.readFileSync("src/config/csp-hashes.json", "utf8"));
const headers = fs.readFileSync("out/_headers", "utf8");
if (/script-src[^;\n]*'unsafe-inline'/.test(headers))
  throw new Error("Built CSP permits inline scripts without a hash.");
let checked = 0;
function visit(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) visit(file);
    else if (entry.name.endsWith(".html")) {
      const route =
        entry.name === "index.html"
          ? `/${path.relative("out", path.dirname(file)).replaceAll(path.sep, "/")}/`.replace("//", "/")
          : `/${path.relative("out", file).replaceAll(path.sep, "/")}`;
      if (!Array.isArray(policies[route])) throw new Error(`Missing CSP route: ${route}`);
      const routeHeader = headers.match(new RegExp(`(?:^|\\n)${route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\r?\\n  Content-Security-Policy: ([^\\r\\n]+)`))?.[1];
      if (!routeHeader) throw new Error(`Missing deployed CSP header: ${route}`);
      for (const hash of policies[route])
        if (!routeHeader.includes(`'sha256-${hash}'`))
          throw new Error(`Missing deployed script hash: ${route}`);
      const html = fs.readFileSync(file, "utf8");
      for (const script of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
        if (/\bsrc\s*=/.test(script[1]) || !script[2]) continue;
        const hash = createHash("sha256").update(script[2]).digest("base64");
        if (!policies[route].includes(hash)) throw new Error(`Unhashed inline script: ${route}`);
      }
      checked++;
    }
  }
}
visit("out");
if (checked === 0) throw new Error("No static HTML to check.");
console.log(`Strict script CSP verified for ${checked} exported HTML pages.`);
