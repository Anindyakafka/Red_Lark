import fs from "node:fs";
import path from "node:path";
const html = [];
function walk(dir) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, item.name);
    if (item.isDirectory()) walk(file);
    else if (item.name.endsWith(".html")) html.push(file);
  }
}
walk("out");
const errors = [];
const titles = new Map();
for (const file of html) {
  const source = fs.readFileSync(file, "utf8");
  if (file.endsWith("404.html") || file.includes(path.join("out", "404", ""))) continue;
  const title = source.match(/<title>([^<]+)<\/title>/)?.[1];
  if (!title) errors.push(`${file}: missing title`);
  else if (titles.has(title)) errors.push(`${file}: duplicate title ${title}`);
  else titles.set(title, file);
  if (!/<meta name="description" content="[^\"]+"/.test(source))
    errors.push(`${file}: missing description`);
  for (const m of source.matchAll(/(?:href|src)="(\/[^"#?]*)[^"]*"/g)) {
    const url = m[1];
    if (url.startsWith("//") || url === "/") continue;
    const target = path.join("out", decodeURIComponent(url));
    if (!fs.existsSync(target) && !fs.existsSync(path.join(target, "index.html")))
      errors.push(`${file}: broken internal URL ${url}`);
  }
  for (const m of source.matchAll(/<img\b[^>]*>/g))
    if (!/\balt="/.test(m[0])) errors.push(`${file}: image without alt`);
}
if (errors.length) {
  console.error([...new Set(errors)].join("\n"));
  process.exit(1);
}
console.log(
  `Static export valid: ${html.length} HTML pages, unique titles, descriptions, internal links and image alt attributes.`,
);
