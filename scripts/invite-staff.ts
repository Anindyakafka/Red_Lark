import { randomUUID } from "node:crypto";
import { checked, service } from "../src/server/auth.ts";
import { sendEmail } from "../src/server/mail.ts";
import { origin, required } from "../src/server/security.ts";
try {
  process.loadEnvFile(".env.local");
} catch {
  /* Runtime may supply environment. */
}
const address = process.argv[2]?.trim();
try {
  if (!address || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(address)) throw new Error();
  // Generate, rather than immediately send, so the role is in place before the link can be used.
  const result = await service().auth.admin.generateLink({ type: "invite", email: address });
  if (result.error || !result.data.user || !result.data.properties?.hashed_token) throw new Error();
  checked(await service().rpc("invite_staff", { p_user: result.data.user.id }));
  const link = new URL("/api/auth/invite", origin());
  link.searchParams.set("token_hash", result.data.properties.hashed_token);
  await sendEmail(
    address,
    "Your Red Lark Workshop staff invitation",
    `You have been invited to help review artwork at Red Lark Workshop. Open this one-use link to verify your email and choose a password:\n\n${link}\n\nThen sign in and set up an authenticator in Account security. A password does not replace authenticator verification. If you did not expect this invitation, ignore it and contact the team.`,
    required("MAIL_TO_TEAM"),
    `staff-invite-${randomUUID()}`,
  );
  console.log(
    "Staff invitation sent. Email verification and fresh MFA are still required. Identity and link withheld.",
  );
} catch {
  console.error(
    "Invitation not completed. Check the address, applied migrations and mail configuration. No credentials or invitation link were logged. Existing verified accounts use admin:grant instead; an interrupted invitation can be retried.",
  );
  process.exitCode = 1;
}
