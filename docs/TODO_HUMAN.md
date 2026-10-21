# Human prerequisites for RED LARK WORKSHOP

## Current instructions: optional contributor accounts and password repair

**Leave Supabase Allow new users to sign up ON.** This supersedes every earlier instruction below to turn it off. Contributors may create an optional account; guest contributions remain the default and never require login. Only admin roles require a controlled grant/invitation and mandatory authenticator verification. Existing admin passwords do not require disabling public signup.

After the updated PR is merged and deployed: Staff login (or the Sign in link on Submit) -> Forgot password -> open the reset link in the same browser -> enter your new password. If your account has MFA, verify the authenticator code shown directly on the password page, then click Set new password again. No password, email link or authenticator secret should be sent in chat. A lost authenticator still requires a separate identity-verified recovery process; this fix does not bypass it.

Merge/deployment confirmation, native review of draft translations, and legal review remain human steps. No Supabase setting, real account or real password was changed during testing.

## Staff-only release follow-up (21 October 2026)

- **Supabase:** Authentication -> Sign In / Providers -> **Allow new users to sign up: OFF** -> Save. Hosted read-only settings found it ON. Both website signup APIs already deny requests; this additional provider switch blocks direct public Auth signup. It cannot be changed with the configured project API keys.
- **Merge/deploy:** merge the prepared redlark pull request into main, then let Netlify deploy. Migration 202610210010_staff_access.sql is applied. Existing staff accounts and real artwork are untouched. Automated review acceptance uses disposable artwork.
- **Your password:** Staff login -> Forgot password? -> reset in the same browser -> Use a password instead. Keep mandatory authenticator verification. Never send a password, PIN or verification link in chat.
- **Future staff:** run `npm run admin:invite -- <staff-email>` from the trusted checkout. No real invitation has been sent during testing. Existing verified website accounts use admin:grant instead.
- Native review of draft hi/bn/ml additions and the existing legal review remain required. New untranslated staff/audit strings fall back visibly to English with reviewed:false.

Older checkpoints below are historical. Public signup and optional public contributor-account instructions are superseded by this staff-only release.

## Current owner follow-up (21 October 2026)

The upload/review repairs are implemented and tested locally on redlark. No new Supabase, Cloudflare or Resend resources are required. This list supersedes the older setup/hold checkpoints below.

1. Review and deploy the branch through the normal merge/release flow. Confirm the existing Netlify configuration has PUBLIC_CATALOGUE_ENABLED=1 in Build and Functions and a real NETLIFY_BUILD_HOOK before publishing real works. Migrations 202610210007, 202610210008 and 202610210009 are already applied to the configured project.
2. Use the existing website admin account and verify a fresh authenticator code, then open /en/admin/review/. Its admin role and enrolled authenticator were confirmed read-only; they do not need to be recreated. For another admin: verify their website email first, then use the admin:grant command in README.md from a trusted configured checkout with their verified email; they must enroll/verify MFA before administration.
3. After deployment, confirm the new team/contributor notifications reach the intended inboxes and approval completes a real production rebuild. Test transports were intercepted; no production deployment or new notification inbox delivery is claimed. Guest optional contacts are unverified, so guest status is provided by the private receipt instead of emailing arbitrary addresses.
4. Obtain native review of the new Hindi/Bengali/Malayalam controls, licence/category/tag wording and legal English fallbacks. These remain reviewed:false. Existing legal review, real artist permissions and physical print approval remain human responsibilities.

Detailed workflow: README.md and docs/DEPLOY.md. There are no unresolved engineering failures in the five requested repairs. Earlier historical provider prerequisites should not be read as instructions to re-provision completed infrastructure.

## Guest contribution checkpoint — 21 October 2026

No new provider configuration or credentials are needed for guests. The additive migration is already applied; deploy the redlark changes, then check real guest upload -> fresh-MFA admin review -> approval/public file in all four locales -> takedown. Real local-browser/private-service upload and receipt acceptance already passed using cleaned-up fixtures. Guest receipt/privacy/admin labels need native hi/bn/ml review; reviewed:false remains. Approve the draft legal wording/90-day receipt retention and artist permissions before a full public launch. Earlier account prerequisites apply to administrators and optional dashboards, not guest contributions.

## Prior account-page prerequisites

21 October administrator update: website signup/email/sign-in/TOTP are complete and guarded admin bootstrap succeeded. Earlier enrollment requests below are superseded. Deploy the session-write repair, then use the EXISTING authenticator entry to verify a fresh code and open /en/admin/. Do not delete/recreate the authenticator. Real admin publication/takedown acceptance remains pending.

- Revoke the Resend API key exposed in IDE chat context; replace MAIL_PROVIDER_KEY and Supabase SMTP password. Confirm completion without sharing values. A working earlier delivery does not establish the exposed credential is safe to keep.
- Owner chose to create the real website account after deployment: use https://redlarkworkshop.com/en/signup/ with redlarkworkshop@gmail.com, verify its email in the same browser, then enroll/verify TOTP in /en/account/settings/. Signing into the Supabase infrastructure dashboard with GitHub does not create this website account. Run the guarded bootstrap afterward; initial deployment need not wait for administrator creation, but admin/publication acceptance does.
- Complete the owned files.redlarkworkshop.com R2 hostname, pending-bucket upload CORS and approved-file GET/HEAD CORS/lifecycle configuration in docs/R2_DOMAIN_SETUP.md and DEPLOY.md. No broad runtime token or replacement bucket is needed.
- Set the documented Netlify environment variables with Functions/Build scopes, including rotated mail credentials, stable session keys, PUBLIC_CATALOGUE_ENABLED in Build AND Functions, and NETLIFY_BUILD_HOOK. Confirm this before a backend push/deployment. A static frontend deploy alone cannot enable the API.
- Supply a controlled non-Gmail test inbox and authorize its delivery test; inspect SPF/DKIM/DMARC alignment and Reply-To. Previous Gmail Inbox/authentication results remain recorded.
- After deployment, complete real signup/recovery/upload/approval/all-four-locale publication/takedown/export/deletion acceptance with the owner-controlled account. Native Indic review and legal/provider retention review remain required.

## Active backend prerequisites — 19 October 2026

- Rotate the Resend key that appeared in IDE chat context, then update MAIL_PROVIDER_KEY and Supabase SMTP password. Do not paste the replacement into chat. Restart the local API after .env.local changes.

The implementation hold has been lifted. Older hold notes below describe the public checkpoint.

- RESOLVED: verified TLS SQL access, five hosted migrations, private seed and anonymous permission verification pass. Do not share the database password.
- Configure the approved R2 hostname using [R2_DOMAIN_SETUP.md](R2_DOMAIN_SETUP.md). Netlify is authoritative DNS; copy all website/mail/verification records before changing nameservers. Keep pending private.
- Gmail delivery and SPF/DKIM/DMARC PASS were confirmed by the owner. Inbox placement is confirmed; verify actual Reply-To/header domains; a separate authorized non-Gmail inbox is still needed.
- The owner confirms Supabase SMTP and callback URLs are configured; real account verification is in progress. Initial admin must verify a real login and enroll/verify TOTP before bootstrap. No fabricated account verification.
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

## Upload/review repair follow-up (21 October 2026)

- Native-language review: the new Hindi/Bengali/Malayalam upload controls, licence cards, category names and suggested tags are draft translations (`reviewed:false`). Legal explanatory text currently falls back visibly to English.
- Deploy the repair branch through the normal review/merge flow. Migrations 202610210007 and 202610210008 were applied to the configured existing project; do not re-provision it. Existing R2/mail/build-hook settings are reused.
- Real owner admin role and an enrolled authenticator were confirmed read-only. The owner still needs to sign in and verify a fresh code to review at /en/admin/review/. No real identity was granted or modified during the repair.
- Hosted acceptance uses disposable accounts and real R2/Supabase with intercepted notification/build-hook transports. It does not prove a newly deployed production notification reached an inbox or a production rebuild completed; confirm those after deployment.
