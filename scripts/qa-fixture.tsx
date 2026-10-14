import fs from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { LicenseGate } from "../src/components/license-gate";
import { posters } from "../src/lib/catalog";
import { LICENSES } from "../src/lib/types";
const p = {
  ...posters[0],
  license: "CC-BY-NC-ND-4.0" as const,
  licenseUrl: LICENSES["CC-BY-NC-ND-4.0"].url,
  allowsDerivatives: false,
  commercialUseAllowed: false,
  remixable: false,
};
const source = fs.readFileSync("out/index.html", "utf8");
const css = [...source.matchAll(/<link[^>]+rel="stylesheet"[^>]*>/g)].map((m) => m[0]).join("");
fs.mkdirSync(".qa", { recursive: true });
fs.writeFileSync(
  ".qa/license-gate.html",
  `<!doctype html><html lang="en"><head><title>Test-only ND licence gate</title>${css}</head><body><main class="prose"><h1>No derivatives fixture</h1>${renderToStaticMarkup(<LicenseGate poster={p} />)}</main></body></html>`,
);
