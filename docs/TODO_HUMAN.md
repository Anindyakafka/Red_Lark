# Human prerequisites for RED LARK WORKSHOP

## Active backend prerequisites — 19 October 2026

The implementation hold has been lifted. Older hold notes below describe the public checkpoint.

- RESOLVED: verified TLS SQL access, five hosted migrations, private seed and anonymous permission verification pass. Do not share the database password.
- Configure the approved R2 hostname using [R2_DOMAIN_SETUP.md](R2_DOMAIN_SETUP.md). Netlify is authoritative DNS; copy all website/mail/verification records before changing nameservers. Keep pending private.
- Gmail delivery and SPF/DKIM/DMARC PASS were confirmed by the owner. Inbox placement is confirmed; verify actual Reply-To/header domains; a separate authorized non-Gmail inbox is still needed.
- Complete Supabase custom SMTP and the exact callback allow-list in DEPLOY.md. Initial admin must verify a real login and enroll/verify TOTP before bootstrap. No fabricated account verification.
- Set private/approved bucket CORS and quarantine-only lifecycle in Cloudflare Settings; the restricted Object Read & Write token was refused bucket-configuration access. Do not broaden the runtime token.
- Create a Netlify production build hook and save NETLIFY_BUILD_HOOK locally/server-side. Public publishing/takedown acceptance needs that hook and the approved-file hostname.
- Confirm scoped Netlify server variables before backend deployment; local secrets are not automatically uploaded.
- Native review of new Hindi/Bengali/Malayalam account/upload/admin strings remains required; drafts and English fallbacks stay visible.

Implementation checkpoint: 16 October 2026. Supabase implementation remains explicitly on hold. The public branding/archive/Studio/editorial work needs no backend keys; enter eventual secrets in scoped hosting settings, not chat or Git.

| Decision                    | Required human action                                                                                                                                                                                                        |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend hold                | Release the hold before any Supabase SDK/schema/auth/storage/RLS/admin integration. Choose project owner, region, residency, retention and budget first.                                                                     |
| Supabase project and keys   | Later create/provide the project and scoped configuration; service-role credentials remain server-only. No project or credentials invented.                                                                                  |
| Administrator               | Later nominate the initial admin and approve a documented server-side bootstrap; no client-chosen roles.                                                                                                                     |
| Contact inbox               | Owner supplied redlarkworkshop@gmail.com. Verify mail-app workflow on devices; server delivery awaits M8.                                                                                                                    |
| Mail provider               | Choose transactional provider/SMTP; verify sending domain and MAIL_FROM; approve retention and configure test delivery before real traffic.                                                                                  |
| Repository and Netlify name | Rename the repository and site/domain when ready; supply the canonical production SITE_URL and configure callback/reset URLs after auth design. The current repository URL remains only in the future allow-listed constant. |
| Languages                   | Native review of all Hindi, Bengali and Malayalam UI, landing, legal and print guidance. Drafts stay reviewed:false until approved; verify actual-device glyphs/exports.                                                     |
| Legal                       | India-specific review of terms/privacy/takedown, acceptable use, account deletion/anonymization, and whether a named grievance officer is required. Approve a real takedown SLA; do not invent one.                          |
| Provider logging            | Verify Netlify/auth/storage/mail logging and retention. Application non-retention alone cannot establish a blanket no-IP-storage promise.                                                                                    |
| Analytics                   | Optional self-hosted cookieless service/domain; default disabled. Approve retention and same-origin configuration; no trackers or identifiers.                                                                               |
| Artwork rights              | Obtain actual artist permissions, explicit licences, credit/source/alt and remix eligibility before replacing CC0 placeholders.                                                                                              |
| Public contact and UPI      | Artists opt in separately per public field. Supply real site donation details only if approved; never infer public consent from signup.                                                                                      |
| Physical printing           | Approve sample print quality, Indic shaping, sizes, colours, trimming and distribution guidance on actual printers.                                                                                                          |
| Deck provenance             | Decide whether to track or retain the supplied PPTX outside the shipping repo. It is currently untracked and contains unknown-licence media; do not deploy or copy those assets.                                             |

Native review includes the drafted blog and print guidance. Non-AI legal articles currently use explicitly flagged English fallback: native legal translations still need to be supplied and reviewed. Approve an actual takedown response schedule; the public draft visibly marks its SLA as pending.

Before publishing, rename/configure the Netlify site/domain as intended and verify SITE_URL, real localized 404 responses, sitemap/OG URLs, security headers and device mail-app handoff on the live CDN. No deployment, DNS change or provider setup has been performed here. The team inbox is already supplied; it is not an outstanding request for an address.

Engineering status and held backend requirements remain in PLAN/CHECKLIST/ITERATIONS; they are not converted into human tasks or PASS entries. The development-only upstream dependency limitation is documented separately in DEPENDENCIES.md. Public implementation is not full account/upload/admin/mail acceptance.

## Round 15 acceptance boundary

The explicit backend hold prevents the remaining required acceptance flows: email/password sessions and verification/reset; account export/deletion; relational schema/roles/RLS tests; server-sanitized pending uploads and private storage; contributor status/dashboard; admin approval/takedown/audit/publishing; persisted contact/takedown with daily-hash limits, retries and provider-delivered acknowledgements. These are future engineering work after authorization, not completed features or requests to supply keys now. Consequently signup -> upload -> approval -> collection and contact -> database -> delivered test email cannot be run in this phase.

Human prerequisites before that work are release of the hold, project/region/retention ownership, approved administrator, verified mail sender/provider and legal decisions. Native review, real artwork permissions, physical print approval and live Netlify configuration remain separate launch prerequisites. The supplied inbox is already configured. This repository has not been pushed or deployed.
