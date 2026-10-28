# RED LARK WORKSHOP

A multilingual archive and in-browser Workshop for free political graphics. Browsing, downloads, the Workshop, and quick contributions work without an account. Optional contributor accounts provide a dashboard, editing, and resubmission. Public signup stays enabled; administrator rights require a controlled grant/invitation and authenticator verification.

English landing copy is locked in `content/copy/landing.en.json` and checked by `tests/copy.test.ts`. Hindi, Bengali and Malayalam draft strings remain `reviewed:false` until native review. Content is added only with explicit rights, credit, source and alt text; derivative restrictions are enforced before a work can enter the Workshop.

## Stack and hosting

Next.js App Router 16.4.3, TypeScript strict, Tailwind, static export to Netlify, Netlify Functions and Edge, Supabase Auth/Postgres, Cloudflare R2, and Resend. Static public pages are rebuilt from a sanitized catalogue of approved works. Private records stay in Supabase and pending files stay in private R2. The site uses no third-party scripts, CDN fonts, social login, or design database. The Workshop saves browser drafts locally.

## Local setup

1. Install Node 24 and run `npm ci`.
2. Copy `.env.example` to `.env.local`; fill only the values you actually use. Never commit `.env.local` or paste keys into chat. `SITE_URL=https://redlarkworkshop.com` is the production canonical origin.
3. Run `npm run db:check` and `npm run db:migrate` only from a trusted machine with the project database connection and CA certificate. See [deployment instructions](docs/DEPLOY.md) for existing migration and admin commands. Do not re-provision the configured services.
4. Run `npm run dev` for development. For a production-equivalent static build, run `npm run build` and `npm start`. Without backend build settings, checked-in public content remains available.

The environment contract is in [.env.example](.env.example). Public Supabase URL/publishable key may be in build and Functions. Supabase secret key, R2 credentials, Resend key, session/rate-limit secrets and build hook belong only in Functions. `DATABASE_URL` and its CA path are local migration inputs, never browser or deploy values. Keep `PUBLIC_CATALOGUE_ENABLED=1` in the Netlify build context only after the approved catalogue is ready. The build fails if a client bundle contains known private credentials.

## Commands

| Command                                                              | Purpose                                                                         |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `npm run typecheck` / `npm run lint` / `npm run format:check`        | Static and style checks                                                         |
| `npm run validate:content` / `npm run test:copy`                     | Content rights and canonical copy checks                                        |
| `npm test` / `npm run test:e2e`                                      | Unit/RLS and browser tests                                                      |
| `npm run build`                                                      | Validate, merge approved public catalogue, export site, check CSP/links/secrets |
| `npm run check:docs` / `npm run check:secrets`                       | Encoding guard and full-history Gitleaks scan                                   |
| `npm run db:check` / `npm run db:migrate`                            | Inspect/apply ordered SQL migrations with verified TLS                          |
| `npm run admin:invite -- <email>` / `npm run admin:grant -- <email>` | Controlled staff invitation or grant; MFA remains required                      |

## Contributions and review

Open `/en/contribute/` (or `hi`, `bn`, `ml`) to submit as a guest or with an optional account. Guest status uses a private receipt link. Images and Writing (`.txt`, Markdown, `.docx`) enter the same private review queue; only sanitized approved derivatives become public. Quick contributions currently default to CC0, with a required right-to-share confirmation. ND-licensed works remain download-only and cannot be opened in the Workshop.

Administrators review at `/en/admin/review/`. A fresh MFA-verified administrator can approve, request changes, reject, remove, and edit allowed metadata for approved works. Approval requests a Netlify rebuild; publication depends on a successful deployment. The dashboard is a client shell, but every API authorization is checked server-side. The public catalogue includes only approved sanitized records. See [current checklist](docs/CHECKLIST.md) for what has actually been verified in this repair.

## Workshop

The Workshop stays in the browser. It supports editable layers and imported poster groups, vector crops, touch and keyboard controls, undo/redo, local autosave, share links, SVG/PDF, tiled A4, ink previews and 300 PPI PNG export. Version 2 local drafts and share links migrate to version 3. Images imported by a visitor are re-encoded locally to remove EXIF/GPS. The site never receives a visitor's design unless they deliberately submit it.

## Content, languages and rights

Posters and artists are in `content/`; public assets are in `public/`. Follow [content/README.md](content/README.md). Required metadata includes licence, artist credit, source and meaningful alt text. `remixable=true` is invalid when the licence forbids derivatives. ShareAlike credits and licences are composed into exports. The English landing copy must remain verbatim; log wording questions in [COPY_QUESTIONS.md](docs/COPY_QUESTIONS.md).

For a new locale, add message and content-copy files, mark unreviewed drafts, add the locale to routing/sitemap metadata, and verify script fonts, 390px layout, forms and screen-reader labels. Native review must precede marking translations as final.

## Deployment and evidence

Netlify publishes `out/` via `netlify.toml`. Keep the Edge locale/404 function and independent API Functions enabled. Build-time SHA-256 hashes allow only each page's generated inline scripts; the CSP also blocks remote scripts/fonts/embeds. Verify live headers, canonical URLs, R2 approved files, review-to-rebuild, and email delivery after deployment. [DEPLOY.md](docs/DEPLOY.md) covers provider settings and [TODO_HUMAN.md](docs/TODO_HUMAN.md) lists owner decisions and acceptance tasks.

Raw screenshots and reports go to ignored `docs/evidence-local/`; only small JSON/Markdown summaries are retained in `docs/evidence-summaries/`. Attach review screenshots to a GitHub release if they need to be shared. The old planning PPTX and bulky evidence are removed from the current Git index; purging their history is a coordinated owner action. Current engineering status is in [PLAN.md](docs/PLAN.md), [CHECKLIST.md](docs/CHECKLIST.md), and [ITERATIONS.md](docs/ITERATIONS.md). Historical status documents are under `docs/archive/`.

## Licence

Website code is AGPL-3.0-only (see [LICENSE](LICENSE)). Each artwork has its own explicit licence; the code licence does not replace it.
