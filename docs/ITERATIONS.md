# Numbered rebuild rounds

## Account pages P1 critique — 20 October 2026

The live site and local implementation had diverged: existing APIs were not deployed, account tools were consolidated in one panel, the header was permanently an Account link and auth favored passwords. Added separate localized views, magic-link-first forms, an explicit global logout confirmation, UUID route shells and a session-aware menu. Fixes also cover the source link, readable mailto contact, custom-domain canonical checks and visible multilingual printed credit.

49 unit/model/RLS tests pass, including actual PostgreSQL policies, independent verbatim landing copy and native embedded PDF fonts. Initial build validates 392 HTML pages and excludes private client secrets. Remaining high-impact issues: (1) browser review of every new view and mobile menu; (2) real verified website account and owner DNS/deployment prerequisites; (3) public Lighthouse and final regression. No real signup, approval or email acceptance is inferred from fixtures.

## Backend round 1 — database boundary review, 19 October 2026

Prepared versioned Supabase Auth/Postgres migrations and deterministic private CC0 seed records. Every application table has RLS. Protected roles, approved-only anonymous reads, contributor isolation and fresh MFA moderation run against actual local PostgreSQL. Seeding twice and transactional/idempotent message-outbox creation are tested. Full-history/working-tree Gitleaks and built-client secret exclusion passed. The static public build passes.

Ranked weaknesses: (1) hosted SQL authentication is rejected despite verified TLS; no remote migration applied; (2) sessions/uploads/admin/mail require full integration and accessibility review; (3) public R2 hostname, non-Gmail/header evidence and scoped Netlify variables need owner action. Local SQL tests are not hosted acceptance. Existing services were not re-provisioned and backend was not deployed.

## Deployment follow-up — 17 October 2026

The first PR #3 Netlify preview compiled and validated all 340 HTML pages, then failed in Edge bundling: the Deno resolver could not find the extensionless src/i18n/config dependency. Local Next/tsx tests accepted extensionless imports, so the prior checks did not exercise the deployment resolver. Fixed both shared TypeScript imports to use their actual .ts extension and added the required JSON import attribute. TypeScript permits these imports with noEmit and allowImportingTsExtensions.

Added scripts/check-edge.mjs, executed by the normal build through native Node resolution (without Next/tsx) and by Deno in CI. It checks real module loading, cookie-free language negotiation, legacy redirects/query preservation, static pass-through, localized 404 fallback and security headers. CI now also checks the graph with Deno. This is a deployment compatibility correction; public design/content and the Supabase hold are unchanged. A fresh Netlify preview after pushing the fix is the deployment acceptance check, not an assertion based only on the local Next build.

Local verification: native preflight plus Deno 2.9.6 check/run pass; strict types, ESLint, formatting, 37 unit tests, all 340 exported HTML pages and five localized browser smoke/axe tests pass. The Node engine contract now matches the existing Node 24 hosting/CI/README requirement, since native TypeScript loading is used by the preflight. No dependency was added to the application.

## Red Lark Round 15 critique — final public fresh eyes

Re-read the expanded brief against the implemented public phase and the explicit backend hold. Added an exported-route matrix (84 pages per locale, 336 locale pages), desktop axe including best-practice rules, dark native mobile checks and a no-JS localized article check. Existing full flows still cover forms, derivative gating, actual exports, local image privacy, recovery and real index navigation.

Corrected the visibly oversized native editorial headings with a smaller Indic scale and generous leading. The Latin body font now uses optional loading with a complete fallback stack, preventing late body-font swaps on slow first visits; Indic fonts retain swap and verified glyph coverage. Registered page introduction copy in message catalogs without changing the English wording or resolved fallback text.

The first pass had 87/88 tests green: broader dark axe found duplicate language/search landmarks and an uncontained mobile CTA. The next pass exposed unnamed translated notice/form asides, plus search tests that ambiguously selected the newly named form as well as its input (81/88 green). Fixed the actual landmark semantics, named Studio panels, and changed those assertions to target searchbox roles. Neither failure was dismissed as polish or hidden by narrowing axe tags. Final full-suite and measured results follow below.

Final corrected checks: **37 unit tests and 88 browser tests pass**, including all 336 locale pages with broad axe rules. Types, lint, formatting, independent copy lock, legacy-name scan, content validation and 340-page HTML validation/build pass. Evidence: docs/evidence/redlark-round-15/checks.log and summary.json. Captured/viewed the English/Malayalam 390/1440 screenshot sets; native policy headings now remain readable, controls fit, and the brutalist grid/type/borders remain consistent. Zero screenshot axe violations, external requests or page errors. Dark native mobile and no-JS editorial pass.

| Mobile route       | Performance median | Accessibility | Best Practices | SEO |
| ------------------ | ------------------ | ------------- | -------------- | --- |
| English landing    | 96                 | 100           | 100            | 100 |
| English collection | 97                 | 100           | 100            | 100 |
| English item       | 98                 | 100           | 100            | 100 |
| Hindi landing      | 97                 | 100           | 100            | 100 |
| Hindi collection   | 97                 | 100           | 100            | 100 |
| Hindi item         | 96                 | 100           | 100            | 100 |

All medians use three consecutive cold-cache runs; raw reports retain individual low samples (including English landing/collection 94). Maximum CLS approximately 0.000032. The prior Hindi Collection failure remains in Round 14 rather than being overwritten.

Public fresh-eyes acceptance: PASS. Remaining priorities are held backend engineering and its unexecutable auth/upload/admin/mail acceptance; native/legal/physical-print review; live domain/provider/CDN verification. These prevent full-project release acceptance and are explicitly recorded in TODO_HUMAN/PLAN/CHECKLIST. No remaining public functional defect above minor polish was found; no real artist content or final translation approval is claimed. Development-only dependency advisory remains documented, with production audit zero. This is the final numbered round (15); no backend work, push or deployment was performed.

## Red Lark Round 14 critique — M9 public editorial and policies

Implemented trusted build-time localized MDX, two marked placeholder posts, four RSS feeds, policy hub/articles, the verbatim AI policy, expanded About, accurate privacy/terms and five contact topics. Current contact remains an email-app handoff. Legal translations explicitly fall back to English; no invented legal sources, artist interview, donation destination or delivered-mail claims. Dependency updates remove production audit findings; the remaining development-only upstream advisory is documented in DEPENDENCIES.md.

Clean lockfile install, 37 unit tests, copy/brand/types/lint/format/content/build checks pass; 340 HTML pages validate. Full browser suite: 83 passed. Evidence: docs/evidence/redlark-round-14, 60 English/Malayalam 390/1440 captures, zero axe violations, external requests or page errors. Login/admin captures are unavailable-service notices, not backend acceptance.

Three-run mobile Lighthouse medians (landing/collection/item): English 96/98/95; Hindi 97/93/96. Accessibility/Best Practices/SEO all 100; maximum CLS approximately 0.000032. Hindi Collection remains a real performance failure. Raw runs retained, including its 93/93/97 samples; no best-run substitution.

Viewed landing narrative/format picker, active collection, item, Studio, About, policy, errors and 404 captures. Brutalist borders/type/palette remain consistent. Ranked remaining issues: (1) Malayalam editorial h1 is technically within bounds but breaks into too many oversized lines; give native editorial headings a considered smaller scale. (2) Hindi Collection text LCP is sensitive to font loading, despite low blocking time and stable layout; reduce late Latin body-font swaps rather than adding unstable layout deferral. (3) Final every-exported-route review in all four languages, dark native pages and no-JS editorial. Round 15 addresses these. Required Supabase/auth/upload/admin/mail work stays held and cannot pass end-to-end acceptance.

## Red Lark Round 13 critique — M6 font-loading correction

Added tiny name-only navigation fonts (5,232 bytes combined), verified pixel/width-identical for all three native names. The active locale reuses its UI font in controls and titles, avoiding duplicate archive-font transfer. Full language fonts remain fallback; archive subsets still serve actual original-script titles. Sixteen affected browser tests pass after the font changes; the prior full suite has 78 passes.

The initial round exposed a new failure from content-visibility on the artist rail: item CLS jumped to 0.44-0.49 and performance fell to 75/77, despite faster loading. Removed that optimization completely. Failed evidence is retained in docs/evidence/redlark-round-13; the corrected cold-cache item follow-up is separate in redlark-round-13-fixed. Corrected item medians: en 95, hi 97; CLS about 0.000032; other categories 100. Unaffected landing/collection medians from the full checkpoint: en 97/98 and hi 97/97. Axe zero throughout; no external requests or page errors.

M6 CREATE passes its public checkpoint. Source checks, copy lock, content/export validation and 316-page build pass. No accounts/uploads/database/admin/mail were implemented. Remaining scope: M9 public editorial/policies and final four-locale route review. Do not reopen performance experiments after the targets pass without a new regression.

## Red Lark Round 12 critique — M6 CREATE and recovery

Added format-first entry, deferred editor font loading, separate coded image/caption libraries, code search, source-preserving image groups/captions and the exact Download for Free action. Existing transforms/layers/palettes/print modes/paper/export/share/privacy tools remain. Build validation checks codes, source eligibility and image layer IDs. The local font bundle now includes licensed Noto fonts. Mobile editing hides the full browse navigation while retaining the wordmark/language/account controls and browser access to the Collection.

Two meaningful recovery issues were fixed: malformed shared scenes no longer replace an existing local draft, and unsupported mixed Indic text stays a recoverable editor error. The first full run found an initial autosave race during empty-canvas recovery (77 passed, one failed). Fixed the application: opening the editor alone never overwrites a draft; edits or an explicit fresh start enable autosave. A separate availability probe preserves storage-unavailable feedback. The unchanged recovery test then passed; final full suite 78 passed (2.3m). Unit suite 34 passed; copy/types/lint/format/content/build green.

Full screenshots and axe: docs/evidence/redlark-round-12, English/Malayalam at 390/1440, zero violations/external requests/page errors. Viewed mobile/desktop Studio: the canvas is now usable after selection, native controls remain within bounds. Performance en 97/98/95 and hi 96/96/94; other categories all 100. Hindi item misses target by one point after the richer M5 page. Ranked next fix: avoid duplicate active-script/archive fonts and preload tiny verified language-name fonts rather than full title subsets; defer rendering the below-fold artist rail. Round 13 measures those concrete changes. M6 UPLOAD and M7/M8 remain held.

## Red Lark Round 11 critique — M5 print-first item pages

Added actual Image Code/Caption Code, file formats/sizes/resolution, truthful generated-placeholder AI disclosure, tags/category links, more-by-artist rail and four-language print instructions with native review flags. Generated real A4/A2 PNG and JPEG files at 300 DPI alongside outlined vector PDFs; checked physical metadata and exact raster dimensions. Updated Indic source artwork to say DRAFT TRANSLATION. No real artist work or invented donation details were added.

Public contact and UPI are independently consented fields. Validation rejects a public artist record containing an unconsented value; rendering also omits either field without explicit consent. UPI copy/link UI is available only when a real consented ID is supplied. Test-only values use visibly synthetic reserved examples and are never seeded. The team inbox is not repurposed as an artist contact.

Checks: 34 unit tests, full browser suite 76 passed (1.9m), copy/types/lint/brand/content/build pass. Four-locale item axe zero. Evidence: docs/evidence/redlark-round-11, item top/specifications/print panel at 390/1440 in en/ml. Viewed native print instructions without clipping. Visual critique caught a new desktop regression: added metadata pushed the download action below the fold. Restored a dedicated desktop action near the title and reran affected checks. Lighthouse repeats at M6; prior measurements are not claimed for this expanded page.

Ranked next work: format-first Studio entry, coded image/caption tools and mobile workspace density; localized MDX/editorial and full policy hub; final four-locale click-through. Backend-dependent contributions/mail remain held.

## Red Lark Round 10 critique — M4 taxonomy and navigation

Wired all 28 canonical categories and ten artwork formats into real collection filters; default remains ALL (Uncategorized). Works have category arrays/free tags and draft-native title/caption/tag search. Filter URLs restore on load, survive language changes, and reset completely. Source placeholders now state their actual 2026 creation year and truthful AI-assisted origin. Category index/counts and sitemap entries are generated. Discover uses categories; old theme paths redirect with locale/query preserved in Netlify Edge and local preview. The header now follows the requested navigation and includes an account control.

Account/login/reset/admin destinations are honest, noindex service-pending notices, collecting no credentials or uploads; they do not satisfy M7. Blog currently explains that editorial placeholders are in preparation; publishing the authored MDX assets remains M9. Explicit backend hold is unchanged.

Checks: 32 unit tests, independent copy test, types/lint/brand/content/build pass; 316 HTML pages validate. Full browser suite: 75 passed, including all category links, combined filters, native search, locale switching, ND gate and axe. Targeted English/Malayalam captures at 390/1440 are under docs/evidence/redlark-round-10. Visual review found the collection introduction unnecessarily tall; compacted it to bring filters/grid closer to the first screen, then reran affected browser checks. No new Lighthouse claim this milestone: the full required checkpoint repeats at M6.

Ranked next work: (1) item codes/AI disclosure, per-field public consent and print guidance; (2) real A4/A2 raster choices; (3) format-first Studio and coded libraries; (4) localized MDX and complete policies. Category emptiness is honestly counted, with no invented contributions.

## Red Lark Round 9 critique — M3 measured checkpoint

Compact browser messages now transmit only translated overrides; keys themselves provide English fallback. Added current-vocabulary Noto UI subsets with full-font fallback. All 424 complete localized strings render pixel-for-pixel and width-identically to full fonts in Edge, including Bengali canonical decomposition and Malayalam chillus. Hindi UI transfer falls from 50,416 to 29,032 bytes. Provenance and source hashes are committed with assets; no remote fonts/scripts are requested.

Full checkpoint evidence: docs/evidence/redlark-round-9. Forty English/Malayalam screenshots captured across 390/1440, including landing top/middle/bottom, filters, item, Studio, privacy, contact/submit errors and 404; viewed representative layouts and native text. Axe reports zero violations, no external requests or page errors. Cold-cache mobile Lighthouse medians (three runs each): en landing 97, collection 98, item 97; hi landing 96, collection 98, item 97. Accessibility/Best Practices/SEO all 100; CLS approximately 0.000032. Raw failures from prior rounds remain in evidence rather than being overwritten.

Canonical English source/rendered copy and all 30 unit tests pass. Build validates 284 exported HTML pages, including category destinations; typecheck and lint pass. Full browser regression: 73 passed, including the 28 category destinations and four accessible policy hubs. Supabase-dependent login/admin screenshots and end-to-end flows remain explicitly held, with no fabricated queue or login success.

Ranked next work: (1) M4 category/format filters still use the previous taxonomy and must consume the new inventories; (2) item codes, AI disclosure, artist consent and print instructions need M5; (3) the mobile Studio header/toolbars consume too much first-screen space and need M6 format-first review. Draft translations require native review. This is M3 acceptance, not full-project completion.

## Red Lark Round 3 critique — M3 first narrative

Rendered Appendix A from the locked files, original poster-wall hero, archive/Studio CTAs, six oversized objective cards, open policy panel, search/language controls and exact category/format inventories. Canonical copy remains unchanged and readable without JavaScript. Full screenshot checkpoint: English/Malayalam at 390/1440; axe zero. Performance medians (landing/collection/item): en 94/95/96; hi 93/95/96; accessibility/best-practices/SEO all 100. Evidence: docs/evidence/redlark-round-3. Ranked defects: Malayalam long words overflow; landing font traffic too large; old collection taxonomy remains for M4.

## Red Lark Round 4 critique — wrapping and archive font subsets

Fixed native paragraph/objective wrapping and 360px category labels. Added small archive-specific Indic subsets for language controls and original-script titles; verified original shaping. Full browser suite: 72 passed. Twenty locale/width combinations have no horizontal overflow. Full screenshots/axe repeated: zero violations. Performance en 98/99/99, hi 96/99/94; other categories 100. Evidence: docs/evidence/redlark-round-4. Ranked remaining defect: Hindi item LCP above target; the narrative and dense poster wall are visually strong, while Studio mobile controls still need M6 review.

## Red Lark Round 5 critique — preload regression

Tested preloading the active full Indic UI font. This regressed Hindi landing performance: 92/97/94 across the three routes, other categories 100. Evidence: docs/evidence/redlark-round-5. Do not treat the prior round as acceptance of this change. Ranked defects: excess font transfer and serialized translations; investigate payload rather than repeatedly measuring unchanged output.

## Red Lark Round 6 critique — active-locale messages

Removed all-locale message imports from the client bundle; only the active locale is supplied by the server. Explicit archive-font preload improves discovery. Performance en 97/98/98, hi 96/96/94, other categories 100; axe zero. Evidence: docs/evidence/redlark-round-6. Hindi item remains below 95. Ranked next changes: stop unnecessary cross-route prefetch and reduce duplicated English fallback data.

## Red Lark Round 7 critique — avoid speculative route fetches

Disabled automatic prefetch in the localized Link wrapper. Network inspection confirms Hindi pages no longer fetch English landing/collection RSC payloads merely because fallback links enter view. Hindi medians 96/96/93, other categories 100, axe zero. Evidence: docs/evidence/redlark-round-7. This privacy/performance cleanup alone does not fix the measured item bottleneck; large native UI font transfer remains the main difference.

## Red Lark Round 8 critique — responsive image discovery

Added an explicit responsive AVIF preload for the priority item image. English item 98; Hindi item 94; other categories 100, axe zero. Evidence: docs/evidence/redlark-round-8. The actual image is already small and promptly fetched; this is not sufficient for acceptance. Next fix is a safely shaped current-vocabulary UI font subset plus omission of redundant key=English-value message pairs. Keep the full fonts as fallback for future text; never remove Indic shaping tables to chase a score.

## Red Lark Round 2 critique — M2 locales and shaping

Added four prerendered locale trees, locale document roots, URL-based switches, canonical/hreflang/OG metadata and locale sitemap entries. A small Netlify Edge function negotiates Accept-Language without cookies and preserves localized 404 status; the preview server mirrors routing. This revises the original full-runtime M2 suggestion: static public pages plus a narrow Edge function are sufficient during the backend hold. The future account/API phase still needs a server runtime. Global-not-found uses the documented experimental Next flag because locale routes have separate root layouts.

English messages contain 422 entries; Hindi/Bengali/Malayalam each include 122 drafted translations and explicit English fallbacks, all reviewed:false. Draft landing assets are complete, with a locked independent English fixture and server-rendered copy tests ready for M3. Self-hosted Noto script subsets serve UI; full fonts and a pinned HarfBuzz runtime serve only the lazy Studio. Actual Malayalam text crashed fontkit even with full fonts; HarfBuzz was verified in Node/Edge for all three scripts, conjuncts and chillus. No runtime external requests were needed. French/Spanish studies are replaced with three original Indic placeholder studies.

Checks: 29 unit/copy/shaping tests passed; typecheck/lint/build green; 168 exported HTML files validated. Full browser run found one translated-fragment spacing defect (68 passed, one failed); fixed the actual spacing and reran all eight affected interaction/locale tests successfully. All four locale core-page axe checks passed. The next full run is at M3. Malayalam home/contact screenshots at 390/1440 were viewed; scripts remain legible without clipping. English fallback is deliberately visible rather than pretending translations are reviewed.

Ranked remaining issues: (1) replace the previous landing with the exact-copy narrative; (2) finish categories/item models and UI; (3) measure the larger multilingual bundle with Lighthouse and reduce it if needed. Native review remains a human task. No Supabase implementation or deployment.

## Red Lark Round 1 critique — M1 foundations

Replaced source/content/package branding, authored original geometric lark/splatter/flame/cursor SVGs, regenerated icons/OG/print bundles, fixed corrupt quote strings in source JSON and generator, consolidated placeholder credits under The Wet Ink Workshop, added a single allow-listed repository constant and a build/CI legacy-name scan. Old branded evidence/assets were retired from the working tree; Git history retains prior evidence. New M1 captures are under docs/evidence/redlark-m1.

The owner supplied redlarkworkshop@gmail.com; it is displayed obfuscated and used for the honest email-app handoff. Backend delivery remains held. One-time validated storage migration retains drafts/bookmarks and does not remove old data on failed writes.

Validation: production build/content/export checks green; 64 Playwright tests including route axe and five-width layout checks passed; model suite corrected after consolidating the two placeholder artist records (a test assumed a second artist). Typecheck, lint and formatting pass. The independent copy test belongs to M3 and is not claimed yet. Production localhost origins now fail; no live deployment is claimed.

Viewed 390/1440 home and contact captures. The longer wordmark fits and the grid remains dense. Ranked next issues: (1) exact deck copy and landing sequencing; (2) locale routes/Indic fonts; (3) taxonomy/item detail extensions. This foundation is not acceptance of M2-M9.

## RED LARK WORKSHOP: planning checkpoint, 16 October 2026

Step 0 only: audited source/deck text, created redlark branch, wrote AUDIT/PLAN/COPY_QUESTIONS, separated public work from the explicit Supabase hold, and recorded human prerequisites. No application/runtime/provider changes. This is not an implementation round or milestone PASS; no new Lighthouse/axe/build result is claimed.

Ranked findings for the next implementation rounds:

1. Do not begin backend-dependent auth/upload/admin/mail integration before the owner's hold is released. Never replace real end-to-end acceptance with mock success.
2. Repair mojibake in source generation and every derived asset; enforce production-origin metadata and verify the actual deployment.
3. Lock Appendix A independently and test rendered copy; rebuild original brand artwork and audit embedded credits/storage migrations.
4. Plan Indic shaping in exported graphics, not only browser fonts. Establish new multilingual visual/performance evidence.
5. Move to a Netlify server runtime for language negotiation and eventually private session routes, while keeping public content prerendered. Resolve provider retention/residency and httpOnly server-only auth design before activation.

The numbered rounds below are historical evidence for the previous implementation and do not certify the new brief. The new implementation must run its own five-to-fifteen critique/fix rounds.

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

## Round 2 critique

Added compressed text delivery, immutable framework asset caching, portable aliases for static Next segment requests, larger artist-credit targets, WCAG 2.2 AA axe checks, first-invalid-field focus, mobile poster download entry, mobile focused-control avoidance, scene validation, fitted outlined type and bounded texture density. Expanded to 55 browser tests: real PDF/PNG/ZIP/tiled files, PNG dimensions/resolution, local upload re-encoding, sharing restrictions, keyboard/lock/hide/reorder/remove/undo, storage/font/unsupported/corrupt-share states and client navigation. All checks and tests pass, with zero axe violations. Viewed all required light/dark screenshots at 390/1440.

Lighthouse: Home **94/100/100/100**, Collection **98/100/100/100**, Poster **99/100/100/100**. CLS remains ~0.00003. Home performance still misses the threshold; record FAIL, not a rounded-up pass.

Remaining weaknesses, ranked:

1. Home's simulated text LCP is still ~3 seconds. Reduce text transfer further with Brotli, turn off unnecessary prefetches and emit responsive local image derivatives instead of always offering 700px previews.
2. Studio mobile chrome uses too much of the initial viewport; compact its introduction. Selection blue introduces an unnecessary second accent; use a neutral patterned selection treatment.
3. Active-filter screenshots should focus on the actual sticky bar and results, rather than spending the viewport on the collection introduction.
4. Clear all bookmarks needs an explicit action; resetting search filters must also clear stale URL search state. Validate environment files consistently and strengthen content validation for asset references.
5. Add actual pointer resize/rotate/zoom tests, empty canvas/export-failure checks and analytics DNT/payload tests. The existing tests prove the main workflow, but not every control branch yet.

The shorter mobile Home and early poster CTA resolve the biggest presentation weakness. Print downloads and credited poster layouts remain dominant. No visual overlap or horizontal document scrolling at tested sizes.

## Round 3 critique

Added Brotli with gzip fallback, disabled unnecessary shell prefetches, generated responsive 240/400/700px local AVIF/WebP images, enforced variant availability, compacted mobile Studio, used neutral dashed selection outlines, bounded pointer resizing, added clear-bookmark/search-reset actions, loaded local environment configuration consistently, and regenerated all seed files to match the fitted-text renderer. Corrected the black-and-white seed flag/artwork mismatch. Active-filter captures now show the bar and actual results.

All install/typecheck/lint/format/content/build checks, 10 model tests and **58 browser tests** pass. New tests exercise pointer movement/resize/rotation, zoom/pan/preset changes, bookmark clearing, URL reset, honeypot rejection and recoverable export failure. All required 390/1440 light/dark screenshots were viewed; zero axe violations, zero external requests and zero runtime errors in the review capture.

Lighthouse: Home **97/100/100/100**, Collection **99/100/100/100**, Poster **98/100/100/100**. CLS ~0.00003. All measured targets now pass, but the minimum five-round protocol is not complete.

Remaining weaknesses, ranked:

1. Harden compressed share-state decoding with an explicit output memory bound. The existing length check occurs after decompression.
2. Prove analytics' DNT and content-omission behaviour under configured test conditions, not just its disabled default.
3. Clarify how user-added material is licensed on export; source credits should not imply an automatic CC0 dedication of arbitrary uploads. Preserve mandatory ShareAlike terms while distinguishing source rights from user additions.
4. Verify touch pinch and smaller/full-size paper exports, not merely mouse zoom controls. Check the real PDFs' declared page boxes and raster dimensions.
5. Checklist generation must key PASS to recorded green checks and an explicit final fresh-eyes review, rather than round number alone. Document the compression/static-file requirements for production hosts.

Appearance is consistently raw and usable. The filtered grid now communicates bilingual titles, artist, region, file metadata and saved controls together. Mobile Studio shows more paper and keeps a separate bottom toolbar. Remaining presentation choices are minor polish; the next round focuses on trust boundaries and proof.

## Round 4 critique

Replaced the share codec with version-tagged deflate/base64url and a fixed 160,001-byte output buffer; oversized decompression is rejected before JSON parsing. Distinguished source permissions from user-added rights, while retaining mandatory ShareAlike adaptation licences. Added uploaded-image result-size/layer limits. Checklist generation now requires recorded green commands/browser results and an explicit fresh-eyes acceptance marker.

All install/typecheck/lint/format/validation/build checks, **13 model/privacy tests** and **61 browser tests** pass. New tests cover decompression bounds, analytics DNT/off-origin rejection/content omission, touch pinch, every paper PDF page box, A2 PNG dimensions and sharing a credited remix into a second tab. Zero axe violations. All required 390/1440 light/dark screenshots were viewed; no new visual defect.

Lighthouse: Home **92/100/100/100**, Collection **99/100/100/100**, Poster **99/100/100/100**. Home has 230ms simulated blocking time in this fresh pass; the failure is recorded despite Round 3's 97. CLS remains ~0.00003.

Remaining issues for the fresh-eyes round:

1. Shrink the catalogue hydration boundary: Studio source scenes should not be serialised into a browsing grid or bundled with artist-only search data. Remove needless initial filter state updates. Record repeated cold-cache runs and their median to expose variability, rather than selecting the best score.
2. Community must accept file-based human curation, not be a permanently hardcoded empty page. Keep its checked-in list empty until reviewed contributions exist.
3. File ingest must require year/region/booleans/safe preview paths and original-language labels consistently. Real contributions must not inherit hardcoded PLACEHOLDER badges or claims that all content is CC0.
4. Expose the openly licensed local font pack as a downloadable bundle alongside graphics packages. Artist links should be visible when supplied.
5. Final review must click through actual navigation, recheck form focus/honeypot/unavailable delivery and ND gate, and inspect an empty/recovered Studio. Only then write the fresh-eyes acceptance marker.

These are bounded fixes within the stated mission. No accounts, database, remote assets, fabricated submissions or invented contact details are introduced.

## Round 5 critique — fresh eyes

Re-read the mission and all nineteen requirements against the final source and UI. Split the client search/artist index from full poster content, stripped Studio scenes and duplicate file variants from collection hydration, and removed unnecessary initial state updates. Home HTML now contains no Studio-layer data. Community reads an initially empty, validated list of approved non-placeholder poster slugs. Added real font-kit download, visible supplied artist links, safe ingest fields, conditional placeholder labels, and consistent single-ink additions/colour replacement.

Install, strict typecheck, ESLint (zero warnings), Prettier, content validation, static build/internal-link validation, **14 model/privacy tests** and **65 Playwright tests** are green. The fresh-eyes clickthrough visits all 18 posters, both artist pages and all seven theme pages through real index links; the every-route smoke/axe suite covers all 42 explicit public page routes plus unknown-URL behaviour. Contact/submit required-field/reply/unavailable-inbox/honeypot paths are exercised, first-error focus verified, ND fixture rechecked, and a truly empty Studio is restored and made usable. Pointer/touch, storage/network/unsupported states, share/recovery, real exports and source credits remain green.

Viewed all sixteen required 390/1440 screenshots (including light/dark Home). The result is recognisably brutalist and collection-led: hard rules, blunt condensed type, no rounded/blurred panels, dense bilingual records, visible rights and direct print actions. No overlap, contrast failure, unexpected layout scroll, generic marketing section, fabricated community entry or misleading delivery claim was found. Minor polish opportunities only: longer real titles may benefit from curated line breaks, and physical prints need a human review on the intended equipment.

### Final measured results

Three consecutive cold-cache mobile Lighthouse runs per key route, with **every raw JSON/HTML report retained**. All nine runs score at least 97 for Performance and 100 in the other categories. Median results:

| Route      | Performance | Accessibility | Best Practices | SEO | Performance samples |
| ---------- | ----------- | ------------- | -------------- | --- | ------------------- |
| Home       | 97          | 100           | 100            | 100 | 97 / 97 / 99        |
| Collection | 99          | 100           | 100            | 100 | 99 / 99 / 97        |
| Poster     | 98          | 100           | 100            | 100 | 98 / 98 / 99        |

Maximum CLS across all runs is **0.0231**, below 0.05. Round screenshot axe and every-route axe have zero violations. Review capture has zero external requests and zero page runtime errors. Prior low scores remain in earlier rounds; none were deleted or promoted to PASS.

**Round 5 fresh-eyes: PASS**

No technical checklist failure remains. Image search is N-A by the brief's permitted coming-soon option; cookie banner is N-A because there is no non-essential storage/tracking. Real mailbox, legal review, permissions, domain/hosting, optional analytics operation and physical print approval are explicit human launch actions in TODO_HUMAN. The repository remains local on `rebuild`; no deployment, push or external communication was performed.

## Backend round 2 — account/runtime implementation and visual critique

Implemented server-only Supabase clients, encrypted server-side Auth tokens behind opaque secure HttpOnly/SameSite cookies, PKCE callbacks, password and email-link signup/login, recovery, global logout, data export/deletion choices and TOTP enrollment/fresh verification. Contributor profile fields are private by default; per-field and per-work consent are independent. Separate Netlify Functions preserve the public static export. Local development uses the same handler through a bridge.

Evidence: 45 unit/policy tests pass; 36 four-locale auth/account/admin/upload/takedown browser checks pass with zero axe violations using explicit API fixtures. Viewed English/Malayalam desktop/mobile screenshots in backend-round-2. The blunt type, hard borders and paper/red system remain consistent. Ranked issues found: (1) tightly adjacent login buttons/links; fixed with spacing and 44px targets; (2) the English Administration heading wrapped awkwardly; replaced by a shorter localized Admin review label; (3) desktop profile column stretched for the entire upload form; changed grid alignment; (4) hosted signup/recovery still requires owner SMTP/callback confirmation and a real verified account. Screenshots/fixture tests are not counted as hosted Auth acceptance.

Hosted follow-up: all three migrations and private seeds now apply over verified TLS; anonymous hosted reads hide private drafts. Real R2 scope/isolation and elapsed five-minute expiry pass, and disposable probes were removed. SMTP sender configuration was corrected by the owner; real contact/team/ack acceptance and stored-message failure behavior pass. The owner confirmed Gmail SPF/DKIM/DMARC PASS. Backend deployment remains prohibited.

## Backend round 3 — upload transaction and private-file review

Applied and tested the atomic upload-finalization, review-transition and category-review migrations. An expired/used ticket or a draft edited during image processing cannot replace the previous file metadata. Images are byte-sniffed, oriented and re-encoded without EXIF/GPS; sanitized PNG, WebP and actual A4/A2 raster PDFs receive randomized keys. A contributor cannot submit while processing. Only sanitized outputs are eligible for publication. Role assignment adds contributor only after verified authentication; it never grants admin. Destructive administrator account deletion also requires fresh TOTP.

Evidence: 47 unit/model/SQL tests pass, including real PostgreSQL transactional replacement and PDF page-box/credit tests; the full baseline 125-browser suite passed, followed by 44 touched-route tests after the native-heading/font changes. Real R2 integration rejected altered keys, unsigned reads and the same signed upload after its actual five-minute lifetime. Discarded probes were removed. Browser CORS, the owned public hostname and real contributor upload still await owner configuration/account verification and are FAIL acceptance rows.

Viewed the refreshed English/Malayalam account captures. The mobile login controls now have separate 44px targets. Native administrative headings were still too large in the broad capture; bounded their font size with a larger line height, and verified the primary CTA fits at 360/390px in all four locales. Desktop profile cards now stop at their content height. A fresh public Lighthouse series found Hindi Collection at 93 performance (all other category medians met 95); retained that failure and removed unnecessary monospace preloading to avoid competing with critical native/display fonts. Re-measurement remains required. New contributions now sort by the complete submission timestamp rather than year/alphabetical order.

## Account pages P2 critique — 20 October 2026

82 initial browser tests passed, including axe checks for every new English/Hindi route, four-locale auth/submit/takedown checks and 360/390 overflow checks. Viewed English desktop dashboard and Malayalam mobile login screenshots: original brutalist typography, strong borders, readable fallback copy and no clipped native heading. The empty dashboard needed an explicit state and admin records needed readable labels; both were corrected. Added inline MFA/profile/deletion/review errors, preserved draft metadata and profile artist names, and expanded upload/export/logout/review tests. Code review also found async service promises escaping the API error boundary; awaiting them now preserves structured errors, with an executable regression test. Full browser regression and performance follow; actual provider acceptance remains separately blocked.

## Account pages P3 critique — privacy and attribution review

The full 175-test browser suite passed after updating one old signup-label assertion. The final code review found two edge cases worth fixing before release: optional analytics could include a private revision pathname, and a single Studio credit line could combine several Indic scripts. Analytics now skips private/auth/admin pageviews and uses a neutral submission URL; credit text is shaped per script instead of producing missing-glyph boxes. Hosted authentication now refuses missing/preview canonical origins. 53 unit/model/RLS/copy tests and typecheck/lint pass. Public performance and final built-bundle regression remain to be measured. The full-history and working-tree secret scan passed after rewording non-secret documentation that triggered its generic heuristic; no allowlist was added.

## Account pages P4 critique — measured mobile layout regression

The full 176-test suite passed, but isolated cold-cache Lighthouse found a genuine header regression: Performance medians en 90/92/92 and hi 91/91/91, with 100 in Accessibility/Best Practices/SEO. CLS was 0.1446 on all routes. Dark-mode hydration changes the theme-control label, making the new sign-in actions and language controls wrap and shift the entire main landmark. Raw reports and screenshots remain in docs/evidence/redlark-round-1-account-pages-p4. The first visual-only harness also needed to choose an upload format before asking the details form to show errors; that harness failure is retained separately, not treated as a website pass.

## Account pages P5 critique — stable mobile header

Mobile masthead now uses two stable grid rows: wordmark/account actions, then language/theme controls. Native language links keep their tap targets and the theme label no longer changes the header geometry. A new cold dark/light test at 360/390 passes with CLS below 0.05 and unchanged header height after a theme switch. Final full regression and isolated Lighthouse are running; external account/DNS/deployment/mail evidence remains pending.

Final P5 evidence: 54 unit/RLS/copy tests and all 177 browser tests pass. landing-en 96, collection-en 97, item-en 95, landing-hi 96, collection-hi 97, item-hi 98; every Accessibility/Best Practices/SEO score is 100, CLS is 0. The isolated report records 60 English/Malayalam screenshots and 55 clean route/viewport axe audits. Viewed mobile Collection/Studio/Submit errors and desktop native item/review layouts: thick borders, hard shadows, usable header, no clipped Indic text or overflow. The inbox transition also exposed a duplicate title; the redundant subtitle was removed and the entire suite rerun. No weakness above minor visual polish remains in the automated/public review. Real identity, DNS, publication and mail evidence remain blocked exactly as listed in TODO_HUMAN.md; no production account, approval or delivery is invented.

## Account pages P6 critique — no-JavaScript form privacy

The final safety pass identified default HTML GET submission as a credential/message leak risk if JavaScript fails or is disabled. Auth/contact and all private service forms now explicitly use POST; visible noscript notices explain the account/form requirement and email fallback. The no-JavaScript browser test verifies a submitted dummy reset password never enters the address bar, and contact uses POST. Build, typecheck, lint, format and all 54 unit/RLS/copy tests pass. The full expanded 178-test suite is rerunning. Public landing/collection/item content, layout and assets are unchanged from the measured P5 performance pass.

Final P6 validation: all 178 browser tests pass, including the no-JavaScript POST/privacy case and every exported locale page. All 54 unit/RLS/copy tests, typecheck, lint, format, build, canonical-host validation and browser credential-identifier grep pass. The P5 public performance/axe evidence remains applicable to the unchanged landing/collection/item routes. Production dependency audit reports zero vulnerabilities; bundled Netlify API executed with HTTP 200 and private/no-store responses. No backend push/deployment or real-account acceptance is claimed.
