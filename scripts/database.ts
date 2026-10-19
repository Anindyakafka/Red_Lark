import fs from "node:fs";
import crypto from "node:crypto";
import postgres from "postgres";

try {
  process.loadEnvFile(".env.local");
} catch {
  /* CI may supply env directly. */
}
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is missing; no database changes made.");
const parsed = new URL(url);
if (!parsed.hostname.endsWith(".supabase.com") && !parsed.hostname.endsWith(".supabase.co"))
  throw new Error("Expected the existing Supabase connection. No changes made.");
const caPath = process.env.DATABASE_CA_CERT || ".qa/supabase-ca.crt";
const sql = postgres(url, {
  ssl: {
    rejectUnauthorized: true,
    ...(fs.existsSync(caPath) ? { ca: fs.readFileSync(caPath, "utf8") } : {}),
  },
  max: 1,
  connect_timeout: 15,
  onnotice: () => {},
});
try {
  await sql`select 1`;
  console.log("Database connection verified with TLS; credentials withheld.");
  if (process.argv.includes("--apply")) {
    await sql`create schema if not exists redlark_migrations`;
    await sql`create table if not exists redlark_migrations.applied(name text primary key, sha256 text not null, applied_at timestamptz not null default now())`;
    // Dedicated migration ledger is not exposed through the public REST schema.
    await sql`revoke all on schema redlark_migrations from public,anon,authenticated`;
    for (const name of fs
      .readdirSync("supabase/migrations")
      .filter((n) => n.endsWith(".sql"))
      .sort()) {
      const source = fs
        .readFileSync(`supabase/migrations/${name}`, "utf8")
        .replaceAll("\r\n", "\n");
      const hash = crypto.createHash("sha256").update(source).digest("hex");
      const previous = await sql`select sha256 from redlark_migrations.applied where name=${name}`;
      if (previous.length) {
        if (previous[0].sha256 !== hash)
          throw new Error("An applied migration changed; append a new migration instead.");
        continue;
      }
      await sql.begin(async (tx) => {
        await tx.unsafe(source.replace(/^begin;|^commit;/gim, ""));
        await tx`insert into redlark_migrations.applied(name,sha256) values(${name},${hash})`;
      });
      console.log(`Applied ${name}.`);
    }
    await sql.unsafe(fs.readFileSync("supabase/seed.sql", "utf8"));
    console.log("Seed applied: categories, formats, licences and private placeholder drafts only.");
    const tables =
      await sql`select count(*)::int n from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and not c.relrowsecurity`;
    if (tables[0].n) throw new Error("Public tables without RLS require review.");
    console.log("Hosted schema check passed: all public tables have RLS enabled.");
  }
} catch (error) {
  const code =
    error && typeof error === "object" && "code" in error ? String(error.code) : "unknown";
  console.error(`Database diagnostic code: ${/^[A-Z0-9_]+$/.test(code) ? code : "withheld"}.`);
  console.error(
    "Database operation failed. Credentials/provider details withheld. Check the saved URI, database password, port 5432, TLS certificate and network access; no insecure TLS fallback is used.",
  );
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
