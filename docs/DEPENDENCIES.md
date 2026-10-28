# Dependency review — 28 October 2026

Before this repair, the lockfile resolved Next.js **16.4.0**. Earlier project notes flagged a critical production advisory, but the first local `npm audit` request failed because registry access was unavailable in the sandbox. I therefore do not claim a new numeric pre-upgrade audit result.

Next.js and `eslint-config-next` are now **16.4.3**, the current stable 16.4 patch at the time of this repair. The first successful full `npm audit --json` after the upgrade reported **one moderate transitive `fast-uri` finding**. `npm audit fix` updated that dependency; the command then reported **zero vulnerabilities** across the installed dependency tree. Re-run audit regularly because advisories and dependency versions change.

The upgrade passed TypeScript, ESLint, 88 unit tests, the 300-page static build, and focused browser checks. Full browser and Lighthouse verification is tracked in [CHECKLIST.md](CHECKLIST.md).

Sources: [Next.js 16.4.3 release](https://github.com/vercel/next.js/releases/tag/v16.4.3), [Next.js security advisories](https://github.com/vercel/next.js/security/advisories), [fast-uri advisory](https://github.com/advisories/GHSA-w74x-v6f9-j3xg).
