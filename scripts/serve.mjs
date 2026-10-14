import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";
const root = path.resolve("out");
const port = Number(process.env.PORT ?? 3000);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
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
  "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; worker-src 'self' blob:";
http
  .createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
      let file = path.resolve(root, "." + pathname);
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
          file = path.join(root, "404.html");
          status = 404;
        }
      }
      const bytes = await fs.readFile(file);
      const compress =
        /\.(html|js|css|json|txt|xml|webmanifest)$/.test(file) &&
        /gzip/.test(req.headers["accept-encoding"] ?? "");
      const payload = compress ? gzipSync(bytes) : bytes;
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
        ...(compress ? { "Content-Encoding": "gzip" } : {}),
      });
      res.end(req.method === "HEAD" ? undefined : payload);
    } catch {
      res.writeHead(500);
      res.end("Static file unavailable");
    }
  })
  .listen(port, "127.0.0.1", () => console.log(`Mirafra static preview: http://localhost:${port}`));
