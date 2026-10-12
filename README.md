# Mirafra

An independent poster and sticker archive, with a studio for making your own compositions from a shared catalogue of elements.

**The posters are the main event.** People should be able to discover artwork, get a high-quality print file, and print it without creating an account. Customisation is the second pillar: a focused design tool inside the website, built around our own artwork and visual language.

This repository now contains a working **local prototype**, not just a proposal. It does not require a database, account, paid service, or environment variables to run. No site has been deployed and no external service has been provisioned.

## Run it

Use Node.js 24 LTS and npm. The project declares a minimum of Node 22.

```sh
npm ci
npm run dev
```

Open **http://localhost:3000**. On Windows PowerShell, use `npm.cmd` instead of `npm` if script execution is restricted.

```sh
npm run typecheck
npm test
npm run build
npm start
```

`npm start` serves the production build; run `npm run build` first. Commit the lockfile and use `npm ci` for repeatable installs. `.env.example` documents possible future service settings; nothing reads those settings yet.

## What is working

| Area | Available in this skeleton |
| --- | --- |
| Home | Responsive editorial landing page, artwork previews, collection, studio entry |
| Posters | Search by title, collection, and tags; collection filters; detail pages; SVG downloads |
| Stickers | Separate catalogue, search, filters, details, SVG downloads |
| Studio | Add text, an illustrative bird, circles, and rectangles; drag; edit text, typeface, size, ink and paper colour; position, scale, rotation; reorder and remove layers |
| Drafts | Explicit save/restore in the same browser; versioned and validated document format |
| History | Undo/redo, capped at 50 snapshots |
| Export | Standalone A3-ratio RGB SVG; no editor selection marks |
| Branding | Vectorised original bird/wire, outlined wordmark, combined logo, transparent high-resolution black and white PNGs |
| Information | About page, print guide, useful 404 page |
| Checks | TypeScript, document/export/history and catalogue tests, production build, GitHub Actions workflow |

**All six catalogue designs are labelled demo studies.** They are temporary visual examples, not your first published collection. The studio shelf currently contains four built-in primitives; the production catalogue of remixable elements is planned. The original `mirafra.jpeg` has been preserved.

**Current limits:** one browser-local draft; no accounts, database, admin interface, uploads, cloud saves, collaborative editing, PDF/PNG exports, or professional print preflight. SVG text uses system fonts, so its appearance can vary between machines. Mobile layouts exist, but browser interaction and touch behaviour still need hands-on review.

## Experience and visual direction

[ciggies.app](https://ciggies.app/) is the reference for a collection-first experience: browsing, search, filters, and individual entries. Mirafra uses its own visual language: warm paper, black ink, restrained red, serif editorial headings, small catalogue labels, and artwork presented like prints on a wall. We are not copying its assets or branding.

The route map:

```text
/                       Introduction + featured poster catalogue
/posters                Full poster catalogue
/posters/[slug]         Artwork, context, licence, print downloads
/stickers               Sticker catalogue
/stickers/[slug]        Sticker details and downloads
/studio                 Local editor prototype
/about                  Project story, later contributors and contact
/print-guide            File formats and printing guidance

Later: /collections/[slug], /elements, /admin, /studio/[design-id]
```

## Recommended technology

Start with a **modular Next.js application**, a relational content database, and object storage. Split deployment units only when there is a concrete reason. This leaves room for a large archive without forcing a large infrastructure project on day one.

| Layer | Choice | Why / when |
| --- | --- | --- |
| Language | TypeScript | Shared, checked types across the site, editor document, and future jobs |
| Website | Next.js App Router + React | Pre-rendered catalogue and detail pages, metadata, future server routes; the editor is a client-only feature |
| Styles | CSS with design tokens | Already implemented; keeps the first design simple. Tailwind is optional, not needed for scale |
| Editor, first iteration | Native SVG + React | Already implemented; small, transparent document/export model for proving the workflow |
| Editor, production | React Konva + Konva | Recommended for selection handles, transforms, larger scenes, and canvas interaction; keep the document model independent of the renderer |
| Editor state, later | Zustand + schema validation with Zod | Add once selection, snapping, grouped history, and asset loading grow beyond the prototype |
| Database + accounts | Supabase managed PostgreSQL + Auth | Catalogue relationships, editor/admin roles, optional cloud drafts; row-level security for user-owned records |
| Large files | Cloudflare R2 + custom asset domain | Store print masters, preview derivatives, and export results separately from application deploys; R2 has no direct egress fee, but storage and requests still cost money |
| App hosting | Vercel initially | Straightforward Next.js deployment and previews; a Node container remains a future portability option |
| Search, first | PostgreSQL full-text search + trigram indexes | Search approved content without operating an extra search service |
| Search, later | Evaluate Typesense or Meilisearch | Only when measured relevance, faceting, or latency needs justify another service |
| Print/export processing | Separate Node.js worker | Versioned scene → vector PDF / raster PNG; queue, limits, font loading, and print preflight. Run outside short-lived web requests |
| Admin | Small private `/admin` backed by the same database | A single source of truth for artwork, editions, files, licences, elements, and publishing |
| Monitoring | Structured server logs; consider Sentry when live | Diagnose failed downloads, editor errors, and export jobs; avoid collecting design text or sensitive user content |
| Analytics | Aggregate, privacy-conscious usage metrics | Measure catalogue usage and downloads; no visitor account needed |

Service recommendations are architecture choices, not connected integrations. Recheck providers' current limits, pricing, and terms before purchase. Primary documentation: [Next.js](https://nextjs.org/docs/app/getting-started/installation), [Konva transforms](https://konvajs.org/docs/react/Transformer.html), [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Cloudflare R2](https://developers.cloudflare.com/r2/how-r2-works/), [R2 pricing](https://developers.cloudflare.com/r2/pricing/), [Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs).

## Repository structure

```text
mirafra/
├── src/
│   ├── app/                   Routes, metadata, global styles
│   ├── components/            Shared site header and footer
│   ├── content/catalog.ts     Typed seed catalogue; replace when content arrives
│   └── features/
│       ├── catalog/           Artwork types, search/filter, listing, detail view
│       └── studio/            Versioned document model, history, SVG export, editor
├── public/
│   ├── brand/                 Refined SVGs, transparent PNGs, logo proof
│   └── samples/               Six downloadable demo designs
├── scripts/refine-logo.mjs    Reproducible vector tracing + brand exports
├── tests/                    Meaningful model/export/search checks
├── docs/
│   ├── architecture.md       Service boundaries, future schema, growth, deployment
│   ├── editor.md             Editor scope, document contract, print pipeline
│   ├── content.md            Publishing workflow and content delivery checklist
│   └── roadmap.md            Ordered milestones and acceptance criteria
├── .github/workflows/        Install, typecheck, tests, build
├── .env.example              Future integrations; no real credentials
├── mirafra.jpeg              Original supplied logo, unchanged
├── LICENSE                   Existing AGPL v3 software licence, unchanged
└── README.md
```

When durable services are introduced, add `supabase/migrations/`, storage adapters under `src/server/`, and the export worker under `workers/export/`. Use workspace packages only when the site and worker need to share a real library. Do not add empty microservices now.

## Plan for a large archive

1. **Ship the curated download archive first.** Approved artwork, sizes, licences, accessible previews, and fast downloads matter more than community accounts.
2. **Keep originals outside Git.** Upload large PDFs/PNGs and source files to object storage. Render small WebP/AVIF thumbnails for the catalogue. Never use a 30 MB print master as a thumbnail.
3. **Separate artwork from file variants.** One design may have several languages, print sizes, colour editions, and revisions. Store explicit dimensions, file type, byte size, checksum, licence, and colour profile.
4. **Make remixability explicit.** A flattened poster is not an editable template. Publish licensed reusable elements and versioned templates separately from finished artwork.
5. **Keep the catalogue paginated.** The small seed array is intentionally temporary. Move filters, facets, and cursor pagination into database-backed queries before the catalogue becomes large.
6. **Serve files through the CDN.** Do not route public multi-megabyte downloads through the Next.js server. Use immutable object keys for revisions and a stable canonical artwork page.
7. **Keep visitors anonymous by default.** Reading, downloading, and basic editing need no sign-in. Add accounts for optional cloud saves and admin access.
8. **Move expensive exports to jobs.** Validate inputs, estimate work, enforce per-job memory/pixel limits, expose job progress, and expire generated files.
9. **Measure before splitting.** Watch catalogue latency, transferred bytes, thumbnail cache hit rate, editor load time, and export failure rate. Add search infrastructure and workers when measurements justify them.

See [architecture](docs/architecture.md) and [editor design](docs/editor.md) for details.

## Delivery sequence

| Phase | Deliverable |
| --- | --- |
| 0 — Now | Local skeleton, demo catalogue, small editor, refined brand, documentation |
| 1 — First real collection | Approved content, print PDFs, previews, licences, real metadata, device review |
| 2 — Publishable archive | Database, R2/CDN, admin, pagination, SEO, backups, deployment, monitoring |
| 3 — Production studio | Approved element catalogue, templates, transforms, snapping, mobile workflow, robust drafts |
| 4 — Print engine | Embedded fonts, validated SVG/PDF, raster export, print presets, export worker and queue |
| 5 — Community, if wanted | Optional accounts and cloud saves, reviewed submissions, collections, attribution |

Phase 2 and the editor can proceed independently, but community features should follow the reliable download archive. [Roadmap with acceptance criteria](docs/roadmap.md).

## Logo assets

The original bird and barbed wire have been thresholded, cleaned, and traced to transparent vector paths. The grey raster lettering has been replaced by a manually defined outlined wordmark. This preserves the supplied concept while removing dependence on low-resolution JPEG pixels and installed fonts.

| File | Use |
| --- | --- |
| `public/brand/mirafra-mark.svg` | Bird and wire, scalable transparent mark |
| `public/brand/mirafra-wordmark.svg` | Font-independent outlined name |
| `public/brand/mirafra-logo.svg` | Combined mark and name |
| `public/brand/mirafra-logo.png` | 3,200 px wide, transparent, black |
| `public/brand/mirafra-logo-white.png` | 3,200 px wide, transparent, white |
| `public/brand/mirafra-mark.png` | 2,400 px wide, transparent, black |
| `public/brand/mirafra-mark-white.png` | 2,400 px wide, transparent, white |
| `public/brand/mirafra-proof.jpg` | Viewable brand proof on warm paper |

Regenerate with `npm run brand:build`. The trace preserves the supplied silhouette, including its original contours; a later manual designer pass can simplify curves and create a reduced-detail tiny icon. Prefer SVG for layout and print.

## What to provide next

- First posters and stickers, preferably original vector files plus exported previews and print PDFs.
- Title, description, contributor credit, language, collection, tags, and publication date for each.
- Approved artwork licence and whether each item can be remixed.
- Intended paper sizes, bleed, colour variants, and sticker dimensions/cutlines.
- Reusable elements as separate SVGs/transparent PNGs, not just flattened finished posters.
- Fonts with confirmed web/embedding permissions, especially for any non-Latin language support.
- Project story, contributor names to display, and contact details.

Full [content checklist](docs/content.md). Final slogans, positions, and collection copy should come from the team; the prototype copy is illustrative.

## Licence

The existing **AGPL v3** software licence is retained. Artwork licences must be tracked separately. Only the six authored demonstration SVGs in `public/samples/` are dedicated to CC0-1.0. This does not license the supplied logo, Mirafra branding, third-party fonts, or future uploaded artwork. A deployed AGPL service must provide the corresponding source as required by its licence.
