# Studio plan

The studio is a composition tool built around approved Mirafra elements. Its useful scope is closer to a small poster designer than a general-purpose painting application.

## Current prototype

React controls edit a serialisable SVG document with four element kinds: text, bird, circle, rectangle. The document and history reducer are separate from the UI. Dragging commits one history entry when the pointer is released; control changes commit individual entries. Undo/redo retains 50 previous snapshots. Save and restore use one localStorage slot, with explicit buttons and validation. There is no automatic cloud saving.

The fixed document has `version: 1`, `width: 420`, and `height: 594` in design coordinates. These numbers represent the A3 aspect ratio, not output DPI. SVG export declares physical dimensions of 297 × 420 mm and keeps the same viewBox. The renderer permits a limited amount of positioning beyond the page; export clips to the page.

The simplified bird is a demo primitive, not an editable fragment extracted from the logo or final artwork. Catalogue posters cannot yet be imported as editable templates.

## Production document contract

Keep saved documents independent of Konva objects and DOM nodes. Introduce explicit schema migrations before changing the current contract. A future document should include:

- Schema version, document ID/revision, name, artboard dimensions and units, orientation, background, and print preset.
- Ordered elements with stable IDs, type, position, size, rotation, opacity, visibility, locking, and grouping.
- Text with content, font ID/version, weight, line height, alignment, wrapping width, and language/direction.
- Asset references with immutable approved file revisions; avoid arbitrary URLs.
- Element-level licence references and attribution that survive template remixing.
- Optional bleed and safe-area metadata; separate these from scene contents.

Scene validation must impose bounds on string length, node count, numeric ranges, total decoded raster pixels, and recursive/group depth. Uploaded fonts or arbitrary SVG code are outside the initial scope. Current restored drafts are validated and exported text is XML-escaped; production assets require a dedicated sanitation/ingest path too.

## Editor stages

### A. Catalogue composition

Approved, searchable elements and editable templates. Distinguish finished posters, editable templates, and reusable elements. Add a template from a curated scene document; do not imply a flattened image is fully editable. Use image/font preload states and handle missing licensed assets visibly.

### B. Reliable interaction

Use React Konva for selection, drag, resize handles, rotation, zoom, snapping, guides, keyboard nudging, shortcuts, grouping, multi-selection, layer locking, visibility, and duplication. Keep tool panels usable without canvas precision. Choose and test touch gestures; scrolling a small screen must remain possible outside the canvas.

Renderer transforms must map consistently into document coordinates. Use a stage-level viewport transform for zoom; never rewrite every node to simulate viewport zoom. Store logical sizes when normalising Konva scale transforms. [Konva's Transformer documentation](https://konvajs.org/docs/react/Transformer.html) is the implementation reference.

### C. Persistence

Move local persistence to IndexedDB when documents/assets are larger. Add debounced autosave, clear save state, recovery, multiple drafts, and document JSON import/export. Optional sign-in enables private cloud drafts. Persist revision numbers and detect conflicts before considering collaboration.

### D. Export

Provide named output presets and honest quality labels:

| Output | Intended use | Requirements |
| --- | --- | --- |
| SVG | Editable/vector source | Sanitised asset markup, deterministic geometry, explicit font policy |
| PNG | Digital sharing / specified-size raster | Physical preset → pixel dimensions, actual raster quality, memory limits |
| Home-print PDF | Convenient home printing | Correct paper size, embedded fonts, RGB, margins |
| Professional print PDF | Shop-approved production | Printer-specific standard/profile, embedded or outlined fonts, bleed/trim, preflight |
| Sticker sheet | Printing several stickers together | Real dimensions, spacing, cutline format agreed with printer |

At 300 pixels per inch: A4 is about 2480 × 3508 px, A3 3508 × 4961 px, and A2 4961 × 7016 px. Compute exact pixels from physical dimensions and the preset rather than using preview pixels. A3 alone is roughly 70 MB of raw RGBA data before intermediate copies; browser memory constraints matter. Increasing pixel dimensions cannot restore missing detail in a low-resolution input.

## Print pipeline

Approved originals → metadata and licence validation → font/asset resolution → scene rendering → profile/preset conversion → preflight → immutable stored output → download.

Use vector output where possible. All display previews can remain RGB; professional CMYK conversion happens through an explicit managed pipeline with the printer's profile. A PDF file extension, high DPI label, or canvas screenshot does not establish print readiness. Keep bleed, safe area, and trim distinct. Do not add universal crop marks without agreeing the printer's requirements.

The current SVG prototype uses system fonts and is not certified for professional printing. The logo wordmark is outlined and avoids that issue. Final catalogue print files can be pre-produced and quality checked before publishing; they do not need to wait for the interactive studio's print engine.

## Verification strategy

- Unit tests for scene validation, hostile text export, schema migrations, history semantics, geometry, and licence attribution propagation.
- Browser tests for adding, selecting, dragging, transforming, undo, draft recovery, and downloads.
- Export fixtures reviewed in at least two viewers; compare embedded font/asset results, clipping, and physical size.
- Real phone/tablet review, keyboard paths, readable control labels, predictable focus, and understandable error states.
- A physical sample print from each production preset before claiming print readiness.

Current automated checks cover document validation, XML escaping, history, and catalogue filtering. Browser interaction tests, physical printing, and production renderer/worker checks are not implemented yet.
