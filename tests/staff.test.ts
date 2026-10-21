import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import handler from "../src/server/api.ts";
import { csrfCookie, ApiError } from "../src/server/security.ts";
import { admin } from "../src/server/admin.ts";
import { publicClient, type Identity } from "../src/server/auth.ts";
process.env.SITE_URL = "https://staff.example.invalid";
process.env.RATE_LIMIT_SECRET = randomBytes(32).toString("base64");
process.env.SUPABASE_URL = "https://project.example.invalid";
process.env.SUPABASE_SECRET_KEY = "fixture";
process.env.SUPABASE_PUBLISHABLE_KEY = "fixture";
function request(path: string, values: Record<string, unknown>) {
  const csrf = csrfCookie();
  return new Request(`https://staff.example.invalid/api/auth/${path}`, {
    method: "POST",
    headers: {
      Origin: "https://staff.example.invalid",
      "Content-Type": "application/json",
      "X-CSRF-Token": csrf.token,
      Cookie: csrf.cookie.split(";")[0],
    },
    body: JSON.stringify(values),
  });
}
test("both public signup endpoints are closed server-side, without contacting Auth", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error("No external request should occur");
  };
  try {
    for (const path of ["signup", "signup-link"]) {
      const response = await handler(
        request(path, { email: "unknown@example.invalid", password: "fixture-password" }),
      );
      assert.equal(response.status, 403);
      assert.equal((await response.json()).error, "signup_disabled");
    }
  } finally {
    globalThis.fetch = original;
  }
});
test("non-staff email login and recovery return the same generic success without sending email", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const path = new URL(String(input instanceof Request ? input.url : input)).pathname;
    assert.match(path, /\/rpc\/(consume_rate_limit|staff_email_allowed)$/);
    return new Response(path.endsWith("staff_email_allowed") ? "false" : "true", {
      headers: { "Content-Type": "application/json" },
    });
  };
  try {
    for (const path of ["magic", "forgot"]) {
      const response = await handler(request(path, { email: "unknown@example.invalid" }));
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { ok: true, inbox: true });
    }
  } finally {
    globalThis.fetch = original;
  }
});
test("audit filters and decisions validate before database writes; MFA remains mandatory", async () => {
  const who = { admin: true, aal2: true, fresh: true, client: publicClient() } as Identity;
  const request = new Request("https://staff.example.invalid/api/admin/audit");
  for (const values of [
    { start: "invalid" },
    { start: "2026-10-22", end: "2026-10-21" },
    { offset: -1 },
  ])
    await assert.rejects(
      admin(request, "/api/admin/audit", values, who),
      (e: unknown) => e instanceof ApiError && e.code === "invalid_audit_filter",
    );
  await assert.rejects(
    admin(request, "/api/admin/review", { id: "fixture", action: "unknown" }, who),
    (e: unknown) => e instanceof ApiError && e.code === "invalid_action",
  );
  await assert.rejects(
    admin(
      request,
      "/api/admin/review",
      { id: "fixture", action: "rejected", reason: "short" },
      who,
    ),
    (e: unknown) => e instanceof ApiError && e.code === "invalid_reason",
  );
  await assert.rejects(
    admin(request, "/api/admin/audit", {}, { ...who, fresh: false }),
    (e: unknown) => e instanceof ApiError && e.code === "fresh_mfa_required",
  );
});
