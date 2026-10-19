type EventName = "pageview" | "poster-download" | "studio-export" | "upload-submitted";
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
  const url = `${location.origin}${location.pathname}`; // Never query strings, fragments, content, or designs.
  void fetch(endpoint, {
    method: "POST",
    credentials: "omit",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, domain, url, referrer: "" }),
    keepalive: true,
  }).catch(() => {});
}
