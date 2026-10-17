// Native resolution deliberately bypasses Next/tsx so extensionless Edge imports fail.
// Also executed under Deno in CI to verify Netlify's runtime module graph.
import language from "../netlify/edge-functions/language.ts";
import { SECURITY_HEADERS } from "../src/config/security.ts";

function assert(condition, message) {
  if (!condition) throw new Error(`Edge preflight: ${message}`);
}
function secure(response) {
  for (const [name, value] of Object.entries(SECURITY_HEADERS))
    assert(response.headers.get(name) === value, `missing ${name}`);
}
const passthrough = { next: async () => new Response("static asset") };
const redirect = await language(
  new Request("https://example.invalid/collection/?q=work", {
    headers: { "accept-language": "bn-IN, en;q=0.5" },
  }),
  passthrough,
);
assert(redirect.status === 302, "language redirect status");
assert(
  redirect.headers.get("location") === "https://example.invalid/bn/collection/?q=work",
  "language redirect preserves path/query",
);
assert(redirect.headers.get("vary") === "Accept-Language", "language cache variation");
assert(redirect.headers.get("cache-control") === "no-store", "redirect cache isolation");
assert(!redirect.headers.has("set-cookie"), "no language cookie");
secure(redirect);

const legacy = await language(
  new Request("https://example.invalid/hi/themes/?q=work"),
  passthrough,
);
assert(legacy.status === 308, "legacy redirect status");
assert(
  legacy.headers.get("location") === "https://example.invalid/hi/categories/?q=work",
  "legacy redirect preserves locale/query",
);
secure(legacy);

for (const route of ["/icons/mark.svg", "/_next/static/test.js", "/en/collection/"]) {
  const response = await language(new Request(`https://example.invalid${route}`), passthrough);
  assert((await response.text()) === "static asset", `static passthrough ${route}`);
  secure(response);
}

const originalFetch = globalThis.fetch;
try {
  globalThis.fetch = async (input) => {
    assert(String(input) === "https://example.invalid/ml/404/", "localized fallback URL");
    return new Response("localized missing page", {
      headers: { "content-type": "text/html", "content-encoding": "gzip", "content-length": "99" },
    });
  };
  const response = await language(new Request("https://example.invalid/ml/missing/"), {
    next: async () => new Response("not found", { status: 404 }),
  });
  assert(response.status === 404, "localized missing page status");
  assert((await response.text()) === "localized missing page", "localized missing page body");
  assert(!response.headers.has("content-encoding"), "decoded body has no stale encoding");
  assert(!response.headers.has("content-length"), "decoded body has no stale length");
  secure(response);
} finally {
  globalThis.fetch = originalFetch;
}
console.log(
  "Edge preflight passed: native imports, redirects, static routes, localized 404 and security headers.",
);
