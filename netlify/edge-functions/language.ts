import { chooseLocale, isLocale } from "../../src/i18n/config";
interface EdgeContext {
  next: () => Promise<Response>;
}
export default async function language(request: Request, context: EdgeContext) {
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
  const response = await context.next();
  if (response.status !== 404) return response;
  const fallback = await fetch(new URL(`/${first}/404/`, url));
  return new Response(fallback.body, { status: 404, headers: fallback.headers });
}
