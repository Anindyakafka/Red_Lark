import { SECURITY_HEADERS } from "./security.ts";
import hashes from "./csp-hashes.json" with { type: "json" };
import { privateShellPath } from "../lib/private-routes.ts";

function routePath(pathname: string) {
  if (pathname === "/" || pathname === "/index.html") return "/";
  const shell = privateShellPath(pathname);
  return shell.endsWith("/") ? shell : `${shell}/`;
}

export function contentSecurityPolicy(pathname: string, fallback = false) {
  const key = fallback ? `/${pathname.split("/")[1] || "en"}/404/` : routePath(pathname);
  const sources = (hashes as Record<string, string[]>)[key] ?? [];
  const script = `script-src 'self'${sources.length ? ` ${sources.map((hash) => `'sha256-${hash}'`).join(" ")}` : ""}`;
  return SECURITY_HEADERS["Content-Security-Policy"].replace("script-src 'self'", script);
}
