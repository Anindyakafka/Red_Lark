import { checked, service } from "../src/server/auth.ts";
try {
  process.loadEnvFile(".env.local");
} catch {
  /* Hosting can supply environment. */
}
const address = process.argv[2]?.trim();
if (!address || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
  console.error("Usage: npm run admin:grant -- <existing-verified-email>");
  process.exitCode = 1;
} else {
  try {
    checked(await service().rpc("grant_admin", { p_email: address }));
    console.log(
      "Admin role granted (idempotent). Sign in, then enroll and verify an authenticator in Account security. Administration requires a fresh MFA code. Identity withheld.",
    );
  } catch {
    console.error(
      "Role not granted. Check that the person has an existing email-verified website account and that the migrations are applied. No public grant endpoint exists.",
    );
    process.exitCode = 1;
  }
}
