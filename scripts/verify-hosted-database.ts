import fs from "node:fs";
import postgres from "postgres";
try {
  process.loadEnvFile(".env.local");
} catch {
  /* Environment may be supplied directly. */
}
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL required.");
const db = postgres(url, {
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync(process.env.DATABASE_CA_CERT || ".qa/supabase-ca.crt", "utf8"),
  },
  max: 1,
  onnotice: () => {},
});
try {
  await db.begin(async (tx) => {
    await tx`set local role anon`;
    const works = await tx`select id from public.works`;
    if (works.length)
      throw new Error("Unexpected public work during private-only seed verification.");
    const catalogue = await tx`select public.public_catalogue() catalogue`;
    if (catalogue[0].catalogue.length)
      throw new Error("Private seed leaked into public catalogue.");
    const categories = await tx`select count(*)::int n from public.categories`,
      formats = await tx`select count(*)::int n from public.formats`;
    if (categories[0].n !== 28 || formats[0].n !== 10) throw new Error("Seed inventory mismatch.");
  });
  for (const table of [
    "messages",
    "audit_log",
    "roles",
    "app_sessions",
    "rate_limits",
    "mail_jobs",
    "guest_submissions",
  ]) {
    let denied = false;
    try {
      await db.begin(async (tx) => {
        await tx`set local role anon`;
        await tx.unsafe(`select * from public.${table} limit 0`);
      });
    } catch {
      denied = true;
    }
    if (!denied) throw new Error("Private-table access unexpectedly allowed.");
  }
  console.log(
    "Hosted verification passed: 28 categories, 10 formats; anonymous catalogue hides private drafts; private tables denied. No personal records printed or changed.",
  );
} catch {
  console.error("Hosted database verification failed; query/provider details withheld.");
  process.exitCode = 1;
} finally {
  await db.end({ timeout: 5 });
}
