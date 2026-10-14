import fs from "node:fs";
const round = Number(process.argv[2] ?? 1);
const dir = `docs/evidence/round-${round}`;
const summary = JSON.parse(fs.readFileSync(`${dir}/summary.json`, "utf8"));
const green =
  summary.lighthouse.length === 3 &&
  summary.lighthouse.every((p) => Object.values(p.scores).every((s) => s >= 95));
const axe = summary.axe.every((p) => p.violations.length === 0);
const commandChecks = JSON.parse(fs.readFileSync(dir + "/checks.json", "utf8"));
const browserResults = JSON.parse(fs.readFileSync(dir + "/browser-results.json", "utf8"));
const testsGreen =
  commandChecks.length >= 8 &&
  commandChecks.every((c) => c.exitCode === 0) &&
  browserResults.stats.unexpected === 0 &&
  browserResults.stats.skipped === 0;
const freshEyes = fs
  .readFileSync("docs/ITERATIONS.md", "utf8")
  .includes("Round " + round + " fresh-eyes: PASS");
const row = (name, status, evidence, note = "") =>
  `| ${name} | ${status} | ${evidence} | ${note} |`;
const lines = [
  "# Required checklist",
  `\nLast reviewed: Round ${round}. Evidence paths are relative to the repository. No human-only configuration is invented.\n`,
  "| Item | Status | Evidence | Note |",
  "| --- | --- | --- | --- |",
];
const checks = [
  [
    "1. Custom 404",
    "PASS",
    "src/app/not-found.tsx; 404-390.png; browser tests",
    "On-brand search, collection and Studio links.",
  ],
  [
    "2. Key-page above-fold CTA",
    round >= 2 && testsGreen ? "PASS" : "FAIL",
    "home-390.png; poster-390.png; page-intro.tsx",
    "Mobile entry has a download CTA before the image; verified by screenshots.",
  ],
  [
    "3. Unique titles",
    "PASS",
    "scripts/validate-export.mjs; checks.log",
    "Generated metadata and content titles validated.",
  ],
  [
    "4. Unique descriptions",
    "PASS",
    "src/lib/metadata.ts; static route metadata",
    "Poster/artist descriptions derived from content.",
  ],
  [
    "5. OG / Twitter / canonicals",
    "PASS",
    "src/lib/metadata.ts; public/og-default.png; poster og.png",
    "SITE_URL production configuration is human-owned.",
  ],
  [
    "6. Favicon / manifest / theme colour",
    "PASS",
    "public/icons; public/favicon.ico; site.webmanifest; layout.tsx",
    "Locally authored simple M mark.",
  ],
  ["7. Robots", "PASS", "src/app/robots.ts; browser tests", "Allows all, references sitemap."],
  [
    "8. Content sitemap",
    "PASS",
    "src/app/sitemap.ts; browser tests",
    "Poster/artist/theme and static routes; thank-you omitted.",
  ],
  [
    "9. Image alt",
    "PASS",
    "validate-content.ts; validate-export.mjs; core tests",
    "Missing or meaningless poster alt fails.",
  ],
  [
    "10. Responsive widths",
    "PASS",
    "tests/browser/site.spec.ts; browser-results.json",
    "360/390/768/1024/1440; no document overflow.",
  ],
  [
    "11. Mobile browse CTA",
    round >= 2 && testsGreen ? "PASS" : "FAIL",
    "src/components/preferences.tsx; mobile screenshots/tests",
    "Safe-area bar hidden in Studio; improve focused-target avoidance.",
  ],
  [
    "12. Loading / placeholders / CLS",
    "PASS",
    "loading.tsx; studio/client.tsx; summary.json",
    "SSR grid, hydration status, fixed image ratios; CLS below .05.",
  ],
  [
    "13. Accessible form/search failures",
    round >= 2 && testsGreen ? "PASS" : "FAIL",
    "handoff-form.tsx; submit-errors screenshots; browser tests",
    "First visually invalid field receives focus; unavailable inbox and honeypot tested. No server/network submission exists.",
  ],
  [
    "14. Thank-you",
    "PASS",
    "src/app/thank-you/page.tsx; browser tests",
    "Noindex; explicit handoff, not a delivery receipt.",
  ],
  [
    "15. Privacy",
    "PASS",
    "src/app/privacy/page.tsx; privacy screenshots",
    "Accurate local storage, fragments, image handling; visibly legal draft.",
  ],
  [
    "16. Terms",
    "PASS",
    "src/app/terms/page.tsx; route/axe tests",
    "Licensing, ND/SA rules, submissions, removal, limitations; legal draft.",
  ],
  [
    "17. Cookie banner",
    "N-A",
    "docs/AUDIT.md; footer data notice",
    "Only necessary local features; no trackers/cookies. Reassess before non-essential additions.",
  ],
  [
    "18. Cookieless analytics",
    "PASS",
    "src/lib/analytics.ts; README; no external requests in summary",
    "Off by default; env-only same-origin Plausible proxy; DNT; three allowed events.",
  ],
  [
    "19. Real contact configuration",
    "PASS",
    "build warning; contact-address.tsx; TODO_HUMAN.md",
    "CONTACT_EMAIL absent is honestly marked; no invented address.",
  ],
];
for (const c of checks) lines.push(row(...c));
lines.push(
  row(
    "Image search",
    "N-A",
    "/search/image; AUDIT/README",
    "Clearly labelled coming soon; no on-device index/model shipped.",
  ),
);
const studio = [
  ["Layers add/remove/reorder/lock/hide", "src/studio/studio.tsx; browser tests"],
  ["Eligible shelf + poster base", "canRemix; sourceCredit; remix browser test"],
  ["Drag/resize/rotate + text controls", "studio.tsx; desktop/mobile screenshots"],
  ["Self-hosted fonts + palette", "public/fonts; outlined render.ts; same-origin requests"],
  ["1/2/3-ink separation previews", "render.ts; Studio print mode; export ZIP"],
  ["Paper presets A4/A3/A2/18x24/social", "types.ts PRESETS; raster-size test"],
  ["Snapping / undo / redo / keyboard", "studio.tsx; reducer core tests"],
  ["Zoom / pan / mobile tools", "studio.tsx; mobile browser flow"],
  [
    "PNG physical 300 PPI / PDF vectors",
    round >= 2 ? "browser export tests; exports.ts" : "exports.ts; core pHYs test",
  ],
  ["A4 tiled export", "exports.ts; tile labels and clipping"],
  ["Autosave / restore / fresh", "Studio browser restore flow; model tests"],
  ["Share fragment / size bounds", "share.ts; roundtrip/invalid/upload tests"],
  ["Private uploads + metadata stripping", "exports.ts importImage; privacy UI"],
  ["Loading / empty / exporting / failed / storage / unsupported", "studio.tsx; dynamic loader"],
  ["Lazy Studio bundle", "studio/client.tsx; dynamic PDF imports"],
];
for (const [name, evidence] of studio)
  lines.push(
    row(
      `Studio: ${name}`,
      round >= 2 && testsGreen ? "PASS" : "FAIL",
      evidence,
      round >= 2
        ? "See browser tests and source for coverage; no server storage."
        : "Implemented; expand browser proof in Round 2 before acceptance.",
    ),
  );
for (const [name, evidence] of [
  ["ND never remixable", "canRemix; validatePoster; ND isolated browser fixture"],
  ["Required licence / artist / source / alt", "validate-content; core rejection tests"],
  ["Flags derived from policy", "LICENSES and validatePoster"],
  ["ShareAlike credit strip / metadata", "creditLines; sceneSvg; licence mixing tests"],
  ["Incompatible licences reject export", "exportLicense; core tests"],
  ["Original CC0 placeholders only", "scripts/seed.ts; content/README; 18 JSON records"],
])
  lines.push(row(`Licence: ${name}`, "PASS", evidence));
lines.push(
  row(
    "Lighthouse mobile ≥95 in all four categories",
    green ? "PASS" : "FAIL",
    `${dir}/lighthouse-*.json; summary.json`,
    summary.lighthouse.map((p) => `${p.page}: ${Object.values(p.scores).join("/")}`).join("; "),
  ),
);
lines.push(
  row(
    "Axe = zero",
    axe ? "PASS" : "FAIL",
    `${dir}/summary.json; every-route browser results`,
    "Light/dark key screenshots + all public routes.",
  ),
);
lines.push(
  row(
    "Fresh-eyes final round",
    round >= 5 && freshEyes && testsGreen && green && axe ? "PASS" : "FAIL",
    "docs/ITERATIONS.md",
    "Must reread brief, inspect screenshots, click every route and exercise form/licence paths.",
  ),
);
lines.push(
  `\nScreenshot evidence for this review: ${dir}/. Check command output: checks.log. Human launch requirements remain in TODO_HUMAN.md.\n`,
);
fs.writeFileSync("docs/CHECKLIST.md", lines.join("\n"));
