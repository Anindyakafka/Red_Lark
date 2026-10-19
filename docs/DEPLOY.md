# Backend deployment and owner setup

Backend must not be deployed until the owner confirms the server variables are configured. `.env.local` is ignored and does not upload to Netlify. Keep Netlify for the static public site and Functions; Supabase supplies Auth/Postgres, and R2 holds every contribution file. Do not create Supabase Storage buckets.

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

Start locally with `npm run dev` (site/API port 3000, internal Next dev port 3001), or build and use `npm start`. Local secure cookies require a browser that supports secure localhost; production requires HTTPS. Verify a real account, sign in, and in Account → Account security add and verify TOTP. Then run `npm run admin:bootstrap` with the owner-approved ADMIN_BOOTSTRAP_EMAIL. There is no public grant-admin route. Bootstrap refuses unverified email, missing real login and missing verified TOTP. Verify TOTP again when admin authentication is older than ten minutes.

Run the full signup → verify → upload → admin approval → all four public locale pages → takedown sequence after the public file hostname, CORS, SMTP and build hook are configured. Browser fixture tests and local SQL tests do not substitute for this hosted sequence. Complete actual Gmail/non-Gmail inbox/header checks, native translation review and India-specific legal/retention/data-residency review. Then obtain the owner's explicit confirmation before deploying backend.
