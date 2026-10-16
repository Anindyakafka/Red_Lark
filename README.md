# RED LARK WORKSHOP

The `redlark` branch contains the public-site rebuild: original identity, four locale routes, draft Indic translations and a landing narrative rendered from the exact supplied English copy. The archive and private browser-only Studio remain usable without accounts. Supabase-dependent accounts, uploads, review/database and server mail are explicitly on hold.

See [AUDIT](docs/AUDIT.md), [PLAN](docs/PLAN.md), [COPY_QUESTIONS](docs/COPY_QUESTIONS.md) and [human prerequisites](docs/TODO_HUMAN.md) for milestone status. No provider resources or live deployment have been changed.

## Existing application setup

A free, open protest-poster archive and a private, browser-only poster-making Studio. Built with Next.js App Router, strict TypeScript, Tailwind 4, self-hosted fonts and file-based content. Public pages are statically exported; a small Netlify Edge function handles language negotiation and localized missing pages.

## Run locally

Use Node.js 24 and npm. In PowerShell use npm.cmd if script policy blocks npm.ps1.

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
| npm run brand:build           | Regenerate original lark, wordmark, favicon set and OG image                   |
| npm run test:copy             | Independent verbatim Appendix A source and rendered-text tests                 |
| npm run check:brand           | Reject retired branding except the one repository URL constant                 |

For browser QA on Windows, the config uses installed Microsoft Edge. Set BROWSER_PATH for another Chromium executable. On Linux/macOS run npx playwright install chromium. The ND browser fixture is isolated to the local verification server: run npx tsx scripts/qa-fixture.tsx after building. It is not included in out/ and is not public catalogue content.

## Environment

Copy .env.example to .env.local for Next builds. Values are baked into the static output; rebuild when they change. Standalone validation/QA commands use shell environment values if configured. Never commit real private credentials.

| Variable                       | Purpose                                                                                           |
| ------------------------------ | ------------------------------------------------------------------------------------------------- |
| SITE_URL                       | Optional canonical/OG/sitemap origin override; otherwise uses Netlify deployment URL or localhost |
| CONTACT_EMAIL                  | Contact/takedown inbox; defaults to the owner-supplied redlarkworkshop@gmail.com                  |
| NEXT_PUBLIC_ANALYTICS_DOMAIN   | Optional self-hosted Plausible site identifier                                                    |
| NEXT_PUBLIC_ANALYTICS_ENDPOINT | Optional same-origin event proxy path; e.g. /analytics/event. No remote script URL                |

No contact address or donation destination is invented. Domain, inbox, legal review, permissions, hosting, print approval and optional analytics operation are listed in [TODO_HUMAN](docs/TODO_HUMAN.md).

## Routes

/ · /collection · /poster/[slug] · /discover · /artists · /artist/[slug] · /themes · /theme/[slug] · /studio · /community · /submit · /about · /contact · /privacy · /terms · /thank-you · /404 · /search/image · /sitemap.xml · /robots.txt · /site.webmanifest

Image search is honestly labelled coming soon; no photo is collected. Community is an empty curated gallery until human-reviewed submissions exist. No fabricated posts, artists, support URLs or download counts.

## Content and licensing

The 18 current posters are **original CC0 placeholder studies**, with clearly invented lab credits. No real artist's work is embedded. Each has editable layers, meaningful alt text, lightweight WebP/AVIF previews, poster-specific OG, SVG source, PDF variants (A4/A3/A2/18x24), an A3 300-PPI PNG and a graphics bundle. Typography in vector files is outlined. PDFs are RGB and no-bleed, not promises of calibrated professional press colour.

Add reviewed content under content/posters/_.json and content/artists/_.json; put files under public/posters/<slug>/. See [content/README](content/README.md). Run validation after changes. The generated index under src/generated is derived, not edited by hand.

Explicit artist credit, source, licence and alt are mandatory. Licence flags are derived from reviewed policy. NoDerivatives works have **no remix button**, cannot enter the Studio shelf and cannot be imported through a shared/remix URL. Remix also needs actual editable layers. ShareAlike source credits survive into outlined credit strips and metadata; incompatible mixtures fail export. Unknown licences fail the build until reviewed. CC0 applies to the placeholder artwork, not the supplied Red Lark Workshop logo, branding or fonts.

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

## Licence

Existing AGPL v3 software licence retained. Original placeholder artwork under content/posters and public/posters is dedicated to CC0-1.0. Self-hosted fonts carry their own OFL licences in public/fonts. Supplied and refined Red Lark Workshop brand assets remain separate. A deployed AGPL service must provide corresponding source as required by its licence.
