# Numbered rebuild rounds

Evidence is recorded under `docs/evidence/round-N`. PASS is measured, not inferred from appearance. Scores below are mobile Lighthouse in installed Chromium/Edge. The required score threshold is 95 for all four categories on Home, Collection and Poster.

## Round 1 critique

Implemented the replacement static archive, all routes, 18 original CC0 seed posters and their vector/print assets, licence model, SVG Studio, legal/form drafts, metadata and the verification harness. Fixed a keyboard-focusable viewport defect found by axe, and made Studio text controls explicit. Install, typecheck, lint, format, content validation, build, 10 model tests and 50 Playwright tests are green. Route axe: zero violations. Required 390/1440 screenshots were viewed, including light/dark Home, active filters, detail, desktop/mobile Studio, 404, Privacy and submission errors.

Mobile Lighthouse: Home **79/96/100/100**, Collection **84/96/100/100**, Poster **94/100/96/100** (Performance/Accessibility/Best Practices/SEO). CLS is approximately 0.00003. Scores do not meet the stop condition yet.

Weaknesses, ranked by impact:

1. Static preview currently transfers HTML/JS/CSS without compression; simulated mobile LCP suffers. The host/verification server must implement realistic text compression and asset caching. Client navigation also requests Next segment files through a path alias the preview server does not yet serve, producing poster-page network errors.
2. Lighthouse catches small artist-credit touch targets not included in the earlier axe tag set. Expand touch targets and use WCAG 2.2 AA checks.
3. Mobile Home title wraps to three lines; the collection begins too late. Mobile poster details show the full print before actionable context, so move title/primary action ahead of the image on small screens.
4. Submission focus lands on the message, rather than the first invalid field in visual order. Correct focus and show a more useful error-state capture.
5. Expand proof beyond SVG: actual PNG, PDF, tiled PDF, separation bundle, uploaded-image metadata removal, storage failure, keyboard transforms and corrupt-share paths need browser tests.
6. Studio default headline extends below its selection height. Fit outlined text to its box and bound texture complexity. Build validation also needs to validate the full source scene, not only its existence.

The visual direction is recognisably brutalist: thick rules, hard shadows, condensed type, paper/red/black and dense cards. No rounded SaaS panels or borrowed artwork. Most body copy is deliberately small archive type; do not sacrifice touch size or readability for density. Fix the above in subsequent rounds.
