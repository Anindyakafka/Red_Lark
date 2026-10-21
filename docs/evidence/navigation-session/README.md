# Navigation, language controls and admin session verification

All screenshots show local placeholder content or mocked private states. No real contributor work, tokens or contact-message contents are included.

- `before-language-*.png`: original header alignment and uneven landing language wrap.
- `{locale}-header-{width}.png` and language-picker equivalents: viewed final controls at 390/1440; geometry and axe also pass at 360/768/1024 in all four locales.
- `browser-summary.json`: 249 unique passing tests. Full suite passed 236 and exposed one English-only selector in the new translated-form test. After correcting that selector, all 29 focused tests passed, including 12 new viewport cases. Both original and rerun reports are retained; this summary uses the latest result for an identical test title.
- `export-brackets.json`: all 396 exported HTML files have no square brackets in rendered text or browser-tab titles. Scripts, CSS and code/data arrays are excluded from the text scan; user-authored design content is not altered.
- `hosted.json`: a disposable hosted Supabase admin kept its MFA across ten session checks and provider token refresh; RLS access remained valid. The test account was removed and no real email was sent.
- `lighthouse.json`: three consecutive cold-cache mobile runs per public page, with all scores retained. Medians: English Home/Collection/Poster 96/98/98; Hindi 96/96/97. Other categories 100; CLS 0. Raw reports remain locally under `.qa/navigation-lighthouse`.

Final typecheck, lint, format, build/content validation, brand/output-secret checks and 71 unit/copy/RLS tests pass. The 24-hour MFA migration has been applied over verified TLS; production UI/API changes require the PR deployment.
