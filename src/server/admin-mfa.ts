// Owner-selected bounded verification window. Keep private.admin_fresh() in sync.
export const ADMIN_MFA_MAX_AGE_SECONDS = 30 * 86400;
export type AssuranceClaims = { aal?: string; amr?: { method: string; timestamp: number }[] };
export function adminMfaFresh(claims: AssuranceClaims, now = Date.now()) {
  return (
    claims.aal === "aal2" &&
    Boolean(
      claims.amr?.some(
        (entry) =>
          entry.method === "totp" &&
          Number.isFinite(entry.timestamp) &&
          entry.timestamp * 1000 >= now - ADMIN_MFA_MAX_AGE_SECONDS * 1000 &&
          entry.timestamp * 1000 <= now + 30000,
      ),
    )
  );
}
