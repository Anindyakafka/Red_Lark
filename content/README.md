# Adding posters and artists

Archive files in this directory require an explicit licence, artist credit, source URL and meaningful alt text. A free download is not permission to make derivatives.

Contributor uploads use the database and may leave the image description blank (maximum 300 characters). Short supplied descriptions are kept without a minimum character count. Blank or generic "poster" descriptions receive a deterministic description made from the title, format and artist; no AI service is used. The public-catalogue build applies that fallback before poster validation. Checked-in archive files still need a non-blank description.

`posters/*.json` contains one record per poster; `artists/*.json` contains credited artists. Images and print files live in `public/posters/<slug>/`. The 18 seed posters are original CC0 vector/typographic placeholders authored for this rebuild, with openly invented lab credits. No real artist artwork has been downloaded or embedded.

Use an existing record as the schema example. Provide: slug, English title, optional original-language title, languages, artist ID, actual year, categories (approved slugs, multi-select), free tags, artwork kind (formats.json), image/caption codes, AI-use declaration/disclosure, colour mode, region, file format/size/path/byte metadata, licence ID and URL, source, artist URL, meaningful alt description, caption, preview and dominant colour. Legacy theme/movement fields remain compatibility data. Set placeholder=false only for an approved contribution. Per-locale title/caption/tags have explicit reviewed flags; draft translations must be visibly identified.

`allowsDerivatives` and `commercialUseAllowed` must exactly match `src/lib/types.ts`'s reviewed licence policy. `remixable` may be true only when derivatives are permitted and there is a validated Studio base (layers or an approved sanitized raster). ND sources never enter the Studio shelf. ShareAlike credits remain attached to elements and exports; incompatible licence mixes are rejected. Unknown licences fail validation until a human reviews the policy.

Preview images should have matching WebP/AVIF versions and a poster-specific OG image. Downloads need true physical dimensions, accurate byte sizes and clear format labels. Do not relabel a screen image as print-ready. Current PDFs are RGB, outlined, exact-size and without bleed. Supply explicit shop-approved files when CMYK or bleed is needed.

Run `npm run validate:content`, `npm run build`, and the tests before committing. Validation generates `src/generated/catalog.json`; do not edit it by hand. `npm run seed` is a development generator for the original placeholders, not an ingest tool for future artist work.

Checked-in archive and community curation use reviewed Git commits. Contributor works are stored privately in Supabase/R2 until an administrator reviews them at `/en/admin/review/`. Approval copies sanitized files to public R2 and triggers a Netlify rebuild; nothing is published automatically on upload. To add reviewed community entries, add explicitly licensed records after obtaining permission; never invent submissions. Fonts live in `public/fonts` with their open licences. The user-supplied Red Lark Workshop branding is separate from the CC0 seed art.

Artist `publicContact` and `publicUpi` are optional, independent `{value, consented:true}` fields. Do not put private or unconsented values anywhere in public content; validation rejects them. Pseudonymous names are allowed. The project inbox is not automatically an artist contact. Studio image/caption libraries live in `content/studio`; every entry must point to a remix-eligible work and correct code/layer IDs. Never add ND work to either library.

`content/community.json` is an initially empty list of reviewed poster slugs. Add only approved non-placeholder records; validation rejects fictional seed entries in the community gallery. The page displays that list automatically after rebuilding. Preview derivatives must include `preview-240`, `preview-400` and `preview-700` in both WebP and AVIF. The local type kit is downloadable with its original font licences; it is not CC0 artwork.
