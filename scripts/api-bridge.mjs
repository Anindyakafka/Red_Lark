// Local-only bridge to the exact Netlify handler. Never logs bodies, headers or URLs.
import { Readable } from "node:stream";
export async function bridge(req, res) {
  try {
    const { default: handler } = await import("../src/server/api.ts");
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers))
      if (value) headers.set(key, Array.isArray(value) ? value.join(", ") : value);
    // Locally, do not trust a caller-supplied production connection-IP header.
    headers.delete("x-nf-client-connection-ip");
    const request = new Request(`http://${req.headers.host}${req.url}`, {
      method: req.method,
      headers,
      ...(!["GET", "HEAD"].includes(req.method)
        ? { body: Readable.toWeb(req), duplex: "half" }
        : {}),
    });
    const response = await handler(request);
    const out = Object.fromEntries(response.headers);
    const cookies = response.headers.getSetCookie();
    if (cookies.length) out["set-cookie"] = cookies;
    res.writeHead(response.status, out);
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch {
    res.writeHead(503, { "Content-Type": "application/json", "Cache-Control": "no-store" });
    res.end(JSON.stringify({ error: "service_unavailable" }));
  }
}
