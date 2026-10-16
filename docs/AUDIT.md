# RED LARK WORKSHOP: current audit

Audited 16 October 2026. This checkpoint is documentation only. Supabase implementation is on hold at the owner's request.

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
