import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { gzipSync, brotliCompressSync, constants } from "node:zlib";
const root = path.resolve("out");
const port = Number(process.env.PORT ?? 3000);
const legacyRoutes = JSON.parse(await fs.readFile("content/legacy-routes.json", "utf8"));
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".wasm": "application/wasm",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
  ".webmanifest": "application/manifest+json",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".pdf": "application/pdf",
  ".zip": "application/zip",
};
const csp =
  "default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; worker-src 'self' blob:";
http
  .createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
      if (
        !/^\/(en|hi|bn|ml)(\/|$)/.test(pathname) &&
        !pathname.startsWith("/_") &&
        !/\.[a-z0-9]+$/i.test(pathname)
      ) {
        const options = String(req.headers["accept-language"] ?? "")
          .split(",")
          .map((part, index) => {
            const [language, quality] = part.trim().split(";");
            return {
              language: language.toLowerCase().split("-")[0],
              quality: quality ? Number(quality.replace(/^q=/, "")) : 1,
              index,
            };
          })
          .filter((entry) => Number.isFinite(entry.quality) && entry.quality > 0)
          .sort((a, b) => b.quality - a.quality || a.index - b.index);
        const locale =
          options.find((entry) => ["en", "hi", "bn", "ml"].includes(entry.language))?.language ??
          "en";
        res.writeHead(302, {
          Location: `/${locale}${req.url}`,
          Vary: "Accept-Language",
          "Cache-Control": "no-store",
        });
        res.end();
        return;
      }
      let file = path.resolve(root, "." + pathname);
      const legacy = pathname.replace(/^\/(en|hi|bn|ml)/, "").replace(/\/$/, "");
      if (legacyRoutes[legacy]) {
        const locale = pathname.split("/")[1];
        res.writeHead(308, {
          Location: `/${locale}${legacyRoutes[legacy]}${new URL(req.url, "http://localhost").search}`,
          "Referrer-Policy": "no-referrer",
          "Content-Security-Policy": csp,
        });
        res.end();
        return;
      }
      if (file !== root && !file.startsWith(root + path.sep)) {
        res.writeHead(403);
        res.end();
        return;
      }
      let status = 200;
      if (pathname === "/__qa/license-gate/" && process.env.QA_FIXTURES === "1")
        file = path.resolve(".qa/license-gate.html");
      else {
        try {
          if ((await fs.stat(file)).isDirectory()) file = path.join(file, "index.html");
          await fs.access(file);
        } catch {
          const locale = pathname.split("/")[1];
          file = path.join(
            root,
            ["en", "hi", "bn", "ml"].includes(locale) ? `${locale}/404/index.html` : "404.html",
          );
          status = 404;
        }
      }
      const bytes = await fs.readFile(file);
      const compress =
        /\.(html|js|css|json|txt|xml|webmanifest)$/.test(file) &&
        /br|gzip/.test(req.headers["accept-encoding"] ?? "");
      const brotli = compress && /\bbr\b/.test(req.headers["accept-encoding"] ?? "");
      const payload = compress
        ? brotli
          ? brotliCompressSync(bytes, { params: { [constants.BROTLI_PARAM_QUALITY]: 6 } })
          : gzipSync(bytes)
        : bytes;
      res.writeHead(status, {
        "Content-Type": types[path.extname(file)] ?? "application/octet-stream",
        "Content-Security-Policy": csp,
        "Referrer-Policy": "no-referrer",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
        "Cache-Control": file.includes(`${path.sep}_next${path.sep}static${path.sep}`)
          ? "public, max-age=31536000, immutable"
          : "no-cache",
        Vary: "Accept-Encoding",
        ...(compress ? { "Content-Encoding": brotli ? "br" : "gzip" } : {}),
      });
      res.end(req.method === "HEAD" ? undefined : payload);
    } catch {
      res.writeHead(500);
      res.end("Static file unavailable");
    }
  })
  .listen(port, "127.0.0.1", () =>
    console.log(`Red Lark Workshop static preview: http://localhost:${port}`),
  );
