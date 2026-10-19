import { randomUUID } from "node:crypto";
import { resolveTxt, resolveMx } from "node:dns/promises";
import { sendEmail } from "../src/server/mail.ts";
try {
  process.loadEnvFile(".env.local");
} catch {
  /* Environment may be supplied directly. */
}
for (const host of [
  "resend._domainkey.mail.redlarkworkshop.com",
  "send.mail.redlarkworkshop.com",
  "_dmarc.mail.redlarkworkshop.com",
  "_dmarc.redlarkworkshop.com",
]) {
  try {
    const rows = await resolveTxt(host);
    console.log(`${host}: TXT present (${rows.length} records).`);
  } catch {
    console.log(`${host}: TXT not resolved.`);
  }
}
try {
  console.log(
    `send.mail.redlarkworkshop.com: MX present (${(await resolveMx("send.mail.redlarkworkshop.com")).length} records).`,
  );
} catch {
  console.log("Sending return-path MX not resolved.");
}
if (!process.argv.includes("--send")) {
  console.log("DNS lookup only; --send is required for the two owner-authorized Gmail tests.");
  process.exit(0);
}
for (const to of ["redlarkworkshop@gmail.com", "anindya2232@gmail.com"]) {
  try {
    await sendEmail(
      to,
      "Red Lark Workshop — delivery verification",
      "This is an owner-authorized development email test. Please check Inbox versus Spam, use Show original to verify SPF/DKIM/DMARC PASS and alignment, and confirm Reply-To points to the team inbox. Provider acceptance alone does not complete this test. No artwork or account credentials are included.",
      "redlarkworkshop@gmail.com",
      `delivery-test-${randomUUID()}`,
    );
    console.log(
      "Owner-authorized Gmail test accepted by provider; inbox/header inspection remains required.",
    );
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error ? String(error.code) : "unknown";
    const status =
      error && typeof error === "object" && "providerStatus" in error
        ? Number(error.providerStatus)
        : 0;
    console.error(
      `Owner-authorized test failed: ${/^[a-z_]+$/.test(code) ? code : "withheld"}; provider HTTP status ${status || "not reached"}. Body/credentials withheld.`,
    );
    process.exitCode = 1;
  }
}
