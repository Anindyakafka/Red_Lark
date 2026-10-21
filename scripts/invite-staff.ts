import { randomUUID } from "node:crypto";
import { checked, service } from "../src/server/auth.ts";
import { sendEmail } from "../src/server/mail.ts";
import { ApiError, required } from "../src/server/security.ts";
import {
  invitationOrigin,
  invitationPage,
  checkInvitationDeployment,
} from "../src/server/staff-invitation.ts";
try {
  process.loadEnvFile(".env.local");
} catch {
  /* Runtime may supply environment. */
}
const address = process.argv[2]?.trim();
try {
  if (!address || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(address)) throw new Error();
  const base = invitationOrigin();
  await checkInvitationDeployment(base);
  // Generate, rather than immediately send, so the role is in place before the link can be used.
  const result = await service().auth.admin.generateLink({ type: "invite", email: address });
  if (result.error || !result.data.user || !result.data.properties?.hashed_token) throw new Error();
  checked(await service().rpc("invite_staff", { p_user: result.data.user.id }));
  const link = invitationPage(result.data.properties.hashed_token, base);
  await sendEmail(
    address,
    "Your Red Lark Workshop staff invitation",
    `You have been invited to help review artwork at Red Lark Workshop. Open this link, then click Accept staff invitation to verify your email and choose a password:\n\n${link}\n\nThe invitation is used only when you click that button. If several invitations were sent, use the newest. Then sign in and set up an authenticator in Account security. A password does not replace authenticator verification. If you did not expect this invitation, ignore it and contact the team.`,
    required("MAIL_TO_TEAM"),
    `staff-invite-${randomUUID()}`,
  );
  console.log(
    "Staff invitation sent. Email verification and fresh MFA are still required. Identity and link withheld.",
  );
} catch (error) {
  if (error instanceof ApiError && error.code === "invitation_deploy_required") {
    console.error(
      "Invitation not sent: deploy the invitation confirmation fix to the public site first, then run this command again. No account, role or email was changed.",
    );
    process.exitCode = 1;
  } else {
    console.error(
      "Invitation not completed. Check the address, migrations and mail settings. SITE_URL must be a public HTTPS origin; a blank value uses https://redlarkworkshop.com, never localhost. No credentials/link were logged. Existing verified accounts use admin:grant, then Sign in or Forgot password; unused invitations can be reissued.",
    );
    process.exitCode = 1;
  }
}
