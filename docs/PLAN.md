# Current implementation plan — 28 October 2026

This file supersedes the [historical plan](archive/PLAN-before-2026-10-28.md). The English landing copy remains locked by `tests/copy.test.ts`.

| Round | Work                                                                                | Status                     | Acceptance                                                                              |
| ----- | ----------------------------------------------------------------------------------- | -------------------------- | --------------------------------------------------------------------------------------- |
| 1     | Reproduce and repair Workshop crop for vectors and imported poster groups           | Implemented                | Unit and browser crop tests; output checks for SVG, PNG and PDF; migration tests        |
| 2     | Remove unlicensed planning deck and bulky evidence from Git; retain small summaries | Implemented, not committed | `git ls-files` excludes PPTX and `docs/evidence`; release attachment process documented |
| 3     | Enforce strict script CSP; pin CI actions; update vulnerable dependencies           | Implemented                | Build validates all HTML script hashes; browser hydration; audit and secret scan        |
| 4     | Replace stale checklist/human instructions; repair encoding; normalize line endings | Implemented, pending commit | Current evidence only, mojibake check, dedicated LF commit                              |
| 5     | Full route, upload/admin, axe and Lighthouse verification                           | In progress                | Unit, focused browser/CSP and local visual review are green; full report is retained locally |

## Decision notes

- Workshop poster imports remain editable vectors. A shared group frame provides whole-poster movement, resizing, rotation and crop; each member remains individually selectable.
- Scene schema v3 adds group clipping. Version 2 drafts and share links migrate without discarding layers.
- Static export needs per-page script hashes because generated inline payloads differ by route. Edge and local preview use the same generated hash inventory.
- `docs/evidence-local/` is ignored and holds screenshots/raw reports. Small retained summaries are in `docs/evidence-summaries/`. The old evidence directory is removed from the Git index without deleting local copies.
- Public contributor signup remains on. Guest contribution remains the default. Administrator privileges require a controlled grant/invitation and MFA.
