# Backend database

Migrations target Supabase Auth + Postgres. R2 holds all contribution files; no Supabase Storage bucket is created. Apply the ordered migrations and seed only to the existing owner-authorized project using Supabase CLI/database access. API keys do not provide SQL migration access. Never disable RLS to make an integration pass.

Run `npx tsx scripts/backend-seed.ts` to regenerate seed.sql from checked-in canonical inventories and original placeholders. It creates 28 categories, 10 formats, licences and 18 placeholder work records as PRIVATE DRAFTS. Seeding is not publication and does not copy files to R2. Publication requires the same sanitized-files/R2 path as any other work. The already public file-based starter archive remains available during this migration.

`npx tsx --test tests/rls.test.ts` applies the real migration to a local Postgres engine with a minimal Auth schema fixture. It tests SQL permissions/RLS and bootstrap conditions, not hosted Supabase email/session behavior. It neither uses .env.local nor changes the owner's project. Hosted integration and RLS verification remain required before release.
