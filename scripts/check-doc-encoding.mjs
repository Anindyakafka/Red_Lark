import fs from "node:fs";
import path from "node:path";

const errors = [];
const corrupt = /\u00c3\u0192|\u00c3\u00a2|\u00e2\u20ac|\ufffd/u;
function scan(directory) {
  for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, item.name);
    if (item.isDirectory()) {
      if (item.name !== "evidence-local" && item.name !== "evidence") scan(file);
    } else if (item.name.endsWith(".md") && corrupt.test(fs.readFileSync(file, "utf8")))
      errors.push(file);
  }
}
scan("docs");
if (errors.length) throw new Error(`Documentation mojibake detected in: ${errors.join(", ")}`);
console.log("Documentation UTF-8 check passed.");
