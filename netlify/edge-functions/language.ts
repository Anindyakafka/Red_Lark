import { chooseLocale, isLocale } from "../../src/i18n/config.ts";
import { SECURITY_HEADERS } from "../../src/config/security.ts";
import legacyRoutes from "../../content/legacy-routes.json" with { type: "json" };
interface EdgeContext {
  next: () => Promise<Response>;
}
async function route(request: Request, context: EdgeContext) {
  const url = new URL(request.url);
  const first = url.pathname.split("/")[1];
  if (
    url.pathname.startsWith("/_") ||
    url.pathname.startsWith("/api/") ||
    /\.[a-z0-9]+$/i.test(url.pathname)
  )
    return context.next();
  if (!isLocale(first)) {
    const locale = chooseLocale(request.headers.get("accept-language") ?? "");
    url.pathname = `/${locale}${url.pathname}`;
    return new Response(null, {
      status: 302,
      headers: { Location: url.href, Vary: "Accept-Language", "Cache-Control": "no-store" },
    });
  }
  const legacy = url.pathname.replace(/^\/(en|hi|bn|ml)/, "").replace(/\/$/, "");
  const destination = legacyRoutes[legacy as keyof typeof legacyRoutes];
  if (destination) {
    url.pathname = `/${first}${destination}`;
    return new Response(null, { status: 308, headers: { Location: url.href } });
  }
  const response = await context.next();
  if (response.status !== 404) return response;
  const fallback = await fetch(new URL(`/${first}/404/`, url));
  const headers = new Headers(fallback.headers);
  headers.delete("content-encoding");
  headers.delete("content-length");
  return new Response(fallback.body, { status: 404, headers });
}
export default async function language(request: Request, context: EdgeContext) {
  const response = await route(request, context);
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) headers.set(key, value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
