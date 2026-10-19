// Server runtime only. Never import from a client component or next.config env.
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string) {
    super(code);
    this.status = status;
    this.code = code;
  }
}
export function required(name: string, alias?: string) {
  const value = process.env[name] || (alias ? process.env[alias] : undefined);
  if (!value) throw new ApiError(503, "service_unavailable");
  return value;
}
export function origin() {
  const value =
    process.env.SITE_URL || (process.env.NETLIFY ? process.env.URL : "http://localhost:3000");
  if (!value) throw new ApiError(503, "service_unavailable");
  const url = new URL(value);
  if (url.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(url.hostname))
    throw new ApiError(503, "service_unavailable");
  return url.origin;
}
export const sha256 = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
export const opaque = () => randomBytes(32).toString("base64url");
function key() {
  const value = Buffer.from(required("SESSION_ENCRYPTION_KEY"), "base64");
  if (value.length !== 32) throw new ApiError(503, "service_unavailable");
  return value;
}
export function encrypt(value: unknown) {
  const iv = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(JSON.stringify(value)), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString("base64url");
}
export function decrypt<T>(value: string): T {
  const data = Buffer.from(value, "base64url");
  const decipher = createDecipheriv("aes-256-gcm", key(), data.subarray(0, 12));
  decipher.setAuthTag(data.subarray(12, 28));
  return JSON.parse(
    Buffer.concat([decipher.update(data.subarray(28)), decipher.final()]).toString("utf8"),
  ) as T;
}
export function cookies(req: Request) {
  return Object.fromEntries(
    (req.headers.get("cookie") || "")
      .split(";")
      .map((x) => {
        const i = x.indexOf("=");
        return [x.slice(0, i).trim(), x.slice(i + 1)];
      })
      .filter(([k]) => k),
  );
}
export function cookie(name: string, value: string, seconds: number) {
  return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${seconds}`;
}
const csrfName = "__Host-redlark-csrf";
const sign = (value: string) =>
  createHmac("sha256", required("RATE_LIMIT_SECRET")).update(value).digest("base64url");
export function csrfCookie(req?: Request) {
  const existing = req ? cookies(req)[csrfName] : undefined;
  if (existing) {
    const [nonce, time, sig] = existing.split(".");
    if (
      sig === sign(`${nonce}.${time}`) &&
      Date.now() - Number(time) < 3600000 &&
      Number(time) <= Date.now() + 30000
    )
      return {
        token: existing,
        cookie: cookie(
          csrfName,
          existing,
          Math.max(1, 3600 - Math.floor((Date.now() - Number(time)) / 1000)),
        ),
      };
  }
  const value = `${opaque()}.${Date.now()}`;
  const token = `${value}.${sign(value)}`;
  return { token, cookie: cookie(csrfName, token, 3600) };
}
export function checkMutation(req: Request) {
  if (
    req.headers.get("origin") !== origin() ||
    !req.headers.get("content-type")?.startsWith("application/json")
  )
    throw new ApiError(403, "request_rejected");
  const token = req.headers.get("x-csrf-token") || "";
  const stored = cookies(req)[csrfName] || "";
  if (token.length > 300 || token !== stored) throw new ApiError(403, "request_rejected");
  const [nonce, time, signature] = token.split(".");
  const expected = sign(`${nonce}.${time}`),
    actual = Buffer.from(signature || "");
  if (
    actual.length !== expected.length ||
    !timingSafeEqual(actual, Buffer.from(expected)) ||
    Date.now() - Number(time) > 3600000 ||
    Number(time) > Date.now() + 30000
  )
    throw new ApiError(403, "request_rejected");
}
export async function body(req: Request): Promise<Record<string, unknown>> {
  if (Number(req.headers.get("content-length") || 0) > 40000)
    throw new ApiError(413, "request_too_large");
  const reader = req.body?.getReader();
  let size = 0;
  const chunks: Uint8Array[] = [];
  if (reader)
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 40000) {
        await reader.cancel();
        throw new ApiError(413, "request_too_large");
      }
      chunks.push(value);
    }
  try {
    const data: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!data || typeof data !== "object" || Array.isArray(data)) throw 0;
    return data as Record<string, unknown>;
  } catch {
    throw new ApiError(400, "invalid_fields");
  }
}
export function text(data: Record<string, unknown>, name: string, max: number, min = 0) {
  const value = typeof data[name] === "string" ? data[name].trim() : "";
  if (value.length < min || value.length > max) throw new ApiError(422, `invalid_${name}`);
  return value;
}
export function email(data: Record<string, unknown>, name = "email", optional = false) {
  const value = text(data, name, 254, optional ? 0 : 3);
  if (value && !/^[^\s@<>\r\n]+@[^\s@<>\r\n]+\.[^\s@<>\r\n]+$/.test(value))
    throw new ApiError(422, `invalid_${name}`);
  return value;
}
export function locale(value: unknown) {
  return typeof value === "string" && ["en", "hi", "bn", "ml"].includes(value) ? value : "en";
}
export function rateHash(
  subject: string,
  scope: string,
  day = new Date().toISOString().slice(0, 10),
) {
  return createHmac("sha256", required("RATE_LIMIT_SECRET"))
    .update(`${day}:${scope}:${subject}`)
    .digest("hex");
}
export const json = (data: unknown, status = 200, headers?: HeadersInit) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "private, no-store",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      ...Object.fromEntries(new Headers(headers)),
    },
  });
