import { checked, service } from "../src/server/auth.ts";
try {
  process.loadEnvFile(".env.local");
} catch {
  /* Runtime may provide env. */
}
const email = process.env.ADMIN_BOOTSTRAP_EMAIL;
if (!email) throw new Error("ADMIN_BOOTSTRAP_EMAIL is required. No role changed.");
try {
  checked(await service().rpc("bootstrap_admin", { p_email: email }));
  console.log(
    "Admin bootstrap complete (idempotent). Verified email, real login and verified TOTP were required. Identity withheld.",
  );
} catch {
  console.error(
    "Admin bootstrap refused. The configured person must verify their email, sign in and verify TOTP first. No public bootstrap endpoint exists.",
  );
  process.exitCode = 1;
}
