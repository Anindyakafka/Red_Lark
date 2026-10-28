# Current iteration record

Earlier rounds are preserved in [the historical log](archive/ITERATIONS-before-2026-10-28.md). This record covers the 28 October repair only.

## Round 1 critique — crop reproduction and geometry

1. Highest impact: crop was image-only, so archive poster vectors could not be cropped. Unit and mobile browser regressions failed before the fix.
2. Archive imports lacked a group frame, which made whole-poster manipulation impossible.
3. Crop was hidden in the Images panel and cancelled when unrelated scene state changed.

The fix adds validated v3 poster groups, non-destructive vector/group clips, visible controls, keyboard access, and v2 migration. Unit and focused browser tests now pass. A touch test initially failed because the test began dragging while the canvas was outside the mobile viewport; scrolling it into view made the existing and new touch paths consistent. The first PNG pixel assertion landed on the seeded template headline; an empty fixture isolated the cropped vector and passed.

## Round 2 critique — security and repository footprint

1. Highest impact: the tracked planning deck and 1,387 evidence files exposed unlicensed imagery and made the repository heavy. Both are removed from the index; 68 small JSON/Markdown summaries are copied to a retained folder.
2. `script-src 'unsafe-inline'` allowed arbitrary inline scripts. Static export produces route-specific inline payloads, so the build now computes SHA-256 allowlists per HTML page. Six browser routes hydrate without CSP violations.
3. Next.js 16.4.0 had a security advisory. Next.js and matching ESLint config are upgraded to 16.4.3; `npm audit fix` resolved a transitive issue; audit reports zero vulnerabilities. CI action refs are pinned to official release SHAs.

Remaining risk: live Netlify Edge/CSP behavior still needs deployment verification. The local static preview and Edge preflight both pass. History still contains deleted artifacts until owner coordinates a rewrite.

## Round 3 critique — documentation and final acceptance

1. Historical checklist and owner notes contradicted the current optional-contributor-account decision. They are archived and replaced with current evidence and owner-only actions.
2. Many old Markdown files contain repeated UTF-8 mojibake. Encoding repair and a guard script are in progress.
3. Full browser suite, Lighthouse, LF normalization and live service acceptance remain. No earlier performance result will be represented as a fresh measurement.

## Round 4 critique — regression truthfulness

1. The full browser run exposed one stale ShareAlike browser fixture after the catalogue was intentionally reduced to the retained CC0 work. The test now exercises the real CC0 remix route; the dedicated unit test continues to verify ShareAlike attribution and incompatible-licence rejection.
2. The current 390px landing capture is readable and has no horizontal overflow, but the poster-wall cells remain visually quiet with the intentionally minimal seeded catalogue. This is content-dependent rather than a layout failure.
3. The automated long-form visual review needs a final clean run after the guest contribution selector change. Generated evidence remains local and ignored by Git.

## Round 5 critique — parallel browser harness

1. A full 264-test parallel Playwright run found legacy backend tests that expect an unauthenticated redirect before their session fixture resolves. The static shell instead remains at “Checking your session…”. This is a test-harness timing/isolation issue, not evidence that access is granted.
2. Focused route, crop, CSP and unit suites pass. The remaining browser fixture timing work must be resolved before claiming a complete end-to-end browser pass.
