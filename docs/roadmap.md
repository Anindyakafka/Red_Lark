# Delivery roadmap

Ordered milestones, not date promises. Dates and effort depend on the actual collection, supported languages, team capacity, and print requirements.

## 0. Skeleton — implemented

- Next.js + TypeScript app with responsive catalogue-focused design.
- Searchable poster and sticker demo catalogues, individual pages, SVG downloads.
- Local SVG studio with four primitives, editing, layer controls, undo/redo, save/restore, export.
- Original logo preserved; refined vector assets and high-resolution transparent PNGs.
- Architecture, content, editor, roadmap documentation; typecheck/test/build workflow.

Remaining verification before external presentation: hands-on browser/device review and actual sample print. No professional print or production service claims.

## 1. First real collection

Replace the samples with a small approved release. Add credits, locale, licences, tags, and paper sizes. Extend file types and variant selection, implement realistic lightweight previews, and provide final preflighted PDFs. Confirm the brand lockup and editorial copy.

Done when a visitor can discover each real design, understand reuse rights, download the exact intended size, and produce a reviewed physical sample. Catalogue output can be launched before the full editor.

## 2. Publishable archive

Add schema migrations, RLS and permission tests, database-backed catalogue queries, object-storage ingest, responsive derivatives, custom asset domain, private admin, publication state, cursor pagination, metadata/sitemap, backups, and provider budget alerts. Deploy the app after device review.

Done when editors can publish without changing source, drafts cannot leak, files download directly from storage/CDN, and an exercised restore procedure exists. Preview and production environments must be separate.

## 3. Production composition studio

Curate reusable licensed elements and editable templates. Introduce renderer-independent schema migrations, React Konva transforms, snapping, zoom, grouping, keyboard nudges, duplicate/lock/hide, undo transaction grouping, missing-asset handling, and touch review. Add IndexedDB autosave/recovery and multiple drafts. Catalogue templates should enter the editor with their actual editable layers.

Done when the supported visitor journey—choose template, edit words, place assets, recover draft, export—is reliable on agreed browsers and mobile devices. Approved rights and attribution travel with the design.

## 4. Print engine

Implement an export worker with validated job submission, bounded resource use, idempotency, retries, progress, and expiry. Resolve approved assets/fonts, generate SVG/PNG/PDF presets, and run preflight. Determine printer-specific profiles, bleed, and cutlines from actual print requirements.

Done when samples across fonts, artwork kinds, orientations, paper sizes, and sticker formats render consistently and physical prints have been reviewed. Export failures must be visible and recoverable without losing the design.

## 5. Optional community

Add optional cloud saves, collections, submission review, contributor credits, reporting, and moderation tools only if the team wants these features. Real-time collaboration is a separate project after revision/conflict semantics are established.

Done when visitors own their private drafts, published contributions are reviewed and correctly licensed, retention is documented, and admin permissions have automated coverage.

## Decisions to settle when content arrives

- Languages and whether multilingual editions share a canonical artwork page.
- Final artwork and remix licences.
- Required paper sizes, printer standards, colour profiles, and sticker cutline formats.
- Whether anonymous local-only editing is enough at launch, or optional cloud drafts are needed.
- Who publishes and approves official work; whether submissions are wanted.
- Expected artwork count, average master size, download volume, and acceptable operating budget.
- Domain, launch hosting, analytics preferences, and contact details.

These decisions do not block the local skeleton. They inform production schema and service configuration.
