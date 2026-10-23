# RED LARK WORKSHOP: staged implementation plan

## Public simplification — 23 October 2026

| Milestone                 | Status  | Delivery and acceptance                                                                                                                                                                |
| ------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Workshop public naming    | PASS    | `/workshop` is canonical; legacy `/studio` URLs permanently redirect.                                                                                                                  |
| Types and Writing         | PASS    | Public classification is Type while `kind` filter URLs remain stable; Writing has a text-card fallback.                                                                                |
| Historical Archive        | PARTIAL | Localized `/archive` has filters, timeline/grid and pagination. The static build now merges the sanitized `archive_catalogue()` snapshot; only the explicit historic backfill remains. |
| Takedown workflow removal | PASS    | Dedicated page, policy article, endpoint and private admin workflow removed.                                                                                                           |
| Contribute-first upload   | PASS    | Guest quick upload is first, needs right-to-share consent, defaults to CC0 and flags missing details. Images and reviewed Writing uploads are supported.                               |
| Short landing             | PASS    | Hero, concise About and a compact ten-work usable preview replace the long landing wall.                                                                                               |
| Navigation                | PASS    | Contribute is a high-visibility CTA; navigation scrolls below 1100px instead of wrapping.                                                                                              |

## Approved-work publication repair — 23 October 2026

| Work                          | Status  | Acceptance                                                                                                                          |
| ----------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Diagnose missing contribution | PASS    | Public RPC and R2 image present; live Collection missing work and poster 404; supplied Netlify log confirms duplicate artist titles |
| Repair artist metadata        | PASS    | Existing public archive IDs distinguish duplicate names; visible names/credits remain unchanged                                     |
| Verification                  | PASS    | 79 unit tests, typecheck/lint; real two-work build validates 420 HTML pages; 20 locale browser checks, axe 0                        |
| Production recovery           | PENDING | Merge repair and wait for successful Netlify deployment; no reupload or reapproval                                                  |

## Studio workspace repair — 22 October 2026

| Problem                            | Status | Acceptance                                                                                                                                                  |
| ---------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Audit before editing               | PASS   | docs/STUDIO_AUDIT.md; running desktop/tablet/phone screenshots and measured controls                                                                        |
| Clean canvas / attribution exports | PASS   | Separate canvas/export renderer, persistent source metadata, opt-in CC0/default-on attribution credit, PNG/PDF/SVG metadata; focused tests + typecheck pass |
| Compact accessible options         | PASS   | One overlay at a time, keyboard/focus/outside dismissal, no canvas reflow; retain every audited feature                                                     |
| Non-destructive crop               | PASS   | Eight handles, move/ratios/numeric controls, rotated geometry and export/local persistence                                                                  |
| Viewport gestures                  | PASS   | Midpoint zoom, viewport pan, wheel/keyboard/touch, fit and consistent coordinates                                                                           |
| Final verification                 | PASS   | 78 unit + 274 unique browser tests; final 91/91 rerun; viewed 1440/768/375 screenshots; full details in STUDIO_REPORT.md                                    |

## Contribution navigation and one-day admin verification

| Work                          | Status | Evidence                                                                                                                        |
| ----------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Landing contribution CTA      | PASS   | Contribute immediately after Open Studio; navigation-session browser checks                                                     |
| Public account entry          | PASS   | Header Log in / Sign up restored; account menu dismissal regression passes                                                      |
| Admin badge                   | PASS   | Numeric pending count only when available; no exclamation mark                                                                  |
| One-day MFA                   | PASS   | Owner explicitly chose 24 hours; API + new migration 202610210011 match; unit/RLS boundaries pass                               |
| Language controls and labels  | PASS   | 20 locale/width geometry + axe checks; 396 HTML files contain no rendered brackets; saved comparisons viewed                    |
| Final UI/session verification | PASS   | 71 unit/copy/RLS and 249 unique browser tests after targeted rerun; disposable hosted refresh proof                             |
| Performance verification      | PASS   | docs/evidence/navigation-session/lighthouse.json: en medians 96/98/98; hi 96/96/97; Accessibility/Best Practices/SEO 100; CLS 0 |

The requested one-day window supersedes prior ten-minute instructions. A new login/browser or logout still requires MFA; expiry is measured from TOTP verification, not extended on page visits.

## Staff invitation repair

| Work                                     | Status | Evidence                                                                                                         |
| ---------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------- |
| Diagnose wrong hostname                  | PASS   | Owner confirmed localhost refused connection; local SITE_URL unset; live endpoint exists                         |
| Public invitation URL / deployment guard | PASS   | invitationOrigin defaults to canonical production; rejects local URLs; preflights server before creating/sending |
| Explicit confirmation                    | PASS   | Fragment token + button-triggered CSRF POST; GET cannot consume invitations                                      |
| Verification                             | PASS   | Origin/unit, browser, disposable hosted invite and password flow                                                 |

No existing identity/password or real invitation has been modified/sent. Keep contributor signup enabled.

Final evidence: docs/evidence/invitation-fix/. 70 unit/copy/RLS + 46 focused browser tests pass; build/typecheck/lint/format/content/brand/canonical/client-secret checks pass. en/hi at 390/1440 px have axe 0 and no page overflow. Hosted disposable invitation opens without verifying, accepts once, grants no MFA bypass, and sets a password; fixture removed. Public homepage/collection/poster performance is unchanged and not remeasured in this focused repair. Deployment and a fresh invitation remain owner release steps.

## Password reset repair and optional accounts clarification

| Work                          | Status | Evidence                                                                                                 |
| ----------------------------- | ------ | -------------------------------------------------------------------------------------------------------- |
| Reproduce/reset MFA           | PASS   | password-reset/before.json reproduced insufficient_aal hidden as password_update_failed                  |
| Password setting with MFA     | PASS   | password-reset/after.json: verify authenticator, change password, revoke old session, new password login |
| Optional contributor accounts | PASS   | Signup/login/recovery restored, Submit links added; guest flow remains default; no public admin grant    |
| Final browser verification    | PASS   | Password challenge, signup and review regression checks                                                  |

Keep provider signup ON. Earlier staff-only account and provider-OFF directions are superseded; only administrator privileges are invitation/grant controlled.

Final verification: 67 unit/copy/RLS and 51 focused browser checks PASS; typecheck/lint/format/build/content/brand/canonical/client-secret checks PASS. Password/MFA checks cover en/hi at 390 and 1440 px with axe 0 and no page overflow. Real disposable recovery session verified against the configured Supabase project; no real email or password was used. Evidence: docs/evidence/password-reset/. Prior full-browser/Lighthouse evidence is retained for unchanged public-page scope; not represented as rerun here.

## Staff access and review reliability (21 October 2026)

| Work            | Status | Acceptance                                                                                                          |
| --------------- | ------ | ------------------------------------------------------------------------------------------------------------------- |
| Public access   | PASS   | No visitor auth buttons; footer staff entry; guest upload unaffected; signup APIs deny server-side                  |
| Staff setup     | PASS   | Service-only invite/lookup RPCs; disposable hosted invite -> verification -> password -> staff login; no MFA bypass |
| Review recovery | PASS   | Valid decisions, useful errors, one safe CSRF retry, inline fresh MFA preserving forms                              |
| Audit           | PASS   | Collapsed table, UTC range/action filters, 50-row API pagination, mobile and axe checks                             |
| Release         | PASS   | Verified merge branch prepared; owner merges the PR and confirms deployment                                         |

Supabase provider signup setting needs the owner dashboard change in TODO_HUMAN. Website signup already denies requests. Earlier public contributor-account instructions are superseded.

Final evidence: docs/evidence/staff-access/final.json. 67 unit/copy/RLS + 212 full browser + 47 final focused browser checks pass. Typecheck/lint/format/build/content/canonical/client-secret checks pass; commit secret scan has zero findings. Mobile Lighthouse medians: en landing/collection/poster 96/97/96; hi 96/96/95. A11y/BP/SEO 100 throughout; CLS 0. Existing real accounts/artwork were not changed. Production deployment/inbox verification remains the owner release step.

## Current checkpoint: upload and review repairs (21 October 2026)

All five requested repairs are implemented on redlark. Three additive migrations were applied to the existing project; the owner account and its real pending contribution were left untouched. No service was re-provisioned.

| Work                       | Status | Acceptance                                                                                                                     |
| -------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Optional image description | PASS   | 300-character field, deterministic image fallback, strict archive validation retained                                          |
| Tags                       | PASS   | Suggested/free-text chips, keyboard/limits/errors, normalized relational rows, custom flag/editing; unpublished labels private |
| Plain-language licences    | PASS   | Four cards, NC mapping, untouched recommended default and ND gate                                                              |
| Categories                 | PASS   | Searchable checkbox chips; three DB rows through dashboard/admin to three public category pages in four locales                |
| Admin review               | PASS   | Visible badge, compact queue, metadata editor, valid decisions, MFA/RLS, durable notification retry, admin:grant               |
| Final verification         | PASS   | 64 unit/copy/RLS + 202 browser tests; all 392 locale pages axe 0; build/typecheck/lint/format/brand/client-secret checks green |
| Performance                | PASS   | en landing/collection/poster 95/99/96; hi 97/97/97; all other Lighthouse categories 100; CLS 0                                 |

Evidence: docs/evidence/upload-repair/final.json and CHECKLIST.md. Deployment and production inbox/build-hook confirmation remain owner release steps in TODO_HUMAN.md. Indic drafts retain reviewed:false. Older checkpoints below are historical; their backend holds do not apply to this completed repair.

## Guest contributions and interaction repair — 21 October 2026

Implemented optional-account contribution flow at every localized Submit/new-work entry. Guests provide the same licence/AI/categories/alt data without creating an Auth identity; artwork uses the shared private signed-PUT/sanitization/print pipeline. Hash-only receipts authorize exactly one work, expire after 90 days and show read-only review feedback. Separate per-field contact/UPI consent remains mandatory for publication. Account dashboards/editing and fresh-MFA administration are preserved. Additive migration 202610210006 was applied to the existing hosted project.

Interaction fixes: Account closes on outside pointer, Escape (returning focus), focus departure and navigation. Format changes preserve form details. Existing profile saves request an explicit row to avoid false successful-upsert errors. Retry signing reuses an unprocessed ticket; repeat submission is idempotent. Invalid/expired receipts have a recoverable error.

Acceptance: 58 unit/RLS/copy tests and 185 browser tests PASS, including fresh-eyes axe checks on all four locale exports and new guest flows. Real handler AND real browser/CORS tests against hosted Supabase/private R2 PASS; disposable fixtures removed. Anonymous-table denial and changed-file secret scan PASS. English/Malayalam screenshots retained in docs/evidence/guest-submissions. Performance results are recorded there separately. Remaining: deploy this branch and owner-check guest approval/publication/takedown; native review remains required. No new service setup is needed.

## Prior authenticator checkpoint

Superseded by the 21 October checkpoint: real owner TOTP is verified and guarded admin bootstrap succeeded. A hosted probe reproduced a 200/null response for existing session upserts, causing a false 503 after verification. The write now requests token_hash only with single-row confirmation. Hosted repaired insert/update pass and isolated diagnostic rows were cleaned. Typecheck, lint, production build/secret checks and 55 unit/RLS/copy tests pass. Remaining: deploy this session fix and verify fresh MFA/admin access with the existing authenticator.

QR rendering and isolated, selectable manual-key field implemented. Server returns Supabase's enrollment SVG as a data image; no external QR service, logging or storage. Build, lint, typecheck and 54 unit/RLS/copy tests pass; two new English/Hindi browser tests pass with zero axe violations at mobile width. Deployment and the owner's real TOTP verification/admin bootstrap remain pending. New setup labels use explicit English fallback in unreviewed Indic messages.

## Account pages continuation — 20 October 2026

This section supersedes older public-phase holds. Existing Supabase/Postgres, R2 and Resend are reused. Public pages remain static; private shells call same-origin protected APIs. UUID detail addresses are rewritten to localized static shells, with ownership/role/MFA checked independently on the server. No private record is embedded at build time.

| Round | Work                                                                                                                                                                            | Acceptance                                                                   | Status                                                |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------- |
| P1    | Dedicated authentication pages, inbox, verification and logout; profile/settings/new/edit; admin review/inbox/users/audit; session-aware header; canonical/source/contact fixes | 54 unit/RLS/copy tests; typecheck/lint/format; 392-page build                | PASS; full 178 browser tests green                    |
| P2    | Exercise every new route in en/hi; mobile/axe and upload/error/revision flows; inspect en/ml screenshots                                                                        | Playwright, screenshots, no horizontal overflow                              | PASS: 178 browser tests; native screenshots inspected |
| P3    | Public performance, full regression, client/history scans and launch handoff                                                                                                    | 54 unit/RLS/copy tests; 178 browser tests; Lighthouse/axe; evidence retained | Automated PASS; human-only hosted acceptance pending  |

Do not push/deploy the backend until owner confirmation of Netlify server environment scopes. Real signup/admin verification must use a website account, independently of signing into the Supabase dashboard with GitHub.

## Authorized backend continuation — 19 October 2026

The owner's attached infrastructure request lifts the implementation hold. Existing Supabase Auth/Postgres, R2 buckets and email configuration are reused; no infrastructure is re-provisioned. R2 replaces all prior Supabase Storage plans. Initial admin: redlarkworkshop@gmail.com, granted only after verified real login and TOTP. Backend deployment remains prohibited until the owner confirms scoped Netlify server variables. Historical HOLD text below describes the earlier public checkpoint.

| Step | Implementation and acceptance                                                                                                         | Status                                                                                   |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 1    | Migrations, file-based seed, all-table default-deny RLS, role isolation/MFA/bootstrap and executable policy matrix                    | PASS: local + hosted policy checks                                                       |
| 2    | Server-only sessions, localized password/magic-link/verification/recovery, global logout, deletion/export, generic errors/rate limits | IMPLEMENTED; real login/verification in progress with owner                              |
| 3    | Own-work dashboard, scoped/expiring private R2 uploads, sanitization/metadata stripping/previews, abandoned cleanup                   | IMPLEMENTED; hosted R2 scope/expiry pass; browser CORS pending                           |
| 4    | MFA/fresh-auth admin review, audited state machine, private-to-public copies, static publishing and takedown                          | IMPLEMENTED; public hostname/build hook/admin acceptance pending                         |
| 5    | Stored contact/takedown, retryable provider mail, actual delivery/DNS/header evidence and complete integration tests                  | Contact/outage integration PASS; Gmail authentication owner-confirmed; non-Gmail pending |

External acceptance prerequisites: no non-Gmail test inbox supplied (both authorized addresses are Gmail); inbox placement/raw authentication headers require recipient inspection; public R2 hostname is not configured (see R2_DOMAIN_SETUP.md); remote migrations and anonymous permission verification now pass over verified TLS. These do not block writing and locally testing the implementation.

Execution started 16 October 2026 on redlark. Step 0, M1-M5, M6 CREATE and public M9 are implemented. The owner authorized public-site implementation and supplied redlarkworkshop@gmail.com. M6 retains PARTIAL status because UPLOAD is held with M7/M8. M9's public editorial work is complete; final account/mail policies and end-to-end acceptance await the backend hold being lifted.

READY means technically independent of Supabase; PARTIAL means public/browser work can proceed later but backend work is held. HOLD is an explicit scope boundary, not a completed feature or justified N-A.

## Recommended sequence

1. M1-M5: brand, exact copy, languages, landing, categories and item pages.
2. M6 CREATE and public M9 content are implemented. Account/upload/admin destinations are clearly labelled unavailable states; they never pretend to authenticate, save or submit.
3. Stop at the backend boundary. Do not install Supabase packages, create SQL/migrations/seeds/buckets, connect a project or add database adapters during the hold.
4. Once the owner releases the hold: M7, then M6 UPLOAD and M8, then final M9 policy/acceptance work.

## Original milestone plan (historical; continuation above is current)

| ID  | Tasks                                                                                                                                                                                                                                                                    | Likely files                                                                                                                                                              | Acceptance tests                                                                                                                                                                                                                    | Status  |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| M1  | Complete rebrand including generated assets/docs; original lark/splatter/flame/cursor SVGs; favicon/manifest/OG; UTF-8 repair/regeneration; production origin; env contract; in-house credits become The Wet Ink Workshop.                                               | src/config/site.ts; scripts/check-no-legacy-name.mjs; scripts/seed.ts; src/lib/metadata.ts; src/lib/site-origin.ts; public; content; package/lock; docs; .env.example; CI | No legacy name except one repository constant; inspect embedded asset credits; validate one-time draft/bookmark migration; production canonical/OG/Twitter URLs absolute/non-local; Unicode regression.                             | DONE    |
| M2  | Four locale routes/messages, root Accept-Language redirect, URL language choice, hreflang/sitemap/metadata; self-host Noto Indic fonts; draft flags and visible fallback; replace French/Spanish placeholder studies. Enable Netlify runtime for negotiation without DB. | src/app/[locale]; src/i18n; messages; content/copy; public/fonts; content/posters; next.config.ts; netlify.toml                                                           | Deep links/switcher/fallback; html lang and alternates; reviewed:false warnings; 390px conjunct/chillu/font checks; no remote font traffic; language redirect cache correctness.                                                    | DONE    |
| M3  | Appendix A verbatim, blocks in order and both policy links; scroll narrative, progressive/reduced-motion layout, archive/Studio CTAs, search/language controls, then category/format steps.                                                                              | content/copy/landing.en.json and locale files; landing components/styles; tests/copy.test.ts                                                                              | Independent exact Appendix A fixture versus JSON AND rendered block text, curly quotes/order included; no-JS/reduced-motion; full checkpoint QA.                                                                                    | DONE    |
| M4  | Exact 28 categories and 10 formats; free tags; ALL (Uncategorized) default; category pages, dense filters/live count/newest; required navigation/routes, localized redirects for existing theme routes.                                                                  | content/categories.json; content/formats.json; model/query; shell/collection; locale routes                                                                               | Exact inventories; combined filters/search/sort; every route/redirect; no dead account/upload links or pretend account functionality.                                                                                               | DONE    |
| M5  | Image/caption codes, genuine print sizes/DPI, AI badge, consent-gated contact/UPI, more-by-artist, tags/licence/source/download labels, four-language print guidance.                                                                                                    | item/artist routes; model/validator; content; messages                                                                                                                    | Missing licence/credit/source/alt rejected; ND has no remix; unconsented info absent from HTML/JSON/exports; actual files/dimensions; draft translation flags.                                                                      | DONE    |
| M6  | CREATE format-first; coded image/caption libraries, existing tools/export/privacy, Indic text exports, exact labels/print note. UPLOAD requires future accounts, sanitization, storage and review; hold that implementation.                                             | src/studio; content/images and captions; studio/submit UI; browser tests                                                                                                  | Transform/undo/mobile/print modes; 300-DPI PNG/PDF/tiled/share/autosave; shaped Indic conjuncts/chillus; source credit/derivative gates; real upload checks only after M7; full checkpoint QA.                                      | PARTIAL |
| M7  | Future server-only auth/verification/reset/logout-all/export/delete; roles, schema, RLS, storage/sanitization, review/admin/dashboard and publish revalidation. No implementation during hold.                                                                           | future src/server/API; auth/account/admin routes; supabase/migrations; seeds; RLS tests                                                                                   | Real test Supabase policy matrix for every table/bucket; anonymous/owner/other/admin; no role escalation; CSRF/revocation/cache isolation; hostile uploads; status transitions; export/anonymize/delete; approval appears publicly. | HOLD    |
| M8  | Future persisted contact/takedown, provider delivery/team mail/auto-ack, validation/honeypot/minimum time/daily-hash limits, idempotent retries and honest failures. No mailto substitution for acceptance.                                                              | future API/contact/takedown; src/server/mail; admin inbox; env/docs                                                                                                       | Stored message plus team/sender test-mode delivery; DB/mail partial failures; no duplicate ack on retry; rate-limit expiry/no raw IP logs; accessible errors; real inbox; full checkpoint QA.                                       | HOLD    |
| M9  | About; verbatim AI policy; policies hub/guidelines/licensing/takedown/privacy/terms drafts; localized MDX/two explicit placeholders/tags/RSS; 18 CC0 studies. Final account/mail policy depends on M7-M8.                                                                | localized pages; content/blog/copy; RSS; README; docs                                                                                                                     | Exact policy copy; RSS escaping/metadata; localized routes/legal banners/review flags; seed/licence counts; full end-to-end release acceptance after hold lifted.                                                                   | PARTIAL |

## Design and implementation contracts

- English copy: Appendix A is canonical. An independent exact fixture must test JSON and server-rendered text, including objective order and repeated policy links. Comparing the file to itself is insufficient. No silent editorial snapshot updates.
- Taxonomy: categories are many-to-many; tags are separate. Artwork formats (Badge through Zine) differ from file formats (JPEG/PNG/PDF). Preserve the supplied default label without treating every work as uncategorized.
- Locale content: per-locale title/caption/tags and reviewed flags, visible English fallback, no empty UI. Draft translations remain reviewed:false until native review. Self-hosted fonts alone do not establish correct SVG/PDF exports: the current outline engine needs verified Indic shaping support in M6.
- Rebrand: one allow-listed repository URL constant only. Derive old storage prefixes from its repository pathname rather than copying the forbidden name into a second literal. Validate old scenes, write once, remove old keys only after a successful write and recover from unavailable storage. Rebuild raster/vector/PDF/ZIP assets and check embedded credits as well as text source. Decide how to retire historical branded screenshots/reports before declaring the new scanner PASS.
- Licences: preserve build validation and ND remix gate. Default new uploads to CC BY-SA 4.0 with all requested alternatives, clear ND explanation and ShareAlike compatibility checks. AI disclosure does not replace rights validation.
- Public artist name/contact/UPI are optional; publication requires independent field consent. Private auth email is needed for email login and must never become public contact automatically. Pseudonyms are valid.
- Future sessions: same-origin endpoints, server-only provider clients, httpOnly/Secure/SameSite cookies, CSRF protection, private/no-store account/API responses and verified global logout. Keep public prerendered pages independent of sessions. Use user-scoped RLS for routine operations, tightly bounded service-role operations only.
- Future uploads: explicit draft -> pending -> approved | changes_requested | rejected | taken_down transitions and resubmission rules; review audit trail; private originals, sanitized public derivatives after approval. Server type sniffing, random filenames, size/pixel limits and metadata stripping are mandatory. Start with required raster inputs; do not enable SVG/PDF uploads without a verified sanitizer.
- Future mail: recommend a transactional provider such as Resend through server-only code, subject to domain verification and retention review. Use a mail sink/provider test mode in development. Persist failures and retry idempotently; never claim delivery merely from accepting a form.
- Hosting and providers can keep logs independently of application code. Decide region, retention and deletion before provider activation; daily salted/HMAC rate-limit records need short TTL/purge and must not record raw addresses.

## Environment contract to implement in milestones

| Variable                                     | Purpose/scope                                                                                                                                |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| SITE_URL                                     | Production canonical/OG/sitemap origin; reject localhost in production; explicit preview-context behaviour.                                  |
| CONTACT_EMAIL                                | Real displayed inbox; missing value gives build warning and marked placeholder.                                                              |
| SUPABASE_URL / SUPABASE_ANON_KEY             | Held: server provider configuration; never a substitute for RLS.                                                                             |
| SUPABASE_SERVICE_ROLE_KEY                    | Held: server-only privileged operations; never browser/NEXT_PUBLIC.                                                                          |
| MAIL_PROVIDER_KEY / MAIL_FROM / MAIL_TO_TEAM | Held: server-only delivery configuration, verified sender and real team inbox.                                                               |
| ANALYTICS_DOMAIN                             | Optional self-hosted cookieless analytics, disabled by default; DNT; page view/download/Studio export/upload submitted only, no content/IDs. |
| REPO_URL                                     | Source URL mapped to the single validated constant in src/config/site.ts.                                                                    |

Future handlers also need a rate-limit HMAC secret and a protected revalidation/build-hook secret if that publishing path is chosen. Document additions when the hold is lifted. Keep secrets in scoped hosting settings, not Git or chat. The public env contract is in .env.example; no backend keys are needed during this hold.

## Verification protocol

After every implemented milestone: update PLAN/CHECKLIST/ITERATIONS; typecheck, lint, copy test, legacy-name scan, relevant unit/RLS tests, build and touched-route Playwright; commit on redlark. Missing/not-yet-implemented checks are not PASS.

At M3/M6/M8/M9: full suite, axe on key en/hi routes, mobile Lighthouse >=95 in all four categories (Studio performance exemption only). Inspect English/Malayalam 390/1440 screenshots: landing top/middle/bottom, active filters, item, Studio, login, admin, contact errors, 404. Unimplemented auth/admin views stay held; mock views cannot establish acceptance. Test all five layout widths, no JS and reduced motion.

Minimum five critique/fix rounds, maximum fifteen, with measured evidence. Final acceptance needs all checklist rows PASS or genuinely justified N-A, all four locales click-through, signup -> upload -> admin approval -> collection and contact -> database -> test-mode delivered email. Deferred required backend work remains HOLD/FAIL, preventing a false full-project completion. Do not spend fifteen rounds retrying an explicitly held backend.

## Historical public-phase execution boundary (superseded)

Execution is authorized for M1-M5, M6 CREATE and public M9. The real contact inbox is configured. Continue public work without asking again; before backend implementation the owner must release the explicit hold and settle project/region, retention and mail delivery. No backend credentials are needed for public visual/content work. No live deployment or provider configuration is claimed.

Public M9 now includes four localized static RSS feeds, trusted MDX placeholders, the complete policy hub, expanded About and accurate current privacy/terms. Round 14 records 37 unit tests, 83 browser passes, 340 validated HTML pages and its Hindi Collection performance failure. Round 15 adds the comprehensive four-locale public review and corrects native heading/landmark/font-loading issues; final evidence is recorded in ITERATIONS/CHECKLIST rather than inheriting an older PASS. The backend milestone statuses remain unchanged.

Final Round 15 public acceptance: 37 unit tests, 88 browser tests, all 336 locale pages broad-axe clean, source/build checks green. Lighthouse three-run medians en 96/97/98 and hi 97/97/96, all other categories 100. Public scope is complete; M6 UPLOAD, M7 and M8 remain explicitly held. M9 final service-policy/end-to-end acceptance remains PARTIAL until those services exist. No secrets, provider resources, push or deployment are required or claimed for this completed public phase.

## Current upload/review repair (21 October 2026)

| Work                                            | Status      | Evidence / next acceptance                                                                                                  |
| ----------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------- |
| Reproduce five issues                           | PASS        | Five initial failing tests and before screenshots; hosted read-only diagnosis in docs/evidence/upload-repair                |
| Shared form, metadata and review implementation | IN PROGRESS | First five browser regressions now pass; new local PostgreSQL RLS tests pass; hosted migration and end-to-end checks remain |
| Full verification and fresh-eyes review         | PENDING     | Expanded keyboard/mobile tests, real services, axe, full build/suite, secret scan                                           |

Round 2 update: migration applied; disposable Supabase/R2 contributor/admin workflow PASS (including three category pages in four locales); 62 unit tests and 14 focused browser tests PASS; mobile screenshot critique led to removal of redundant MFA setup. Final full-suite/performance/secret verification remains IN PROGRESS.

Round 3: durable original notification feedback and audited retry implemented, tested and migrated; first complete browser suite 201 PASS. Final-source rebuild, follow-up regression/performance measurements and review evidence remain in progress. No change to landing wording or real pending submissions.

Round 4 update: performance acceptance PASS after the recorded Collection notice/font fix; compact queue and review detail are distinct, status-appropriate decisions and visible pending badge verified in browser tests. Final 202-test run is pending after correcting an isolated QA fixture-server configuration failure.
