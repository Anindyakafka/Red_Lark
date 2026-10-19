import fs from "node:fs";
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
source += "\n/api/*\n  Cache-Control: private, no-store\n  X-Robots-Tag: noindex, nofollow\n";
fs.writeFileSync(file, source);
console.log("CSP permits only the owned approved-file host and configured R2 upload endpoint.");
