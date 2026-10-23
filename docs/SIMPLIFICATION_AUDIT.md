# Simplification audit — 23 October 2026

## Current map

- **Routes:** localized App Router pages under `src/app/[locale]`: landing, collection/categories/posters/artists, Studio, submit, community, blog, policies, contact, account/admin and legal pages. Root `sitemap.ts` enumerates every localized static page. `netlify.toml` owns production redirects and static private-route shells.
- **Navigation:** `src/components/shell.tsx` renders Collection, Categories, Artists, Studio, Community, Blog and About. Its footer links Submit and Contact / takedown. Responsive global CSS turns the top navigation into horizontal scrolling on small screens.
- **Landing:** `src/app/[locale]/page.tsx` renders hero, all deck copy via `LandingBlocks`, a search/language block, categories, types, and the full Collection.
- **Collection:** `src/components/collection.tsx` filters `PosterSummary` values using `src/lib/query.ts`. `kind` is the existing artwork-type parameter; `formats` is the download-file array and must remain separate. `content/formats.json` supplies the type catalogue.
- **Workshop:** `src/studio/*` is the browser-only editor, mounted from `src/app/[locale]/studio/page.tsx`. It has no server storage. Existing export/download file formats must keep their wording.
- **Contribute:** `/submit` mounts `UploadPanel` from `account-client.tsx`. The current three-step picker requires title, language, JPEG/PNG and an explicit licence before upload. `src/server/contributions.ts` and `guest.ts` sanitize uploads and create R2 print files.
- **Data:** public static works are `Poster` records in `src/lib/types.ts` / `src/generated/catalog.json`; approved database works are merged at build time by `scripts/fetch-public-catalogue.ts`. Database schema/RLS live in `supabase/migrations`. No public historical archive data exists yet.
- **i18n:** `messages/{en,hi,bn,ml}.json` use source English strings as keys. `UiText` resolves locale entries. `content/copy/landing.*.json` contains the canonical long landing narrative.
- **Theme:** global CSS already centralizes paper/ink/accent/panel/font values, but border widths, shadows, spacing and radii are scattered. The simplification should add semantic tokens without changing rendered values.

## Plan and decisions

1. Add Workshop route/redirects and update public wording/link metadata; leave safe internal editor identifiers alone.
2. Treat artwork classifications as **Type** while retaining `kind` URLs and file-format terminology. Add Writing and a text fallback card.
3. Add a localized Archive route, public archive filtering and a database migration/RPC for current/past approved works. Default visibility: approved/published-at-some-point only; pending, rejected and removed works stay private. Archive is footer + Collection linked, not top navigation.
4. Remove takedown page links/routes from public pages, redirect legacy URLs, and list legal copy for owner review without altering its substance.
5. Replace the format-first upload wizard with upload-first, optional details and moderation flags. The existing server pipeline only accepts image JPEG/PNG; writing/PDF/DOCX processing needs a safe separate ingestion path, so this must be implemented without pretending unsupported files work.
6. Reduce home to hero, short About and ten-item usable Collection preview. Categories/types/search/language controls remain available from their dedicated pages/header.
7. Add a Contribute CTA to header and verify its narrow-layout behavior.

## Ambiguities deliberately not guessed

- Archive visibility uses the supplied default: only works that were ever approved/published. "Archive only" includes retired/non-usable approved records; it does **not** expose pending, rejected, removed or unsafe uploads.
- Quick uploads cannot safely receive an invented licence. The current implementation will continue requiring a licence until the owner chooses a documented default (recommended candidate: CC BY-SA 4.0, only if you explicitly want every quick contribution licensed that way).
- Legal body references to takedown/removal are listed for review. Only obvious public-page labels/links will be removed automatically.
