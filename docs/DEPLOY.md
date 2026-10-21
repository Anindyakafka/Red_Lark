# Backend deployment and owner setup

## Staff invitation safety and deployment

The invitation CLI uses the public SITE_URL, defaulting to https://redlarkworkshop.com even when the local development setting is blank. It refuses localhost/non-HTTPS/preview URLs and preflights the deployed confirmation endpoint before creating or sending an invitation. Do not change local development SITE_URL just to send invitations. Deploy this fix first; a merge is not sufficient until Netlify publishes it.

New invite links use /en/verify/#invite=… so the token is absent from HTTP requests and referrers. The account is verified only after **Accept staff invitation** submits a CSRF-protected POST. Older /api/auth/invite GET links redirect to the confirmation page without consuming the token. Expired/used links show Sign in / Forgot password and reissue guidance rather than raw JSON. Reissue unused invitations with admin:invite; already verified identities use admin:grant plus normal sign-in/recovery. Never paste invitation URLs into chat or issue reports. MFA and service-only grants remain required; optional contributor signup stays enabled.

## Current access model and password setting

This section supersedes the older staff-only signup instructions below. **Keep Supabase Allow new users to sign up enabled.** Guest contributions need no account. Optional contributor signup, login and password recovery are available; Submit links to Sign in / Create a contributor account. Public header auth buttons stay hidden, and the footer Staff login remains a discreet entry. Public signup grants only contributor access; admin roles still require the service-only invitation/grant and fresh TOTP/RLS gates.

An MFA-enabled account must verify an authenticator before setting/changing its password. The reset page now shows the existing authenticator challenge inline when Supabase returns insufficient_aal, retains the typed password only in the page, and asks you to submit again after verification. It does not persist passwords in storage, log them, or use the privileged admin API to bypass MFA. Same-password, weak-password and reauthentication errors have separate safe instructions. A successful reset revokes app/provider sessions and requires signing in again. Use a fresh reset link in the same browser if the recovery session expired.

## Staff-only authentication (21 October 2026)

Public contribution remains account-free. The header has no visitor Log in/Sign up controls; the footer links to **Staff login**. /signup/ is a closed explanation; both signup APIs reject requests server-side. Login and recovery email is sent only for verified addresses with an admin role, with the same generic inbox response for all addresses. Password login checks the same role. Existing data is retained.

**Owner action in Supabase:** existing Red Lark project -> Authentication -> Sign In / Providers (sometimes labelled Providers) -> turn **Allow new users to sign up** OFF -> Save. A read-only hosted check on 21 October found it still enabled. The application already blocks signup; this switch also closes direct requests to Supabase Auth. Email login and service-admin invitations remain enabled. No new project, SMTP service or DNS record is needed. Project publishable/secret keys cannot change this dashboard setting.

To add staff from the trusted checkout, run `npm run admin:invite -- <staff-email>`. Migration 202610210010_staff_access.sql must be applied first (already applied to this project). The service-only command creates an invitation, records the staff role and an audit event, then sends the one-use link through Resend. /api/auth/invite verifies the provider-issued token, checks the staff role, creates an HttpOnly session and opens password setup. Neither address nor token is logged. Invitees cannot sign in before email verification; admin access still requires TOTP. Run only for an intended staff member. For an existing email-verified website account use `npm run admin:grant -- <existing-verified-email>` instead. If delivery fails, correct mail configuration before retrying; no invitation token is printed for manual sharing. Revoke an unused invitation by removing that person's admin role and deleting their unverified Auth identity in Supabase; do not delete an existing contributor or artwork.

For your existing admin password: footer **Staff login** -> **Forgot password?** -> enter your staff email -> open the reset link in the same browser -> choose a unique 12-128 character password -> sign in with **Use a password instead**. Resetting logs out all sessions. Keep the authenticator; there is no shared PIN. Fresh MFA is still required every ten minutes for privileged actions. An expired review shows an inline verifier and retains draft feedback/metadata; verify, then save again.

Audit details default to collapsed. UTC date/time range, exact action filtering and 50-row pagination run on the fresh-MFA API. The browser does not download the whole log. Inbox/user details also collapse. Confirm real email delivery and production reviews after merging; automated hosted checks use disposable identities and intercepted notification transport.

Backend must not be deployed until the owner confirms the server variables are configured. `.env.local` is ignored and does not upload to Netlify. Keep Netlify for the static public site and Functions; Supabase supplies Auth/Postgres, and R2 holds every contribution file. Do not create Supabase Storage buckets.

## Guest submissions (21 October 2026)

The guest migration `202610210006_guest_submissions.sql` has been applied to the existing project. Deploy the matching frontend/Functions together; no additional keys, bucket, CORS origin or Auth provider is required. `/submit/` and new-work upload accept guests; account-only dashboards/revisions/admin remain protected. Guest files go through the same private R2 pipeline. A hash-only receipt (URL fragment, 90-day expiry) grants one-work status access, never account/admin access. Hourly maintenance removes expired receipt/private contact records and abandoned draft files. The new public API paths are `/api/guest/start`, `/sign`, `/complete`, `/submit` and `/status`; CSRF/rate limits apply to all.

Actual local-browser-to-hosted-service upload/CORS, sanitization and status-link acceptance passed and all fixtures were removed. After deployment, owner-check admin approval and public download/takedown before claiming production acceptance. New translations/legal wording remain drafts. Guests need no verification email; optional contact information is never inferred as consent to publication.

## Supabase authentication

In the existing Red Lark project, open Authentication → URL Configuration. Set Site URL to `https://redlarkworkshop.com`. Add these redirect URLs explicitly for each locale (`en`, `hi`, `bn`, `ml`):

```text
https://redlarkworkshop.com/api/auth/callback?locale=en
https://redlarkworkshop.com/api/auth/callback?locale=hi
https://redlarkworkshop.com/api/auth/callback?locale=bn
https://redlarkworkshop.com/api/auth/callback?locale=ml
http://localhost:3000/api/auth/callback?locale=en
http://localhost:3000/api/auth/callback?locale=hi
http://localhost:3000/api/auth/callback?locale=bn
http://localhost:3000/api/auth/callback?locale=ml
```

The flow uses PKCE and an HttpOnly verifier cookie: open verification/recovery links in the browser where you requested them. Do not replace email templates with implicit-token links. Confirm email verification stays enabled. Enable email/password and TOTP; no social providers. Public signup should remain disabled until launch testing is arranged. Enabling it and the production SMTP settings are owner dashboard actions, not inferred from the REST keys.

In Authentication → Email/SMTP settings (dashboard labels can vary), enable custom SMTP. Use Resend's displayed SMTP values: host `smtp.resend.com`, port `465`, username `resend`, password a domain-restricted Resend sending API key. Sender address must belong to the verified `mail.redlarkworkshop.com` domain. Choose the same sending identity as MAIL_FROM. Resend SMTP does not create a receiving mailbox; team replies use MAIL_TO_TEAM. Save and test a real verification and recovery message. Supabase's default mail service is not production delivery acceptance.

## R2 access, CORS and cleanup

Keep `redlark-pending` private, with public access/r2.dev disabled. Keep the approved bucket private until the owned hostname is ready; then expose approved files only through `https://files.redlarkworkshop.com`. Follow [R2_DOMAIN_SETUP.md](R2_DOMAIN_SETUP.md) for the Netlify-to-Cloudflare authoritative DNS prerequisite, preserving all mail records. Keep r2.dev disabled.

The application token needs Object Read & Write scoped to these two buckets only. This permission may not allow bucket configuration. Keep that token narrow; use the owner's Cloudflare dashboard for CORS/lifecycle. The attempted configuration request was refused and must not be reported as applied. Open each bucket → Settings → CORS policy → Edit.

Private pending bucket CORS (remove localhost before launch if local upload testing is finished):

```json
[
  {
    "AllowedOrigins": ["https://redlarkworkshop.com", "http://localhost:3000"],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["Content-Type"],
    "MaxAgeSeconds": 300
  }
]
```

Approved bucket CORS, required for browser-local Studio remixes:

```json
[
  {
    "AllowedOrigins": ["https://redlarkworkshop.com", "http://localhost:3000"],
    "AllowedMethods": ["GET", "HEAD"],
    "MaxAgeSeconds": 300
  }
]
```

Private bucket → Settings → Object lifecycle rules: add expiration after **1 day**, restricted to prefix **quarantine/**. Never apply this expiration to sanitized/, approved files, or the whole bucket. The scheduled function also removes expired upload tickets/quarantine files and expired sessions/rate-limit hashes. Bucket settings API automation is available as `npx tsx scripts/configure-r2.ts --apply --local` only if an appropriately authorized operator runs it; object credentials are not broadened automatically.

Public copies use Cache-Control `no-store, max-age=0`. Do not add a Cloudflare Cache Everything rule. Configure a cache bypass rule for `files.redlarkworkshop.com` if any existing zone rule overrides origin headers. Otherwise takedown may leave a cached file accessible; launch acceptance must test real public downloads and takedown. Provider/visitor copies cannot be recalled.

## Netlify variables and scopes

### Free-plan scope fallback

Netlify's granular environment-variable scopes require Pro or Enterprise. On Free, add the required hosted variables through the project dashboard using the default **All scopes**; an upgrade is not required for the application. The scope table below describes the preferred least-privilege setup when granular scopes are available. All-scopes variables are available to trusted build code as well as Functions; they are not automatically published to browsers. Never use NEXT_PUBLIC_ names for private values or add private values to next.config.ts env. The build's check-client-secrets step fails if configured private values appear in static output.

Keep DATABASE_URL, DATABASE_CA_CERT and ADMIN_BOOTSTRAP_EMAIL local. Leave optional analytics blank. Copy stable session/rate-limit keys from local configuration rather than regenerating them. Use Production-only values if deploy-context controls are available; otherwise disable untrusted automatic Deploy Preview/branch builds before adding production secrets, and review any code/build plugins allowed to run with those variables. Do not import the whole .env.local file blindly. Updated variables take effect in a subsequent deployment; source publication/merge still follows owner confirmation.

Official scope availability: https://docs.netlify.com/build/environment-variables/overview/.

### Secret-scanning classification after importing variables

The owner's 20 October deployment compiled and passed the browser-secret audit, then Netlify blocked eight non-credential values marked as secret. In Project configuration -> Environment variables -> each variable -> Options/Edit, clear **Contains secret values** for SITE_URL, R2_PUBLIC_BASE_URL, R2_REGION, R2_PENDING_BUCKET, R2_APPROVED_BUCKET, R2_ENDPOINT and R2_ACCOUNT_ID. MAIL_TO_TEAM may also be unmarked for this project because it equals the owner-approved public CONTACT_EMAIL already rendered in the site; do not generalize that exception to private recipient addresses. For canonical bucket names, R2_PRIVATE_BUCKET/R2_PUBLIC_BUCKET are also configuration identifiers rather than credentials. Preserve all values while correcting their classification, then deploy again.

Keep SUPABASE_SECRET_KEY/SUPABASE_SERVICE_ROLE_KEY, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, MAIL_PROVIDER_KEY, SESSION_ENCRYPTION_KEY, RATE_LIMIT_SECRET and NETLIFY_BUILD_HOOK marked secret. Do not disable secret scanning or omit whole source/output directories. If the UI cannot change classification, the narrowly scoped supported fallback is SECRETS_SCAN_OMIT_KEYS containing only the eight non-credential names reported above; never include actual credential names. See https://docs.netlify.com/manage/security/secret-scanning/.

Set in Project configuration → Environment variables. Use **Production** context; do not make secrets available to untrusted deploy previews or fork builds. Only rows with Build scope are needed by the static build. No private value belongs in `next.config.ts env`, a NEXT_PUBLIC_ variable, a screenshot, a GitHub issue or chat.

| Variable                        | Scope                        | Secret?             | Value/source                                                      |
| ------------------------------- | ---------------------------- | ------------------- | ----------------------------------------------------------------- |
| SITE_URL                        | Build + Functions            | No                  | `https://redlarkworkshop.com`                                     |
| CONTACT_EMAIL                   | Build                        | Public              | Owner-supplied public contact inbox                               |
| SUPABASE_URL                    | Build + Functions            | No                  | Existing project URL                                              |
| SUPABASE_PUBLISHABLE_KEY        | Build + Functions            | Public key          | Current publishable key                                           |
| SUPABASE_ANON_KEY               | Build + Functions            | Public key          | Legacy alias only if used instead                                 |
| SUPABASE_SECRET_KEY             | Functions only               | **Yes**             | Current server secret                                             |
| SUPABASE_SERVICE_ROLE_KEY       | Functions only               | **Yes**             | Legacy alias only if used instead                                 |
| SESSION_ENCRYPTION_KEY          | Functions only               | **Yes**             | Local generated 32-byte base64 app key; preserve across deploys   |
| RATE_LIMIT_SECRET               | Functions only               | **Yes**             | Separate generated random app secret                              |
| R2_ACCOUNT_ID                   | Functions only               | No                  | Existing account identifier                                       |
| R2_ACCESS_KEY_ID                | Functions only               | **Yes**             | Restricted two-bucket object token                                |
| R2_SECRET_ACCESS_KEY            | Functions only               | **Yes**             | Same token's signing secret                                       |
| R2_ENDPOINT                     | Build + Functions            | No                  | Existing account-level S3 HTTPS endpoint                          |
| R2_REGION                       | Functions only               | No                  | `auto`                                                            |
| R2_PRIVATE_BUCKET               | Functions only               | No                  | Existing pending bucket; R2_PENDING_BUCKET is supported alias     |
| R2_PUBLIC_BUCKET                | Functions only               | No                  | Existing approved bucket; R2_APPROVED_BUCKET is supported alias   |
| R2_PUBLIC_BASE_URL              | Build + Functions            | No                  | `https://files.redlarkworkshop.com`, after setup                  |
| PUBLIC_CATALOGUE_ENABLED        | Build + Functions            | No                  | `1` after backend acceptance; otherwise leave blank               |
| NETLIFY_BUILD_HOOK              | Functions only               | **Yes**             | Build hook for the production branch                              |
| MAIL_PROVIDER_KEY               | Functions only               | **Yes**             | Domain-restricted Resend sending key                              |
| MAIL_FROM                       | Functions only               | No                  | Full approved sender identity, not just its domain                |
| MAIL_TO_TEAM                    | Functions only               | Private contact     | Owner's team inbox                                                |
| ADMIN_BOOTSTRAP_EMAIL           | Local bootstrap script       | Private contact     | Owner-approved initial administrator; not a public route          |
| ANALYTICS_DOMAIN                | Build                        | No                  | Optional; blank disables analytics                                |
| NEXT_PUBLIC_ANALYTICS_ENDPOINT  | Build                        | No                  | Optional same-origin cookieless proxy path                        |
| REPO_URL                        | Build                        | No                  | Current source repository, if deployment tooling needs it         |
| DATABASE_URL / DATABASE_CA_CERT | Local migration scripts only | **Yes** / public CA | Not required in Functions; never expose SQL credentials to builds |

Canonical modern Supabase/R2 names take precedence over aliases. Do not set two aliases to conflicting projects/buckets. `.env.example` intentionally contains empty placeholders. `NEXT_TELEMETRY_DISABLED=1` is a non-secret build setting already in netlify.toml. The two application secrets were generated in ignored local configuration, not invented provider credentials. Rotating the session key invalidates stored sessions.

Netlify → Build & deploy → Build hooks: create a hook for the actual production branch and save its private URL in NETLIFY_BUILD_HOOK. Approval publishes sanitized copies and requests a fresh static build; it does not promise that the new page appears before that build succeeds. If the build request fails, the API reports that failure and an operator must retry the build. Public snapshots are fetched using only the publishable key and an explicit RPC whitelist, never the service secret.

## Migrations, bootstrap and acceptance

Run `npm run db:check`, `npm run db:migrate` and `npx tsx scripts/verify-hosted-database.ts` from a trusted machine. The migration ledger rejects changed applied SQL; append new migrations. Seeds are private CC0 placeholders, not publication. Never run SQL migrations in every public site build.

Start locally with `npm run dev` (site/API port 3000, internal Next dev port 3001), or build and use `npm start`. Local secure cookies require a browser that supports secure localhost; production requires HTTPS. Verify a real account, sign in, and at /en/account/settings/ → Account security add and verify TOTP. Then run `npm run admin:bootstrap` with the owner-approved ADMIN_BOOTSTRAP_EMAIL. There is no public grant-admin route. Bootstrap refuses unverified email, missing real login and missing verified TOTP. Verify TOTP again when admin authentication is older than ten minutes.

Before a backend push/deployment, the owner must confirm the documented Netlify Build/Functions variables and trusted production context. After that deployment, run the full signup → verify → upload → admin approval → all four public locale pages → takedown sequence with the public file hostname, CORS, SMTP and build hook configured. Browser fixture tests and local SQL tests do not substitute for this hosted sequence. Complete actual Gmail/non-Gmail inbox/header checks, native translation review and India-specific legal/retention/data-residency review before launch acceptance.

## Local and hosted origins

For local signup/testing, leave SITE_URL blank in .env.local so the API uses http://localhost:3000. Static metadata still defaults to https://redlarkworkshop.com. For Netlify, set SITE_URL=https://redlarkworkshop.com in Build AND Functions; hosted authentication refuses an absent or deployment-host origin. The /verify page can forward an authorization code to the existing /api/auth/callback endpoint; the currently documented Supabase callback allowlist remains valid.

Private detail links are full navigations through the configured static-shell rewrites. Their language switcher preserves the UUID through a full navigation as well; Next static segment prefetch is not used for those records.
