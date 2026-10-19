import fs from "node:fs";
import path from "node:path";
import { parseEnv } from "node:util";
const local = fs.existsSync(".env.local") ? parseEnv(fs.readFileSync(".env.local", "utf8")) : {};
const env = { ...local, ...process.env };
const names = [
  "SUPABASE_SECRET_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "R2_SECRET_ACCESS_KEY",
  "R2_ACCESS_KEY_ID",
  "MAIL_PROVIDER_KEY",
  "SESSION_ENCRYPTION_KEY",
  "RATE_LIMIT_SECRET",
  "NETLIFY_BUILD_HOOK",
  "DATABASE_URL",
];
for (const [name, value] of Object.entries(env))
  if (
    name.startsWith("NEXT_PUBLIC_") &&
    (/(SECRET|SERVICE_ROLE|PASSWORD|PRIVATE_KEY|DATABASE_URL|R2_ACCESS_KEY|MAIL_PROVIDER_KEY|SESSION_ENCRYPTION|BUILD_HOOK)/.test(
      name,
    ) ||
      (value && names.some((n) => env[n] === value)))
  )
    throw new Error(`Secret exposed through ${name}; value withheld.`);
const secrets = names.map((n) => env[n]).filter((v) => v && v.length >= 12);
const errors = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else {
      const data = fs.readFileSync(file);
      const text = data.toString("utf8");
      if (
        secrets.some((s) => data.includes(Buffer.from(s))) ||
        /sb_secret_[A-Za-z0-9_-]{16,}|\bre_[A-Za-z0-9]{20,}/.test(text)
      )
        errors.push(file);
      for (const token of text.matchAll(/eyJ[A-Za-z0-9_-]+\.([A-Za-z0-9_-]+)\.[A-Za-z0-9_-]+/g)) {
        try {
          if (JSON.parse(Buffer.from(token[1], "base64url").toString()).role === "service_role")
            errors.push(file);
        } catch {}
      }
    }
  }
}
if (!fs.existsSync("out"))
  throw new Error("Build output is missing; secret audit was not skipped.");
walk("out");
if (errors.length)
  throw new Error(
    `Private credential material in client output: ${[...new Set(errors)].join(", ")}. Values withheld.`,
  );
console.log(
  "Client secret audit passed: no private Supabase/R2/mail/session credentials in static output.",
);
