import fs from "node:fs";
import path from "node:path";
// Match retired branding even after the repository URL has changed.
const config = fs.readFileSync("src/config/site.ts", "utf8");
const repo = config.match(/^export const REPO_URL = "(https:\/\/github\.com\/[^\"]+)";/m);
if (!repo) throw new Error("Missing source repository constant");
const retired = String.fromCharCode(109, 105, 114, 97, 102, 114, 97);
const pattern = new RegExp(retired, "ig");
const excluded = new Set([
  ".git",
  "node_modules",
  ".next",
  "out",
  ".qa",
  ".npm-cache",
  "test-results",
  "playwright-report",
]);
const errors = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (excluded.has(entry.name) || entry.name.endsWith(".pptx")) continue;
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(target);
      continue;
    }
    if (target.replaceAll("\\", "/").includes(retired)) errors.push(`${target}: legacy filename`);
    let data = fs.readFileSync(target).toString("utf8");
    if (pattern.test(data)) errors.push(`${target}: legacy text`);
    pattern.lastIndex = 0;
  }
}
walk(".");
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log("Legacy-name check passed; no source exceptions. Source PPTX is not a deployed asset.");
