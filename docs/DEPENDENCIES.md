# Dependency review — 16 October 2026

The M9 install exposed advisories in existing packages. Updated jsPDF to 4.2.1 and Sharp to 0.35.5; PDF/PNG/tiled exports and raster metadata are covered by the browser/unit suite. `npm audit --omit=dev` reports **zero vulnerabilities** after these updates. The repository-only MDX compiler runs during builds; it never evaluates uploaded or remote content. See the [MDX compiler API](https://mdxjs.com/packages/mdx/).

The full audit still reports five high-severity dependency nodes from one development-only chain: eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces 3.0.3. The [braces advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) lists no patched version; the published latest checked is 3.0.3. This is not shipped to visitors or used for visitor input: ESLint consumes repository-controlled patterns during development/CI. Treat untrusted repository/build configuration as code and review it before execution.

Do not run `npm audit fix --force`: its proposed downgrade to a Next 14 ESLint configuration would break the framework/tooling contract without fixing the current stack coherently. Follow upstream for a real patched release, then update and rerun lint/build. This is a tracked tooling limitation, not a claim that the full audit is clean.

Primary patch references: [jsPDF output-method advisory](https://github.com/parallax/jsPDF/security/advisories/GHSA-wfv2-pwc8-crg5), [Sharp dependency advisory](https://github.com/lovell/sharp/security/advisories/GHSA-wq5f-xc86-pv6w).
