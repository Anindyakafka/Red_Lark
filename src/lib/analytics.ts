type EventName = "pageview" | "poster-download" | "studio-export";
export function track(name: EventName) {
  const endpoint = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT;
  const domain = process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN;
  if (
    typeof window === "undefined" ||
    !endpoint ||
    !domain ||
    !/^\/(?!\/)/.test(endpoint) ||
    navigator.doNotTrack === "1"
  )
    return;
  const url = `${location.origin}${location.pathname}`; // Never query strings, fragments, content, or designs.
  void fetch(endpoint, {
    method: "POST",
    credentials: "omit",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, domain, url, referrer: "" }),
    keepalive: true,
  }).catch(() => {});
}
