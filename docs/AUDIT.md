# Phase 0 audit — 14 October 2026

Recorded before application changes. The starting working tree was clean on `main`.

## Existing implementation

- Framework: Next.js App Router 16.4.0 (manifest `^16.0.0`), React/React DOM 19.3.0 (manifest `^19.2.0`). TypeScript 5.9.3, strict mode.
- Package manager: npm with a committed `package-lock.json`; Node >=22 declared, Node 24 used locally. No workspace packages.
- Scripts: `dev` = next dev; `build` = next build; `start` = next start; `typecheck` = tsc --noEmit; `test` = tsx --test tests/*.test.ts; `brand:build` = node scripts/refine-logo.mjs.
- Runtime dependencies: Next, React, React DOM only. Development dependencies: TypeScript, Node/React types, tsx, sharp 0.34.5, imagetracerjs 1.2.6.
- Layout: `src/app` routes and global CSS; `src/components` header/footer; `src/content/catalog.ts` six seed records; `src/features/catalog` filters/details; `src/features/studio` React SVG editor and model; `tests` five model/search tests; `public/samples` six SVGs; `public/brand` traced identity; `scripts/refine-logo.mjs`; four planning documents; GitHub Actions checks.
- Routes: `/`, `/posters`, `/posters/[slug]`, `/stickers`, `/stickers/[slug]`, `/studio`, `/about`, `/print-guide`, framework not-found.
- Shared components: SiteHeader, SiteFooter, Catalogue, ArtworkDetail, Studio. Metadata includes a title template and global description, but lacks a canonical/OG strategy, manifest, sitemap, and robots.
- Styling: hand-written CSS; editorial serif layout, thin borders, blurred shadows; unsuitable for the requested brutalist direction.
- Studio: fixed A3-ratio scene, text/bird/circle/rectangle, drag, numeric transforms, colours, history and an explicit localStorage save. SVG only; system fonts; no provenance, licence gate, PDF/PNG, templates, uploads, autosave, or share URLs.
- CI: install, typecheck, unit tests, build. No ESLint/Prettier, browser tests, axe, Lighthouse, content validation, or screenshots.
- Infrastructure: none connected. `.env.example` proposes Supabase/R2, which conflict with this mission's file-based, account-free scope.

## Keep / replace

Keep Next.js, strict TypeScript, npm lockfile, the original `mirafra.jpeg`, refined brand artifacts for historical reference, the existing AGPL software licence, and the idea of a serialisable SVG scene independent from the UI. Keep testing the actual history/export boundary.

Replace the entire application UI, six-item TS catalogue, fixed-schema Studio, route layout, styling, metadata, tests, CI and old README/planning documents. Delete superseded poster/sticker routes and sample assets after the new archive is in place. Keep a separately authored simple favicon; do not imply the user-supplied mark is CC0. No database, accounts, payments, newsletter, comments, or submission storage are introduced.

## Chosen stack

- **Next.js App Router + strict TypeScript + Tailwind CSS 4.** Retain the reasonable existing framework; use static export so the result can be hosted on an ordinary static host. Content lives in `content/posters/*.json` and `content/artists/*.json`, with validated generated indexes. No runtime database. Tailwind supplies tokens/utilities alongside a small authored component stylesheet.
- **Self-hosted Bebas Neue and IBM Plex Mono**, with retained open font licences and full system fallbacks. All browser font requests are same-origin. Display font is condensed and loud; mono supports labels and controls.
- **Hand-rolled SVG scene engine.** Shapes and outlined text remain vectors. Locally bundled font outlines give consistent SVG/PDF rendering without an external font service. jsPDF + svg2pdf handle vector PDF; browser canvas renders a dimensioned 300-PPI PNG with embedded physical-resolution metadata. No canvas-library state is persisted. This keeps the model inspectable and source/credit rules testable.
- **ESLint + Prettier, Node/tsx model tests, Playwright + axe, Lighthouse.** Browser checks run against the built static site, including every route, breakpoints, licensing, form states, and Studio exports. Record measurements honestly per round.
- **No submission backend.** Forms prepare a local email handoff only if CONTACT_EMAIL exists. When unset, they explain the missing configuration and do not claim a submission succeeded. Human deployment must supply a real inbox. File-based reviewed community entries are curated in Git.
- **Analytics disabled by default.** Optional same-origin self-hosted Plausible proxy, configured by environment. Respect DNT; allow only pageview, poster-download, studio-export. No design contents or identifiers. No default third-party scripts.

## Reference study

- [Ciggies](https://ciggies.app/): large title, immediate collection, slim navigation, dense item records, multi-facet filtering, original/translated titles. Adapt structural patterns; copy no assets, code, or prose.
- [Justseeds](https://justseeds.org/graphics/): useful subject/movement/colour/sort facets, visible file metadata, artist support and explicit permissions before use. Its default ND notice is a reminder that free download is not permission to remix.
- [Amplifier](https://amplifier.org/free-downloads/): print-size and artist context, language filters, prominent non-commercial rules. Mirafra applies each work's specific licence rather than inventing one global restriction for CC0 placeholders.
- [Another World Press](https://anotherworldpress.org/): direct print-oriented presentation, edition context, and practical printing tone. No real artwork is imported.

## Privacy / storage / headers

Drafts and collection bookmarks use localStorage only for explicitly requested local functionality; no tracking storage or cookies. Document this and provide a visible footer data notice. A cookie banner is not added for necessary local functionality; any future non-essential integration requires a renewed consent assessment. Legal wording remains visibly a draft requiring human review.

Image uploads are decoded and re-encoded locally as PNG before entering a scene; EXIF/GPS and original file bytes are not kept. Share URLs contain user-selected scene state in the fragment, never uploads; warn that recipients can read shared content. No server storage, geolocation, fingerprinting, persistent tracking IDs, remote embeds, or remote design assets. Static-host headers must enforce CSP, no-referrer, nosniff, anti-framing, and disabled camera/microphone/geolocation. Next headers alone do not protect a static deployment, so provide host configuration and a verification server.

## Delivery / verification policy

Work on `rebuild`, with numbered rounds and small commits. Minimum five rounds, maximum fifteen. Each round records install, typecheck, lint, validation, build, model/browser tests, screenshots reviewed at 390 and 1440, axe and mobile Lighthouse for Home/Collection/Poster. Never record an unmeasured score as PASS. Human-only remaining decisions go in `docs/TODO_HUMAN.md`; technical failures stay visible in CHECKLIST/ITERATIONS until fixed.
