# Studio workspace repair — 22 October 2026

Audit before editing: [STUDIO_AUDIT.md](STUDIO_AUDIT.md). Running desktop/tablet/phone measurements and screenshots are in [evidence/studio-workspace](evidence/studio-workspace).

## Result per problem

1. **Clean editing / retained attribution.** The editing SVG has no generated credit line. Only the specifically identified in-house placeholder edition marker is removed from templates; arbitrary artist text stays intact. Project source metadata survives layer removal, drafts and share links. Export-only credit defaults on for attribution licences and off for CC0, with position/type-size/colour controls and preview. SVG, PDF and PNG embed full source/artist/licence URLs; PNG uses UTF-8 iTXt while stripping older EXIF/text/time metadata. ND gates and incompatible-licence checks remain enforced.
2. **Compact options.** Eight button groups retain every audited feature in one overlay at a time. Mobile bottom sheets leave part of the artwork visible; toggling, clicking outside or Escape dismisses them. Focus is captured/returned and Tab stays within the open panel. Opening panels does not resize/reposition the viewport. New language keys exist in en/hi/bn/ml, with native review still pending for new English fallbacks.
3. **Crop from every side.** Eight 44px edge/corner targets, move, free/locked/preset ratios, dimmed original preview, numeric/arrow-key controls and apply/cancel/reset. Original image bytes are retained. Inverse transforms support rotated/scaled layers; entering crop fits the full rotated original. Common rendering keeps crop geometry consistent across exports.
4. **Whole-viewport gestures.** Pinch/moving-midpoint zoom, two-finger translation, viewport-margin gestures, Ctrl/Cmd wheel, trackpad pan, Space/middle/empty-space drag, fit/reset and synchronized 25–400% zoom. Pointer capture and viewport-local touch/gesture handling avoid page-zoom and layer-drag conflicts. Page scrolling outside the viewport remains available.

## Files

- Editor/layout: `src/studio/studio.tsx`, `option-panel.tsx`, `workspace.css`, localized Studio page.
- State/geometry: `src/lib/types.ts`, `src/studio/model.ts`, `geometry.ts`, `use-image-crop.ts`, `crop-controls.tsx`, `crop-overlay.tsx`, `use-viewport.ts`.
- Attribution/export: `src/lib/licenses.ts`, `src/studio/attribution.ts`, `render.ts`, `exports.ts`.
- Locale files: `messages/en.json`, `hi.json`, `bn.json`, `ml.json`; canonical landing wording, policy pages and LICENSE remain unchanged.
- Tests: new `tests/studio-workspace.test.ts` and Studio browser/theme/licence-fixture/helpers; existing export, interaction, completion, fresh, site and workshop tests now navigate option groups.
- Documentation: audit, report, README, PLAN, CHECKLIST, ITERATIONS, TODO_HUMAN and retained evidence. Next development generated its standard `AGENTS.md` guidance, retained for future edits.

## Verification

Production build/content/brand/client-secret validation passes (396 HTML files). All 78 unit/copy/RLS tests, typecheck and lint pass. The first full browser run passed 266/273; three incorrectly migrated Contact test steps and four checks exposing invalid dialog markup were corrected. The final affected-suite run passes 91/91, including the seven failures and the added keyboard/gesture regression: 274 unique browser tests are green across the two runs. Both sanitized reports are retained in the evidence folder rather than rewriting the initial result.

Viewed final English/Malayalam light/dark workspace and export screenshots at phone/tablet/desktop widths and rotated crop captures at 375/768/1440. Panel checks run full axe rules, with zero violations and no viewport reflow in all four locales. Browser-only SA fixtures do not change any published licence or artist work. No new runtime dependency, service, tracker or design upload is introduced. Public-page Lighthouse was not repeated for these lazy-loaded Studio changes; previous scores are historical evidence, not new measurements.

## Human decisions and limitations

Choose whether your workflow should require visible attribution rather than allow disabling it with a warning. Embedded metadata is not a guarantee of attribution surviving a print/repost. Review the new hi/bn/ml strings; they stay marked `reviewed:false`. Credits/text already flattened into imported raster pixels are not automatically erased or reconstructed as editable type. Real-device iOS Safari/Android touch and physical print quality need manual confirmation; Chromium mouse/pen/touch emulation is evidence for the implementation, not certification of those devices.

## Short manual check

1. Open a blank/starter design and a CC0 remix. Confirm no generated canvas credit/edition marker; open and close each option by button, outside click and Escape without moving the artboard.
2. With an approved SA work, confirm export credit defaults on. Reposition/restyle it and inspect the export preview. If disabling it, read the warning and arrange full credit with distribution; inspect SVG/PDF/PNG attribution metadata.
3. Import a local image, rotate it, crop using every edge/corner and a ratio preset, cancel/reset/apply, undo and reload. Confirm the original can still be re-cropped.
4. Pinch/pan in viewport margins; zoom at a pointer; use Space/middle drag and double-tap/click Fit. Move a layer and crop at different zooms. Check that gestures do not zoom the page and that scrolling works outside the viewport.
5. Print an A4 PDF and 300-PPI PNG sample; check crop, outlined type, colour and credit visibility. Confirm phone/tablet usability in light/dark mode and browsing/downloading from Collection with JavaScript disabled.
