# Actions only the project owner or team can complete

This list replaces the [historical setup notes](archive/TODO_HUMAN-before-2026-10-28.md). The infrastructure is already provisioned. **Keep Supabase public signup ON**: contributor accounts are optional, and guest uploads remain available. Admin access is granted separately and requires MFA.

1. **Rotate exposed mail credentials.** Revoke the earlier Resend API key and create a new restricted key. Replace `MAIL_PROVIDER_KEY` in Netlify and local `.env.local`. Rotate the Supabase custom SMTP password/credential that was exposed earlier and update the Supabase SMTP setting. Confirm both rotations without pasting values, reset links, or authenticator codes into chat.
2. **Purge old Git history after coordinating with collaborators.** The current commit removes the tracked planning deck and untracks bulky evidence. A history rewrite will change commit IDs and require everyone to reclone. Use a fresh mirror clone, then:
   ```bash
   git clone --mirror https://github.com/Anindyakafka/Red_Lark.git red-lark-purge.git
   cd red-lark-purge.git
   git filter-repo --path 'Red Lark Workshop.pptx' --path docs/evidence/ --invert-paths --force
   git remote add origin https://github.com/Anindyakafka/Red_Lark.git
   git push --force --mirror origin
   ```
   Preserve any needed screenshots outside Git before the rewrite. Tell collaborators to discard old clones and reclone. Update cached forks/PRs as needed. Do not run this command until the team agrees on timing. GitHub release assets can hold review screenshots; keep only small summaries in Git.
3. **Review draft translations** with native Hindi, Bengali and Malayalam readers. New UI strings remain `reviewed:false`; inspect a real phone for Indic clipping and Workshop gestures.
4. **Get India-specific legal review** of privacy, terms, licensing, consent, removal and retained historical records. Confirm the archive backfill/retention policy before presenting the archive as complete. Confirm artist permissions and rights before publishing real works.
5. **Confirm live Netlify settings and behavior** after deployment: canonical `SITE_URL`, public-catalogue build flag, build hook, R2 approved host, mail, CSP headers, redirects and approved-work visibility. Use a real admin session with MFA for a harmless review/edit and a reversible test contribution. Local fixtures cannot prove production publication or mail delivery.
6. **Review physical output and real devices.** Print an A4/A2 sample with a rotated crop and credit strip; test touch crop on iOS Safari and Android Chrome. Desktop emulation cannot certify printer or device behavior.

No new credentials, addresses, artworks or legal authority have been invented. Never send secrets in chat.
