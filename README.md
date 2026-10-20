# RED LARK WORKSHOP

Guest submissions are available at `/en/submit/` (also `hi`, `bn`, `ml`) without creating an account. Artwork goes through the same private R2 sanitization/print pipeline and human review as account uploads. Artist name, contact email and UPI are optional; publication consent is separate for each field. Save the private receipt link to check status/feedback for 90 days. It is read-only after submission; accounts remain useful for dashboards, editing and resubmission. Never share a real receipt link in logs or screenshots.

Guest backend migration: `supabase/migrations/202610210006_guest_submissions.sql` (already applied to the existing project during implementation). `guest_submissions` has RLS and no anonymous/contributor access; only server-side capability checks or fresh-MFA admins can read receipts. No guest Auth user, tracking cookie, new bucket or additional service key is created. Existing CORS and environment settings still apply. Hourly cleanup expires receipts/private contact fields and abandoned draft files; published artwork follows the existing takedown process. New interface strings retain draft translation flags.

The `redlark` branch contains the public multilingual archive/Studio and contributor backend. Browsing, downloads, Studio and guest uploads need no login. Optional accounts, private R2 uploads, fresh-TOTP administration and stored contact mail run through separate Netlify Functions. Supabase stores Auth/Postgres data only; R2 stores artwork. The existing account backend is deployed; the guest update needs a new frontend/Functions deployment and owner acceptance.

Current guest-contribution checkpoint: **58 unit/RLS/copy tests and 185 browser tests pass**. Actual handler and browser guest uploads to private services pass with cleanup. Fresh en/hi public Lighthouse medians are 96-98 Performance and 100 in the other categories, with CLS 0. See [guest evidence](docs/evidence/guest-submissions/) and [performance metrics](docs/evidence/guest-submissions/lighthouse.json). Production guest approval/publication/takedown still needs deployment and owner acceptance.

See [AUDIT](docs/AUDIT.md), [PLAN](docs/PLAN.md), [COPY_QUESTIONS](docs/COPY_QUESTIONS.md) and [human prerequisites](docs/TODO_HUMAN.md) for milestone status. The existing Supabase project has tested migrations/private seed; infrastructure was not re-provisioned. The guest migration is applied; its frontend/Functions update still needs deployment.

Final public checkpoint: 37 unit tests and 88 browser tests pass, including 336 locale-page accessibility checks. English/Hindi key-route Lighthouse performance medians are 96–98, with 100 in Accessibility, Best Practices and SEO. See [iterations and retained evidence](docs/ITERATIONS.md). The public checkpoint is historical. Current backend acceptance and honest external blockers are recorded at the top of CHECKLIST.md.

## Backend operations

Follow [DEPLOY.md](docs/DEPLOY.md) for Supabase SMTP/callbacks, R2 CORS/lifecycle/custom hostname, migrations, bootstrap and Netlify variables. Existing production settings are reused for guests; deployment still follows owner authorization.

The localized account flow starts at `/en/signup/` or `/en/login/` (also `hi`, `bn`, `ml`). Email links are primary; passwords and recovery are available. `/account` lists private contributions, `/account/profile` manages separately consented contact/UPI fields, `/account/settings` handles TOTP/export/global logout/deletion, and `/account/works/new` opens the format-first upload wizard. Owned revision links use `/account/works/ID`.

Administrators use `/admin` and `/admin/review/ID`, with separate messages, takedowns, users and audit pages. Each API request independently enforces the protected role and fresh TOTP. Netlify rewrites UUID detail addresses to static, noindex shells; private data is fetched after authentication and never included in the build. Local preview/development implements the same rewrites. Keep the supplied `netlify.toml` rewrite rules when deploying.

- npm run db:check / npm run db:migrate: verified TLS, ordered migration ledger and idempotent private seed; local SQL credentials only.
- npm run seed:backend: regenerate 28 categories, 10 formats, licence policies and 18 original private CC0 placeholder records.
- npm run admin:bootstrap: owner-configured email; refuses missing verified real login or TOTP; idempotent and audited.
- npm run dev: Next dev + local API bridge at localhost:3000. npm start serves the static export and the same handler.
- npm run test:rls / npm test: actual local PostgreSQL policies plus model/security/upload/mail checks. Hosted Auth is a separate acceptance step.
- npm run check:secrets: install checksum-verified Gitleaks (CI does this) or set GITLEAKS_PATH; scans working files and all Git history. Build separately checks actual private values and secret prefixes in out/.

Approved works are fetched at build only when PUBLIC_CATALOGUE_ENABLED=1, using a public RPC whitelist and publishable key. Unavailable remote catalogue data fails that build rather than publishing an incomplete archive. Private drafts never enter the static output. Account data export/deletion is in the dashboard; published-work removal/anonymisation is a deliberate choice. Session and rate-limit keys are distinct random server secrets. Scheduled maintenance retries mail and cleans expired sessions/hashes/quarantine tickets; a quarantine-only R2 lifecycle protects abandoned raw uploads.

## Application setup

A free, open protest-poster archive and a private, browser-only poster-making Studio. Built with Next.js App Router, strict TypeScript, Tailwind 4, self-hosted fonts and file-based content. Public pages are statically exported; a small Netlify Edge function handles language negotiation and localized missing pages.

## Run locally

Use Node.js 24 and npm. In PowerShell use npm.cmd if script policy blocks npm.ps1.

For local configuration, copy .env.example to .env.local if the local file does not already exist. Paste the project URL into SUPABASE_URL, the current publishable key into SUPABASE_PUBLISHABLE_KEY and the current secret key into SUPABASE_SECRET_KEY. The local file is ignored by Git; never overwrite an existing populated file with the template. Supabase credentials are reserved for the future backend: adding values does not activate accounts or database access. Keep the secret server-only, outside NEXT_PUBLIC_ variables and next.config.ts's env object. Restart the development server after changing environment values. Hosted configuration must be entered separately in Netlify's server-side environment settings when integration is ready.

```sh
npm ci
npm run dev
```

Open http://localhost:3000/en/ (or /hi/, /bn/, /ml/). Development root shows a language chooser; Netlify and the static preview negotiate Accept-Language without cookies. For the deployable static build:

```sh
npm run build
npm start
```

The export is in out/. The build also emits physical Next segment-file aliases for ordinary static hosts. Enable Brotli/gzip text compression and immutable caching for hashed framework assets on the production host; the verification server does both. npm start serves it locally with the documented security headers. A static host needs those headers too; do not assume Next.js runtime headers apply to a static export.

## Scripts

| Command                       | Purpose                                                                                               |
| ----------------------------- | ----------------------------------------------------------------------------------------------------- |
| npm run dev                   | Next.js development server                                                                            |
| npm run typecheck             | Strict TypeScript                                                                                     |
| npm run lint                  | ESLint, zero warnings                                                                                 |
| npm run format / format:check | Prettier                                                                                              |
| npm run validate:content      | Licence/credit/alt/file validation and generated catalogue                                            |
| npm run build                 | Content validation, Next static export, internal-link/metadata/alt checks                             |
| npm test                      | Scene, licence, search, sharing, history and resolution tests                                         |
| npm run test:e2e              | Playwright every-route smoke/axe + Studio, forms, licence gate and breakpoints                        |
| npm run qa:round -- 12        | English/Malayalam screenshots, axe and en/hi mobile Lighthouse; numbered evidence                     |
| npm run seed                  | Re-author original placeholder assets; not a future-content ingest command                            |
| npm run brand:build           | Regenerate original lark, wordmark, favicon set and OG image                                          |
| npm run test:copy             | Independent verbatim Appendix A source and rendered-text tests                                        |
| npm run check:brand           | Reject retired branding except the one repository URL constant                                        |
| npm run check:edge            | Native Edge module loading, language/legacy redirects, static pass-through, localized 404 and headers |

The build runs the native Edge preflight before Next.js. Edge dependencies must use explicit `.ts` extensions and JSON imports must carry `with { type: "json" }`: Netlify bundles this graph using Deno, independently of Next's resolver. CI additionally runs `deno check --no-config netlify/edge-functions/language.ts` and `deno run --no-config --no-npm scripts/check-edge.mjs`. A successful Next export alone does not establish Edge deployment compatibility.

For browser QA on Windows, the config uses installed Microsoft Edge. Set BROWSER_PATH for another Chromium executable. On Linux/macOS run npx playwright install chromium. The ND browser fixture is isolated to the local verification server: run npx tsx scripts/qa-fixture.tsx after building. It is not included in out/ and is not public catalogue content.

## Environment

Copy .env.example to .env.local for Next builds. Only explicitly public build variables are baked into static output. Private credentials are Functions-only; see [DEPLOY](docs/DEPLOY.md) for exact scopes and owner dashboard setup. Standalone validation/QA commands use shell environment values if configured. Never commit real private credentials.

| Variable                       | Purpose                                                                                           |
| ------------------------------ | ------------------------------------------------------------------------------------------------- |
| SITE_URL                       | Optional canonical/OG/sitemap origin override; otherwise uses Netlify deployment URL or localhost |
| CONTACT_EMAIL                  | Contact/takedown inbox; defaults to the owner-supplied redlarkworkshop@gmail.com                  |
| NEXT_PUBLIC_ANALYTICS_DOMAIN   | Optional self-hosted Plausible site identifier                                                    |
| NEXT_PUBLIC_ANALYTICS_ENDPOINT | Optional same-origin event proxy path; e.g. /analytics/event. No remote script URL                |

No contact address or donation destination is invented. Domain, inbox, legal review, permissions, hosting, print approval and optional analytics operation are listed in [TODO_HUMAN](docs/TODO_HUMAN.md).

| Additional variable                          | Purpose/scope                                                                                                            |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| ANALYTICS_DOMAIN                             | Preferred analytics-domain variable; mapped to the public value at build. Disabled without a valid same-origin endpoint. |
| NEXT_TELEMETRY_DISABLED                      | Set to 1; Netlify configuration disables framework build telemetry.                                                      |
| REPO_URL                                     | Reserved contract; src/config/site.ts's single constant remains authoritative until repository rename.                   |
| SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY      | Project URL/public key for the Functions auth service and opt-in approved public build.                                  |
| SUPABASE_SECRET_KEY                          | Current secret key, reserved for server-only administration; never expose through NEXT_PUBLIC or next.config.ts env.     |
| MAIL_PROVIDER_KEY / MAIL_FROM / MAIL_TO_TEAM | Server-only Resend delivery, full verified sender identity and private team inbox.                                       |

R2 credential preparation uses R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_ENDPOINT (the account-level S3 endpoint, without a bucket path). R2_REGION is auto for S3 signing; it does not select a physical storage location. R2_PENDING_BUCKET and R2_APPROVED_BUCKET name the two private buckets. Store values in ignored .env.local, with bucket-restricted Object Read & Write credentials. R2_PUBLIC_BASE_URL, bucket CORS/lifecycle and a production build hook are also required. See DEPLOY.md.

## Routes

Public pages use /en, /hi, /bn or /ml: landing, collection, categories/category/[slug], poster/[slug], discover, artists/artist/[slug], studio, community, submit, blog/blog/[slug], about, policies and policy articles, contact, privacy, terms, thank-you, 404 and search/image. Each locale has feed.xml. Root sitemap.xml, robots.txt and site.webmanifest stay unprefixed. Old themes/theme URLs redirect to categories while preserving locale/query.

Localized /login, /signup, /account, /forgot-password, /reset-password and /admin are noindex account screens. The server verifies sessions and RLS permissions; admin actions additionally require fresh TOTP. /takedown is a separate minimal form.

Image search is honestly labelled coming soon; no photo is collected. Community is an empty curated gallery until human-reviewed submissions exist. No fabricated posts, artists, support URLs or download counts.

## Content and licensing

The 18 current posters are **original CC0, AI-assisted vector placeholder studies**, credited to The Wet Ink Workshop and visibly marked. No real artist's work is embedded. Each has editable layers, meaningful alt text, responsive WebP/AVIF previews, poster-specific OG, SVG source, PDF variants (A4/A3/A2/18x24), real A4/A2 300-DPI PNG/JPEG files, an A3 PNG and a graphics bundle. Typography in vector files is outlined. PDFs are RGB and no-bleed, not promises of calibrated professional press colour. Indic studies and translations remain drafts.

Add reviewed content under content/posters/_.json and content/artists/_.json; put files under public/posters/<slug>/. See [content/README](content/README.md). Run validation after changes. The generated index under src/generated is derived, not edited by hand.

Explicit artist credit, source, licence and alt are mandatory. Licence flags are derived from reviewed policy. NoDerivatives works have **no remix button**, cannot enter the Studio shelf and cannot be imported through a shared/remix URL. Remix also needs actual editable layers. ShareAlike source credits survive into outlined credit strips and metadata; incompatible mixtures fail export. Unknown licences fail the build until reviewed. CC0 applies to the placeholder artwork, not the supplied Red Lark Workshop logo, branding or fonts.

## Studio

Choose one of the ten artwork formats, then open the editor. Heavy editor fonts load only after selection; remix/share links open the editor directly. Artwork format describes the material; paper preset controls physical dimensions. The hand-rolled SVG scene uses schema version 2. Add/remove/reorder/lock/hide text, shapes, stamps, halftone, grain and local images. Separate coded image/caption libraries retain source credits and admit only remix-eligible sources. Drag/resize/rotate, labelled numeric controls, self-hosted typefaces, ink swatches, one/two/three-ink previews, paper presets, snapping, keyboard shortcuts, zoom/pan and mobile tool tabs are provided. Native text is shaped with self-hosted HarfBuzz/Noto and outlined; unsupported mixed scripts produce a recoverable error and can use separate layers.

SVG/PDF exports preserve shapes and outlined type. PNG exports use true preset pixels and a 300-PPI physical-resolution chunk for paper presets; Social stays 1080x1350 px. A4 tiled PDF uses 10mm margins and tile labels for home assembly. Ink separation ZIPs are uncalibrated composition previews, not press-ready plates. An automatic small credit strip and licence metadata travels with exports. Source rights are distinguished from user additions: original additions are not automatically dedicated to CC0. ShareAlike adaptations must use the required source licence.

Edits autosave to localStorage. Merely opening the editor or a broken share link does not replace an existing draft. Start fresh explicitly clears the previous draft/history; Restore recovers the draft present when the session opened. No server stores designs. Share links encode compact scene state in the URL fragment; recipients can read it. Links reject uploaded images and oversized state. Local imports accept JPEG/PNG/WebP/AVIF, discard EXIF/GPS by decoding and re-encoding as PNG and downsample to 1800px. Use original vectors for large prints. Visible image content can still identify people.

Keyboard: Ctrl/Cmd+Z undo, Shift+Z redo, Ctrl/Cmd+D duplicate, arrows nudge, Shift+arrows larger nudge, Delete remove, Escape deselect. Locked layers ignore edit/transform/remove commands. Numeric controls and the layer list provide an alternative to pointer precision. Studio code and PDF rendering dependencies are lazy-loaded off the catalogue routes.

## Forms and privacy

Contact/submit forms validate locally with inline errors and a honeypot. If CONTACT_EMAIL is configured, they **prepare an email in the visitor's own mail app**. The visitor must review/send it. /thank-you is noindex and explicitly does not confirm delivery. Without an inbox the form reports unavailable delivery; it never claims success. No uploads, attachment storage or backend exists.

The necessary browser-local draft/bookmark features are disclosed through a visible footer data notice. No non-essential storage or cookies are used, so no cookie banner is added. Privacy/terms are visibly drafts needing legal review. A future non-essential integration requires a new consent decision.

Analytics is disabled by default. Optional analytics uses a self-hosted Plausible **same-origin proxy** (host configuration required), not an external script. It respects Do Not Track and allows only pageview, poster-download and studio-export. Payloads omit query strings, fragments, designs, form messages, image metadata and identifiers. Configure the proxy to omit cookies/authorization and document its retention. If hosting access logs exist, the operator must document them too.

## Deployment

### Netlify

Import this GitHub repository into Netlify and choose `redlark` as the production branch when ready (or your release branch after merging). Leave the base directory at the repository root. The committed `netlify.toml` supplies:

- Build command: `npm run build`
- Publish directory: `out`
- Node.js: `24`
- `NETLIFY_NEXT_PLUGIN_SKIP=true` for the static export, as documented in [Netlify's framework guide](https://docs.netlify.com/build/frameworks/overview/).

Set `CONTACT_EMAIL` to your real monitored inbox in Netlify's environment variables with **Builds** scope. No `.env.local` needs to be uploaded. Leave `SITE_URL` unset to use Netlify's primary site/custom-domain URL in production and the preview URL for branch deploys/Deploy Previews. An explicit `SITE_URL` takes precedence in every context; set it only for production if previews should keep their own URLs. Changing any build-time value or the domain requires a new deploy.

Netlify serves the exported directory routes; the committed language Edge function redirects unprefixed paths and returns localized missing pages with HTTP 404. Do not add a `/* /index.html 200` rewrite. Security headers from `public/_headers` are copied to `out/_headers` and applied explicitly to Edge responses; hashed Next.js assets receive immutable caching. Keep Forms detection, snippet injection and third-party integrations disabled. Current forms hand off to the visitor's mail app. The full Next server adapter is reserved for the future backend phase.

After deployment, open `/collection/`, a poster URL, `/studio/` and an unknown URL directly and refresh each. Verify the unknown URL returns HTTP 404, `/sitemap.xml` uses the intended domain, and responses include the CSP and `Referrer-Policy: no-referrer`. Document Netlify access-log handling in the privacy policy before launch. This configuration prepares deployment; it does not publish the site or configure your Netlify account/domain.

Live Netlify Edge/CDN behaviour still requires the post-deploy checks above. Local measurements are recorded per milestone in docs/ITERATIONS.md; historical reports do not certify the new rebuild.

### Other static hosts

1. Supply the real inbox and production SITE_URL; complete human permission/legal review.
2. npm ci, typecheck, lint, validation, tests and build.
3. Publish out/ to your static host, preserving directory routes and 404.html.
4. Apply public/_headers on a compatible host (e.g. Cloudflare Pages/Netlify) or reproduce them in your web server. Verify CSP, no-referrer, nosniff, anti-framing and disabled camera/mic/geolocation. CSP allows Next-generated inline bootstrap code and inline presentation styles, while remote scripts/connects/fonts are blocked. If stricter script hashes are required, generate per-build hashes and test them before deployment.
5. If analytics is enabled, configure a same-origin event proxy to your own Plausible service before building. Otherwise leave both values empty.
6. Review actual-device forms, public print files and a sample print. No deployment has been performed by this rebuild.

No runtime database, server-side design storage, comments, payments, newsletter or remote embeds are included.

## Verification evidence

[Audit](docs/AUDIT.md), [checklist](docs/CHECKLIST.md), [numbered iteration critiques](docs/ITERATIONS.md) and docs/evidence/round-N contain the evidence. Screenshots cover 390/1440; browser layout checks cover 360/390/768/1024/1440. Playwright/axe runs every public content route. Lighthouse measures Home, Collection and a Poster page in mobile mode; Studio is exempt only from the performance score.

Recorded browser checks are Chromium/Edge evidence, not a promise that every physical printer or browser behaves identically. Human-only launch decisions remain explicit.

Current rebuild evidence is under docs/evidence/redlark-*. All failures and fixes remain recorded. Full account/upload/admin/mail acceptance cannot run while the backend is held; this is not a claim of complete release acceptance.

The Community list is `content/community.json` (empty until approved contributions exist). Collection hydration deliberately omits Studio scenes; the Studio loads them only on its own route. Run `node scripts/font-pack.mjs` to regenerate the local type-kit ZIP if font files change.

## Editorial content and languages

English landing copy is content/copy/landing.en.json, locked against an independent fixture and rendered-text tests. Log wording questions in docs/COPY_QUESTIONS.md; do not silently edit the supplied copy. Hindi/Bengali/Malayalam drafts are reviewed:false. Untranslated UI and legal material visibly falls back to English. Native review and legal review are separate prerequisites.

Blog posts are trusted repository files under content/blog/{locale}/*.mdx. Reuse the English filename/slug in each locale. Frontmatter values are JSON (quoted strings/dates, arrays and booleans), for example:

```mdx
---
title: "Clearly marked draft title"
description: "An honest description."
date: "2026-10-16"
tags: ["printing"]
placeholder: true
reviewed: false
---

## Draft body
```

MDX compiles during the static build only. Never compile uploads, messages or remote content. Active embeds/external media are rejected. Both current posts are explicit placeholders; no interview or quote is invented. Locale RSS feeds and sitemap entries derive from content. Missing locale posts fall back visibly to English. Non-AI policy articles currently use flagged English fallback pending native translation/review.

To add a language: extend src/i18n/config.ts, matching message catalogs/review flags, copy/content registries, metadata mappings, root static params, Edge/preview routing, sitemap and tests. Add licensed local fonts; verify conjuncts/marks in the UI and outlined exports. Regenerate safe subsets/provenance when native vocabulary changes. Never mark translations reviewed before native approval.

## Held backend work

No Supabase project, SDK, migration, database seed, bucket, role bootstrap or mail adapter is included. Migration/admin commands do not exist yet. The seed script authors file-based CC0 placeholders only. After the owner releases the hold, implement M7's server-only sessions/RLS/review before M6 UPLOAD and M8 persisted mail. PLAN.md records the schema/role/testing contract; TODO_HUMAN.md lists region, retention, verified sender and initial-admin decisions. Update policies and pass real end-to-end tests before activation.

Use ANALYTICS_DOMAIN (or NEXT_PUBLIC_ANALYTICS_DOMAIN) with a same-origin NEXT_PUBLIC_ANALYTICS_ENDPOINT without query/fragment. Off-origin or malformed endpoints are disabled; DNT is respected. Only real pageview/download/export events exist today. Upload-submitted belongs to the future actual upload flow and is never simulated. Default analytics remains disabled.

Dependency details: [DEPENDENCIES](docs/DEPENDENCIES.md). Production audit is clean after PDF/image updates; the full audit retains an unpatched development-only braces advisory chain. Do not force-downgrade the framework tooling.

## Licence

Existing AGPL v3 software licence retained. Original placeholder artwork under content/posters and public/posters is dedicated to CC0-1.0. Self-hosted fonts carry their own OFL licences in public/fonts. Supplied and refined Red Lark Workshop brand assets remain separate. A deployed AGPL service must provide corresponding source as required by its licence.
