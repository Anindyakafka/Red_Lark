/** Build-time origin shared by metadata and content validation. */
export function resolveSiteOrigin(env: Record<string, string | undefined>): string {
  const value = env.SITE_URL?.trim() || "https://redlarkworkshop.com";
  const url = new URL(value);
  if (url.hostname.endsWith(".netlify.app"))
    throw new Error("SITE_URL must use the public custom domain, not a deployment hostname.");
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
