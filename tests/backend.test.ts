import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import sharp from "sharp";
import {
  ApiError,
  checkMutation,
  cookie,
  csrfCookie,
  decrypt,
  encrypt,
  rateHash,
} from "../src/server/security.ts";
import { sanitize, signedUpload, printPdf } from "../src/server/storage.ts";
import { sendEmail } from "../src/server/mail.ts";
import { checked } from "../src/server/auth.ts";

// Isolated fixtures only: no owner credentials, database or external mail is used.
process.env.SESSION_ENCRYPTION_KEY = randomBytes(32).toString("base64");
process.env.RATE_LIMIT_SECRET = randomBytes(32).toString("base64");
process.env.SITE_URL = "https://site.example.invalid";
test("successful minimal PostgREST writes and void RPCs are not mistaken for missing SELECT rows", () => {
  assert.doesNotThrow(() => checked({ data: null, error: null, status: 204 }));
  assert.doesNotThrow(() => checked({ data: null, error: null, status: 201 }));
  assert.throws(() => checked({ data: null, error: null, status: 200 }), ApiError);
  assert.throws(
    () => checked({ data: null, error: { code: "fixture-denial" }, status: 403 }),
    ApiError,
  );
});
test("encrypted server sessions authenticate ciphertext and use necessary secure cookies", () => {
  const value = encrypt({ refresh_token: "test-only", access_token: "fixture" });
  assert.deepEqual(decrypt(value), { refresh_token: "test-only", access_token: "fixture" });
  const damaged = Buffer.from(value, "base64url");
  damaged[30] ^= 1;
  assert.throws(() => decrypt(damaged.toString("base64url")));
  assert.match(
    cookie("__Host-redlark-session", "opaque", 100),
    /Path=\/; HttpOnly; Secure; SameSite=Lax/,
  );
});
test("mutations reject other origins, CSRF mismatches and non-JSON submissions", () => {
  const csrf = csrfCookie();
  const make = (
    origin = "https://site.example.invalid",
    token = csrf.token,
    type = "application/json",
  ) =>
    new Request("https://site.example.invalid/api/contact", {
      method: "POST",
      headers: { origin, "content-type": type, cookie: csrf.cookie, "x-csrf-token": token },
      body: "{}",
    });
  assert.doesNotThrow(() => checkMutation(make()));
  assert.throws(() => checkMutation(make("https://attacker.invalid")), ApiError);
  assert.throws(() => checkMutation(make(undefined, "forged")), ApiError);
  assert.throws(() => checkMutation(make(undefined, undefined, "text/plain")), ApiError);
});
test("rate-limit subjects are irreversibly salted, scoped and rotated by UTC day", () => {
  assert.equal(rateHash("fixture", "login", "2026-10-19").length, 64);
  assert.notEqual(
    rateHash("fixture", "login", "2026-10-19"),
    rateHash("fixture", "login", "2026-10-20"),
  );
  assert.notEqual(
    rateHash("fixture", "login", "2026-10-19"),
    rateHash("fixture", "mail", "2026-10-19"),
  );
});
test("upload processing checks bytes, rejects scripted SVG and strips EXIF/GPS", async () => {
  const jpeg = await sharp({
    create: { width: 40, height: 60, channels: 3, background: "#ef2219" },
  })
    .jpeg()
    .withMetadata({ orientation: 6 })
    .withExif({
      IFD0: { Artist: "PRIVATE FIXTURE" },
      IFD3: { GPSLatitudeRef: "N", GPSLongitudeRef: "E" },
    })
    .toBuffer();
  assert.ok((await sharp(jpeg).metadata()).exif);
  const clean = await sanitize(jpeg, "image/jpeg"),
    info = await sharp(clean.buffer).metadata();
  assert.equal(info.exif, undefined);
  assert.equal(info.xmp, undefined);
  assert.equal(info.icc, undefined);
  assert.equal(clean.width, 60);
  assert.equal(clean.height, 40);
  assert.equal((await sharp(clean.preview).metadata()).format, "webp");
  await assert.rejects(
    sanitize(Buffer.from("<svg><script>alert(1)</script></svg>"), "image/png"),
    ApiError,
  );
  await assert.rejects(sanitize(jpeg, "image/png"), ApiError);
});
test("signed upload binds one private object, content type, size and five-minute expiration", async () => {
  process.env.R2_ENDPOINT = "https://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.r2.cloudflarestorage.com";
  process.env.R2_ACCESS_KEY_ID = "fixture-only-not-a-credential";
  process.env.R2_SECRET_ACCESS_KEY = "fixture-only-not-a-credential";
  process.env.R2_PRIVATE_BUCKET = "private-fixture";
  const url = new URL(await signedUpload("quarantine/one-key", "image/png", 100));
  assert.equal(url.pathname, "/private-fixture/quarantine/one-key");
  assert.equal(url.searchParams.get("X-Amz-Expires"), "300");
  assert.match(url.searchParams.get("X-Amz-SignedHeaders") || "", /content-length/);
  assert.match(url.searchParams.get("X-Amz-SignedHeaders") || "", /content-type/);
  await assert.rejects(signedUpload("quarantine/one-key", "image/svg+xml", 100), ApiError);
  await assert.rejects(signedUpload("quarantine/one-key", "image/png", 26 * 1024 * 1024), ApiError);
});
test("sanitized raster print exports are actual A4/A2 PDF pages with source-credit metadata", async () => {
  const image = await sharp({
    create: { width: 40, height: 60, channels: 3, background: "#ef2219" },
  })
    .png()
    .toBuffer();
  for (const size of ["a4", "a2"] as const) {
    const data = printPdf(
      image,
      size,
      "Fixture artist | CC-BY-SA-4.0 | https://example.invalid/source",
    );
    const pdf = data.toString("latin1");
    assert.match(pdf, /^%PDF-/);
    assert.match(pdf, /CC-BY-SA-4.0/);
    assert.match(pdf, size === "a4" ? /\/MediaBox \[0 0 595\./ : /\/MediaBox \[0 0 1190\./);
  }
});
test("mail uses aligned From, explicit Reply-To and idempotency; provider failures are honest", async () => {
  process.env.MAIL_FROM = "Workshop <notifications@mail.redlarkworkshop.com>";
  process.env.MAIL_PROVIDER_KEY = "fixture-only";
  const mock: typeof fetch = async (_url, options) => {
    const data = JSON.parse(String(options?.body));
    assert.equal(data.reply_to, "sender@example.invalid");
    assert.equal(data.from, process.env.MAIL_FROM);
    assert.equal(new Headers(options?.headers).get("Idempotency-Key"), "fixture-receipt");
    return new Response(JSON.stringify({ id: "fixture-provider-id" }));
  };
  assert.equal(
    await sendEmail(
      "recipient@example.invalid",
      "Test",
      "Fixture",
      "sender@example.invalid",
      "fixture-receipt",
      mock,
    ),
    "fixture-provider-id",
  );
  await assert.rejects(
    sendEmail(
      "recipient@example.invalid",
      "Test",
      "Fixture",
      "",
      "failure",
      async () => new Response("{}", { status: 503 }),
    ),
    (error: unknown) => error instanceof ApiError && error.code === "mail_delivery_pending",
  );
  process.env.MAIL_FROM = "wrong@other.example.invalid";
  await assert.rejects(
    sendEmail("recipient@example.invalid", "Test", "Fixture", "", "bad-domain", mock),
    ApiError,
  );
});
