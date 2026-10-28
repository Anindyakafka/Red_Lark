# RED LARK WORKSHOP: current audit

## Backend continuation decision — 19 October 2026

Keep Next 16 App Router/strict TypeScript/Tailwind and static export for public pages. Add independent Netlify Functions for auth, contributions, review and mail instead of moving the entire archive to SSR. Supabase is Auth/Postgres only; existing Cloudflare R2 buckets hold all contribution files. Opaque HttpOnly/Secure/SameSite=Lax cookies reference encrypted server-side Auth tokens, permitting global invalidation without browser SDK credentials. Protected roles and actual Postgres RLS backstop server checks; administration requires TOTP and recent verification. No accounts are required for the archive or Studio. Necessary auth/CSRF cookies and chosen local Studio storage do not trigger a non-essential-cookie banner. No social login, remote font, tracker or new user database service is introduced. Existing SQL/API/R2 credentials are reused; migrations are applied, no backend deployment is made. SMTP/CORS/public hostname/build-hook and real account acceptance remain prerequisites in DEPLOY.md.

Initial audit: 16 October 2026, before implementation. Findings below preserve that starting point; implementation decisions are updated at the end. Supabase implementation remains on hold at the owner's request.

## Current system

- Locked versions: Next.js 16.4.0 App Router, React 19.3.0, strict TypeScript 5.9.3, Tailwind 4.3.3. npm/package-lock.json; Node 24 on Netlify.
- Pure static export: next.config.ts sets output=export and trailingSlash. netlify.toml runs npm run build, publishes out and skips the Next.js server adapter. Content and exported links/metadata are validated during build.
- Routes: /, /collection, /poster/[slug], /discover, /artists, /artist/[slug], /themes, /theme/[slug], /studio, /community, /submit, /about, /contact, /privacy, /terms, /thank-you, /404, /search/image, sitemap, robots and manifest.
- No accounts, server handlers, contribution database or delivery service exist. Current forms prepare an email in the visitor's mail app.
- Keep the brutalist design system, self-hosted fonts, responsive previews, 18 original CC0 placeholders, licensing/derivative validation, source credit strip, lazy client SVG Studio, exports and model/browser/accessibility tests.
- Replace branding and embedded artwork credits; extend localization, category/format taxonomy, item metadata and consent. Reuse existing code through tested migrations rather than rewriting the working editor.

## Bugs and reference evidence

UTF-8 reads confirm mojibake (U+00E2 sequences) in scripts/seed.ts and content/posters/a-future-we-share.json. Fix the generator and source JSON, regenerate all affected catalogue/print/preview assets, then test output and charset. A charset tag alone cannot repair already corrupted strings. Do not blindly transcode valid Indic text.

src/lib/site-origin.ts already supports SITE_URL and Netlify production/preview URL fallbacks. The reported live localhost metadata could reflect an older deploy/configuration. The live URL could not be fetched through the web tool in this audit. M1 must verify absolute canonical/OG/Twitter image URLs in the production build AND live deployment, and reject localhost in production.

Red Lark Workshop.pptx exists but is untracked: git ls-files '*.pptx' returns nothing. Only slide XML text was inspected; no media was extracted or reused. The deck remains untracked. Appendices A-C override slide spacing, omissions and differing format lists.

The previous five rounds and their measurements apply to the old site, not this new brief.

## Architecture recommendation

Keep Next.js/TypeScript/Tailwind and Netlify. Keep the name RED LARK WORKSHOP, give the Archive primary visual weight and Studio the secondary CTA. Browsing, downloads and Studio remain anonymous.

Store canonical English copy, locale messages/review flags, categories/formats and blog content in files. Add /en /hi /bn /ml with next-intl or a typed equivalent. Accept-Language negotiation needs request-time handling: enable the Netlify Next.js runtime when implementing that redirect, preserving prerendered public locale pages. Later auth/admin/API routes must be dynamic and private/no-store; do not carry static-only deployment settings into authentication. Netlify supports [SSR, route handlers and revalidation](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/).

Recommend Supabase later for relational contributions, transactional review, Auth, RLS and private Storage. No SDK, project, SQL migrations, seeds, buckets or integration during the hold.

The required httpOnly sessions need browser-to-same-origin server endpoints and server-only provider clients. The normal browser client expects token access; simply copying that pattern would not meet the requirement. See [Supabase's session/cookie guidance](https://supabase.com/docs/guides/auth/server-side/advanced-guide). Plan Secure/SameSite cookies, CSRF protection, revocation checks and no shared caching of session responses. Use user-scoped clients for ordinary RLS operations; isolate service-role privileges.

Serve public graphics and private authorized reviews through the site origin; ordinary visitors should not contact storage/auth/mail providers directly. Sanitize uploads server-side even after local metadata stripping.

The application can avoid raw IP storage; hosting/auth/mail providers may log independently. Verify retention/configuration before promising blanket no-IP storage. Future rate limits use daily HMAC keys, short TTL and prompt purge. Region, retention, mail-domain verification and legal review are human decisions before activation.

## Implemented public architecture, M1-M6

The public site remains a Next static export with four locale trees and a small Netlify Edge function. A full SSR adapter is unnecessary for this phase: Edge negotiates Accept-Language without cookies, redirects legacy taxonomy URLs and returns real localized 404 responses. It applies security headers explicitly to its responses. The local preview mirrors this behavior. The future private account/API phase still requires a server runtime and removal of static-only assumptions for those endpoints.

Retained the working, typed SVG scene engine rather than replacing it with a canvas dependency. Shapes and outlined typography give crisp vector PDF/SVG exports; raster exports use real paper dimensions at 300 DPI. Labelled controls/layer lists provide keyboard alternatives. HarfBuzz shapes self-hosted Noto Indic fonts for exports: direct fontkit shaping failed a real Malayalam probe, so it was rejected. Fonts/runtime load only in the lazy editor after format selection. Browser UI uses safely subsetted local fonts; glyph/position and browser-pixel parity evidence is stored with provenance. Unsupported mixed scripts produce a recoverable message and can use separate text layers.

Canonical English is file-based and independently locked; other locales carry reviewed:false. Categories and artwork formats are distinct from download file formats. Source-derived licence flags, ND gates and ShareAlike credit composition remain enforced. Image/caption libraries reference actual eligible source works and layer IDs, with build-time validation. Artist public email and UPI each need explicit consent; unconsented fields are rejected before publication.

The owner supplied the real team inbox. Current contact/submission forms prepare email in the visitor's own app, never claim delivery and have no server database. No Supabase SDK/schema/roles/storage, accounts, auth cookies, review queue or mail provider has been implemented. The site uses only necessary browser-local features, with a visible data notice; no consent banner is needed for the present configuration. Optional cookieless analytics stays disabled unless configured through a same-origin proxy and respects DNT. Provider logging/retention and all legal drafts still require human review.

## Implemented public editorial architecture, M9

Trusted, checked-in MDX is compiled at build time, never from visitor content. Two explicitly fictional/placeholder editorial outlines have four locale versions, review flags, tags, unique metadata and static RSS feeds. Policies use validated JSON and the unchanged canonical AI copy; untranslated legal text visibly falls back to English. About reuses the supplied mission and objectives. Contact topics now cover joining, commissions, takedowns and problem reports, while retaining honest email-app handoff.

Analytics configuration is validated as same-origin and documented accurately in privacy. Public analytics domain configuration is explicitly allow-listed; reserved backend secrets are never exposed. Dependency review upgraded the PDF exporter and image tooling; production audit has zero vulnerabilities. A development-only, currently unpatched upstream glob-parser advisory is documented in DEPENDENCIES.md, without a forced framework downgrade.
