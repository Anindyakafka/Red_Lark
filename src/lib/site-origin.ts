/** Build-time origin shared by metadata and content validation. */
export function resolveSiteOrigin(env: Record<string, string | undefined>): string {
  const preview = env.CONTEXT === "deploy-preview" || env.CONTEXT === "branch-deploy";
  const value =
    env.SITE_URL?.trim() ||
    (preview ? env.DEPLOY_PRIME_URL?.trim() : undefined) ||
    env.URL?.trim() ||
    "http://localhost:3000";
  const url = new URL(value);
  if (env.CONTEXT === "production" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))
    throw new Error("Production SITE_URL must be a public origin, not localhost.");
  if (
    !["https:", "http:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new Error("SITE_URL must be an HTTP(S) origin without credentials, a path or query.");
  return url.origin;
}
