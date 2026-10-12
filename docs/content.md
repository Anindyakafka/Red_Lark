# Content and publishing

The project team provides the real collection and editorial position. The current six sample designs exist to exercise layouts and downloads and are marked as demo content.

## Delivering content

For each poster or sticker, provide:

| Field | Example / purpose |
| --- | --- |
| Title and stable slug | Human title; URL-safe unique name |
| Kind and collection | Poster or sticker; related release/series |
| Description | Context visitors should know |
| Artist / credit | Approved display name and optional URL |
| Language | Explicit locale; provide translated editions separately |
| Tags | A small consistent vocabulary |
| Licence | Specific licence and attribution text; not assumed from the software licence |
| Remix permission | Whether a visitor can modify the artwork/elements |
| Print variants | A4/A3/A2 as appropriate; exact dimensions, bleed and colour specification |
| Preview | Lightweight image distinct from the print master |
| Master and source | Final PDF/PNG/SVG plus original design source if appropriate |
| Sticker information | Physical dimensions, transparent art and separate printer-approved cutlines |
| Fonts | Sources and permissions for web use, distribution, and print embedding |
| Publication | Date, edition/revision, review/publish status |

Avoid identifying people unintentionally through filenames, embedded image metadata, or private source layers. Public contributor credits should be intentional.

## Current local workflow

1. Put small prototype preview/download files under `public/`.
2. Add typed entries to `src/content/catalog.ts`; use unique IDs/slugs and the right `kind`.
3. Match URLs to actual files. Current entries support one SVG download per item only.
4. Review listing and detail pages, search/filter behaviour, mobile sizing, and exported files.
5. Run typecheck, tests, and build.

Before adding real PDF/raster variants, extend `Artwork` with a typed variants array and update the detail/download UI. The current `format: "SVG"` type deliberately describes only the skeleton's actual capability. Do not merely relabel an SVG as a print-ready PDF.

Large files belong in object storage in production; do not commit print masters and raw source files for a growing collection to Git.

## Production publishing workflow

1. **Ingest:** trusted editor submits artwork, variants, sources, and metadata into private storage.
2. **Validate:** confirm file signature/MIME, dimensions, byte limits, licence, authorised fonts, and source ownership.
3. **Derive:** generate thumbnail/preview sizes and calculate checksums; sanitize vectors and strip unnecessary metadata.
4. **Review:** another authorised editor checks the displayed design, credits, language, file quality, sizes, and remix permissions.
5. **Publish:** move approved edition references into the public catalogue, enable public derivatives/downloads, and invalidate caches.
6. **Revise:** create a new immutable edition with an audit event; retain or archive the old edition according to policy.

Catalogue publication is separate from visitor drafts. A saved composition is private by default. Submissions, if introduced, require review and clear contributor permissions.

## Visual content guidelines

Keep the artwork visually dominant. Use consistent catalogue framing and enough margin to show paper boundaries. Do not bake interface labels into artwork previews. Artwork pages should expose format, physical size, file size, contributor, licence, and edition beside the download action. Content availability must be truthful: no fake download counts or claimed published collections.

Use concise descriptions and meaningful alt text. For text-heavy posters, store a transcription rather than forcing the entire message into an image's title. Test font coverage, shaping, direction, and wrapping for each actual language; system fonts in the prototype are temporary.

## Licensing

`LICENSE` governs project software. Each artwork, reusable element, font, and brand asset needs its own documented rights. The prototype dedicates only `public/samples/*.svg` to CC0-1.0. The supplied logo and refined brand assets are not included in that dedication. Carry attribution through templates and exports where the artwork licence requires it. Select real collection licences when content is supplied; do not silently default all uploads to free reuse.
