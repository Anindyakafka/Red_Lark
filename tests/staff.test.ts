import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import handler from "../src/server/api.ts";
import { csrfCookie, ApiError } from "../src/server/security.ts";
import { admin } from "../src/server/admin.ts";
import { publicClient, type Identity } from "../src/server/auth.ts";
process.env.SITE_URL = "https://staff.example.invalid";
process.env.RATE_LIMIT_SECRET = randomBytes(32).toString("base64");
process.env.SESSION_ENCRYPTION_KEY = randomBytes(32).toString("base64");
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
test("optional contributor signup and email recovery remain available without assigning admin roles", async () => {
  const original = globalThis.fetch;
  const calls: string[] = [];
  globalThis.fetch = async (input) => {
    const path = new URL(String(input instanceof Request ? input.url : input)).pathname;
    calls.push(path);
    if (path.endsWith("/rpc/consume_rate_limit")) return Response.json(true);
    assert.match(path, /\/auth\/v1\/(signup|otp|recover)$/);
    return Response.json({});
  };
  try {
    for (const path of ["signup", "signup-link", "magic", "forgot"]) {
      const response = await handler(
        request(path, { email: "fixture@example.invalid", password: "Fixture-password-123!" }),
      );
      assert.equal(response.status, 200, path);
      assert.deepEqual(await response.json(), { ok: true, inbox: true });
    }
    assert(calls.some((p) => p.endsWith("/signup")));
    assert(
      !calls.some(
        (p) => p.endsWith("/roles") || p.includes("invite_staff") || p.includes("grant_admin"),
      ),
    );
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
