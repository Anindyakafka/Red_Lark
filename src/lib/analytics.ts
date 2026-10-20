type EventName = "pageview" | "poster-download" | "studio-export" | "upload-submitted";
export function analyticsPath(path: string, name: EventName): string | null {
  const locale = path.match(/^\/(en|hi|bn|ml)(?:\/|$)/)?.[1] || "en";
  // Submission counts must never disclose a private revision ID or account route.
  if (name === "upload-submitted") return `/${locale}/submit/`;
  if (
    /^\/(?:en\/|hi\/|bn\/|ml\/)?(?:account|admin|login|signup|verify|check-your-inbox|forgot-password|reset-password|logout)(?:\/|$)/.test(
      path,
    )
  )
    return null;
  return path;
}
export function analyticsConfiguration() {
  const endpoint = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT;
  const domain = process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN;
  if (!endpoint || !domain || !/^\/(?![\/\\])/.test(endpoint)) return null;
  const parsed = new URL(endpoint, "https://validation.invalid");
  if (parsed.origin !== "https://validation.invalid" || parsed.search || parsed.hash) return null;
  return { endpoint, domain };
}
export function track(name: EventName) {
  const configuration = analyticsConfiguration();
  if (typeof window === "undefined" || !configuration || navigator.doNotTrack === "1") return;
  const { endpoint, domain } = configuration;
  const path = analyticsPath(location.pathname, name);
  if (!path) return;
  const url = `${location.origin}${path}`; // Never query strings, fragments, content, or designs.
  void fetch(endpoint, {
    method: "POST",
    credentials: "omit",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, domain, url, referrer: "" }),
    keepalive: true,
  }).catch(() => {});
}
