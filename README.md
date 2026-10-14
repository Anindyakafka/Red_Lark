# Mirafra

A free, open protest-poster archive and a private, browser-only poster-making Studio. Built on the **rebuild** branch with Next.js App Router, strict TypeScript, Tailwind 4, self-hosted fonts and file-based content. No accounts or database.

## Run locally

Use Node.js 24 and npm. In PowerShell use npm.cmd if script policy blocks npm.ps1.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. For the deployable static build:

```sh
npm run build
npm start
```

The export is in out/. The build also emits physical Next segment-file aliases for ordinary static hosts. Enable Brotli/gzip text compression and immutable caching for hashed framework assets on the production host; the verification server does both. npm start serves it locally with the documented security headers. A static host needs those headers too; do not assume Next.js runtime headers apply to a static export.

## Scripts

| Command                       | Purpose                                                                        |
| ----------------------------- | ------------------------------------------------------------------------------ |
| npm run dev                   | Next.js development server                                                     |
| npm run typecheck             | Strict TypeScript                                                              |
| npm run lint                  | ESLint, zero warnings                                                          |
| npm run format / format:check | Prettier                                                                       |
| npm run validate:content      | Licence/credit/alt/file validation and generated catalogue                     |
| npm run build                 | Content validation, Next static export, internal-link/metadata/alt checks      |
| npm test                      | Scene, licence, search, sharing, history and resolution tests                  |
| npm run test:e2e              | Playwright every-route smoke/axe + Studio, forms, licence gate and breakpoints |
| npm run qa:round -- 1         | Screenshot, dark-mode axe and mobile Lighthouse evidence for round 1           |
| npm run seed                  | Re-author original placeholder assets; not a future-content ingest command     |
| npm run brand:build           | Historical supplied-logo tracing utility                                       |

For browser QA on Windows, the config uses installed Microsoft Edge. Set BROWSER_PATH for another Chromium executable. On Linux/macOS run npx playwright install chromium. The ND browser fixture is isolated to the local verification server: run npx tsx scripts/qa-fixture.tsx after building. It is not included in out/ and is not public catalogue content.

## Environment

Copy .env.example to .env.local for Next builds. Values are baked into the static output; rebuild when they change. Standalone validation/QA commands use shell environment values if configured. Never commit real private credentials.

| Variable                       | Purpose                                                                                            |
| ------------------------------ | -------------------------------------------------------------------------------------------------- |
| SITE_URL                       | Production origin for canonical, OG and sitemap URLs; defaults to localhost for development        |
| CONTACT_EMAIL                  | Real monitored contact/takedown inbox. Unset produces a build warning and a visibly unavailable UI |
| NEXT_PUBLIC_ANALYTICS_DOMAIN   | Optional self-hosted Plausible site identifier                                                     |
| NEXT_PUBLIC_ANALYTICS_ENDPOINT | Optional same-origin event proxy path; e.g. /analytics/event. No remote script URL                 |

No contact address or donation destination is invented. Domain, inbox, legal review, permissions, hosting, print approval and optional analytics operation are listed in [TODO_HUMAN](docs/TODO_HUMAN.md).

## Routes

/ · /collection · /poster/[slug] · /discover · /artists · /artist/[slug] · /themes · /theme/[slug] · /studio · /community · /submit · /about · /contact · /privacy · /terms · /thank-you · /404 · /search/image · /sitemap.xml · /robots.txt · /site.webmanifest

Image search is honestly labelled coming soon; no photo is collected. Community is an empty curated gallery until human-reviewed submissions exist. No fabricated posts, artists, support URLs or download counts.

## Content and licensing

The 18 current posters are **original CC0 placeholder studies**, with clearly invented lab credits. No real artist's work is embedded. Each has editable layers, meaningful alt text, lightweight WebP/AVIF previews, poster-specific OG, SVG source, PDF variants (A4/A3/A2/18x24), an A3 300-PPI PNG and a graphics bundle. Typography in vector files is outlined. PDFs are RGB and no-bleed, not promises of calibrated professional press colour.

Add reviewed content under content/posters/_.json and content/artists/_.json; put files under public/posters/<slug>/. See [content/README](content/README.md). Run validation after changes. The generated index under src/generated is derived, not edited by hand.

Explicit artist credit, source, licence and alt are mandatory. Licence flags are derived from reviewed policy. NoDerivatives works have **no remix button**, cannot enter the Studio shelf and cannot be imported through a shared/remix URL. Remix also needs actual editable layers. ShareAlike source credits survive into outlined credit strips and metadata; incompatible mixtures fail export. Unknown licences fail the build until reviewed. CC0 applies to the placeholder artwork, not the supplied Mirafra logo, branding or fonts.

## Studio

The hand-rolled SVG scene is independent of the UI and stored as schema version 2. Add/remove/reorder/lock/hide text, shapes, stamps, halftone, grain and local images. Eligible poster detail links load that poster's real source layers. Shelf additions retain source credits. Drag/resize/rotate, labelled numeric controls, self-hosted typefaces, ink swatches, one/two/three-ink previews, paper presets, snapping, keyboard shortcuts, zoom/pan and mobile tool tabs are provided.

SVG/PDF exports preserve shapes and outlined type. PNG exports use true preset pixels and a 300-PPI physical-resolution chunk for paper presets; Social stays 1080x1350 px. A4 tiled PDF uses 10mm margins and tile labels for home assembly. Ink separation ZIPs are uncalibrated composition previews, not press-ready plates. An automatic small credit strip and licence metadata travels with exports. Source rights are distinguished from user additions: original additions are not automatically dedicated to CC0. ShareAlike adaptations must use the required source licence.

Drafts autosave to localStorage. Start fresh clears the previous draft/history; Restore recovers the draft present when the session opened. No server stores designs. Share links encode compact scene state in the URL fragment; recipients can read it. Links reject uploaded images and oversized state. Local uploads accept JPEG/PNG/WebP/AVIF, discard EXIF/GPS by decoding and re-encoding as PNG and downsample to a maximum dimension of 1800px. This avoids oversized drafts; use original vectors for large prints. Visible image content can still identify people.

Keyboard: Ctrl/Cmd+Z undo, Shift+Z redo, Ctrl/Cmd+D duplicate, arrows nudge, Shift+arrows larger nudge, Delete remove, Escape deselect. Locked layers ignore edit/transform/remove commands. Numeric controls and the layer list provide an alternative to pointer precision. Studio code and PDF rendering dependencies are lazy-loaded off the catalogue routes.

## Forms and privacy

Contact/submit forms validate locally with inline errors and a honeypot. If CONTACT_EMAIL is configured, they **prepare an email in the visitor's own mail app**. The visitor must review/send it. /thank-you is noindex and explicitly does not confirm delivery. Without an inbox the form reports unavailable delivery; it never claims success. No uploads, attachment storage or backend exists.

The necessary browser-local draft/bookmark features are disclosed through a visible footer data notice. No non-essential storage or cookies are used, so no cookie banner is added. Privacy/terms are visibly drafts needing legal review. A future non-essential integration requires a new consent decision.

Analytics is disabled by default. Optional analytics uses a self-hosted Plausible **same-origin proxy** (host configuration required), not an external script. It respects Do Not Track and allows only pageview, poster-download and studio-export. Payloads omit query strings, fragments, designs, form messages, image metadata and identifiers. Configure the proxy to omit cookies/authorization and document its retention. If hosting access logs exist, the operator must document them too.

## Deployment

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

Five numbered rounds are complete. Final checks: 14 model/privacy tests, 65 browser tests, zero axe violations. All nine cold-cache mobile Lighthouse samples meet the targets; performance medians are Home 97, Collection 99, Poster 98, with 100 for Accessibility, Best Practices and SEO. Highest CLS is 0.0231. See the retained raw reports and critiques rather than relying on a single score.

The Community list is `content/community.json` (empty until approved contributions exist). Collection hydration deliberately omits Studio scenes; the Studio loads them only on its own route. Run `node scripts/font-pack.mjs` to regenerate the local type-kit ZIP if font files change.

## Licence

Existing AGPL v3 software licence retained. Original placeholder artwork under content/posters and public/posters is dedicated to CC0-1.0. Self-hosted fonts carry their own OFL licences in public/fonts. Supplied and refined Mirafra brand assets remain separate. A deployed AGPL service must provide corresponding source as required by its licence.
