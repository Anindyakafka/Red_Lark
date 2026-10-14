# Adding posters and artists

Nothing is added without an explicit licence, artist credit, source URL and meaningful alt text. A free download is not permission to make derivatives.

`posters/*.json` contains one record per poster; `artists/*.json` contains credited artists. Images and print files live in `public/posters/<slug>/`. The 18 seed posters are original CC0 vector/typographic placeholders authored for this rebuild, with openly invented lab credits. No real artist artwork has been downloaded or embedded.

Use an existing record as the schema example. Provide: slug, English title, optional original-language title, languages, artist ID, year, themes, movements, colour mode, region, format/size/path/byte metadata, licence ID and URL, source, artist URL, alt description, caption, preview and dominant colour. Set placeholder=false only for an approved contribution.

`allowsDerivatives` and `commercialUseAllowed` must exactly match `src/lib/types.ts`'s reviewed licence policy. `remixable` may be true only when derivatives are permitted AND a validated `studioLayers` scene exists. ND sources never enter the Studio shelf. ShareAlike credits remain attached to elements and exports; incompatible licence mixes are rejected. Unknown licences fail validation until a human reviews the policy.

Preview images should have matching WebP/AVIF versions and a poster-specific OG image. Downloads need true physical dimensions, accurate byte sizes and clear format labels. Do not relabel a screen image as print-ready. Current PDFs are RGB, outlined, exact-size and without bleed. Supply explicit shop-approved files when CMYK or bleed is needed.

Run `npm run validate:content`, `npm run build`, and the tests before committing. Validation generates `src/generated/catalog.json`; do not edit it by hand. `npm run seed` is a development generator for the original placeholders, not an ingest tool for future artist work.

Publication and community curation happen through reviewed Git commits. There is no user database or automatic publication. To add reviewed community entries, add explicitly licensed records after obtaining permission; never invent submissions. Fonts live in `public/fonts` with their open licences. The user-supplied Mirafra branding is separate from the CC0 seed art.

`content/community.json` is an initially empty list of reviewed poster slugs. Add only approved non-placeholder records; validation rejects fictional seed entries in the community gallery. The page displays that list automatically after rebuilding. Preview derivatives must include `preview-240`, `preview-400` and `preview-700` in both WebP and AVIF. The local type kit is downloadable with its original font licences; it is not CC0 artwork.
