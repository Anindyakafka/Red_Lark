# Human configuration before publication

These require real decisions or permissions, not invented substitutes.

| Item                    | Current state                                                | Human action                                                                                                                                       |
| ----------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Real contact inbox      | CONTACT_EMAIL unset; UI visibly says delivery is unavailable | Supply a monitored address at build time. Verify mailto on devices.                                                                                |
| Legal review            | Privacy and terms prominently marked draft                   | Review jurisdiction, licence wording, consent/storage basis, liability and takedown policy.                                                        |
| Artwork permission      | Only 18 authored CC0 placeholders                            | Obtain explicit licences, credits, source URLs and remix permissions from actual artists before publishing their work.                             |
| Artist support          | Invented placeholder credits have no donation links          | Supply approved direct support URLs; no payments run through Mirafra.                                                                              |
| Domain                  | Netlify origin auto-detected; local builds use localhost     | Choose/configure a domain in Netlify and rebuild; SITE_URL is an optional explicit override.                                                       |
| Hosting                 | Netlify selected; netlify.toml and static headers configured | Connect the release branch, deploy, verify live routes/headers and document Netlify access-log retention. No deployment performed by the agent.    |
| Analytics               | Disabled by default                                          | If wanted, operate self-hosted Plausible with a same-origin event proxy, configure env vars, document retention and reassess consent requirements. |
| Submission backend      | Explicit email handoff, no database                          | Confirm email workflow; decide whether a future backend is needed. Document that decision here before adding storage.                              |
| Physical print approval | RGB, no bleed, exact-size vectors; no physical press check   | Test actual printers and agree any CMYK profiles, finishing, bleed and cutline requirements.                                                       |

Technical defects and unmet automated targets belong in CHECKLIST/ITERATIONS, not this list. This file does not turn unverified engineering claims into PASS.
