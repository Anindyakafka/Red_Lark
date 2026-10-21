import { ApiError } from "./security.ts";
export const validInvitationToken = (token: string) =>
  /^(?:[a-f0-9]{56}|[a-f0-9]{64})$/i.test(token);
export function invitationOrigin(configured = process.env.SITE_URL) {
  const url = new URL(configured?.trim() || "https://redlarkworkshop.com");
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    url.hostname.endsWith(".netlify.app") ||
    ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
  )
    throw new ApiError(503, "invalid_invitation_origin");
  return url.origin;
}
export function invitationPage(token: string, base: string) {
  if (!validInvitationToken(token)) throw new ApiError(400, "link_expired");
  const url = new URL("/en/verify/", base);
  // Fragments are not sent in HTTP requests, referrers or server access logs.
  url.hash = new URLSearchParams({ invite: token }).toString();
  return url.href;
}
export async function checkInvitationDeployment(base: string, transport: typeof fetch = fetch) {
  const response = await transport(new URL("/api/auth/invite", base), {
    redirect: "manual",
    signal: AbortSignal.timeout(10000),
  });
  if (response.status !== 303 || response.headers.get("X-Redlark-Invite-Flow") !== "confirm-v1")
    throw new ApiError(503, "invitation_deploy_required");
}
