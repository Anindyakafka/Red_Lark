import upload from "./upload-origin.json" with { type: "json" };
const allowedUpload = /^https:\/\/[a-f0-9]{32}\.r2\.cloudflarestorage\.com$/.test(upload.origin)
  ? ` ${upload.origin}`
  : "";
export const SECURITY_HEADERS = {
  "Content-Security-Policy": `default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://files.redlarkworkshop.com; font-src 'self' data:; connect-src 'self' https://files.redlarkworkshop.com${allowedUpload}; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; worker-src 'self' blob:`,
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
} as const;
