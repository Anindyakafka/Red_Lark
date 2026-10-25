import test from "node:test";
import assert from "node:assert/strict";
import { guest } from "../src/server/guest.ts";
import { sha256, ApiError } from "../src/server/security.ts";

process.env.SUPABASE_URL = "https://project.example.invalid";
process.env.SUPABASE_SECRET_KEY = "fixture-only";
process.env.RATE_LIMIT_SECRET = "fixture-only-rate-limit-key";
process.env.SITE_URL = "https://site.example.invalid";
const token = "a".repeat(43);
const req = new Request("https://site.example.invalid/api/guest/status");
const response = (value: unknown, status = 200) =>
  new Response(value == null ? null : JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json" },
  });

test("guest receipts are hashed and bound to one work; status never exposes private contact or storage", async () => {
  const old = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = new URL(String(input instanceof Request ? input.url : input));
    if (url.pathname.endsWith("consume_rate_limit")) return response(true);
    if (url.pathname.endsWith("guest_submissions")) {
      assert.equal(url.searchParams.get("token_hash"), `eq.${sha256(token)}`);
      assert.match(url.searchParams.get("expires_at") || "", /^gt\./);
      assert.ok(!url.href.includes(token));
      return response([
        {
          work_id: "receipt-work",
          contact: "private@example.invalid",
          upi: "private@fixture",
          contact_public: false,
          upi_public: false,
          expires_at: "2099-01-01",
        },
      ]);
    }
    assert.equal(url.searchParams.get("id"), "eq.receipt-work");
    assert.equal(url.searchParams.get("owner_id"), "is.null");
    return response({
      id: "receipt-work",
      title: "Fixture",
      status: "pending",
      feedback: "Waiting",
      slug: "private-slug",
    });
  };
  try {
    const r = await guest(req, "/api/guest/status", { token, work_id: "someone-elses-work" });
    assert.equal(r.status, 200);
    assert.deepEqual(await r.json(), {
      title: "Fixture",
      status: "pending",
      feedback: "Waiting",
      slug: null,
      expiresAt: "2099-01-01",
    });
  } finally {
    globalThis.fetch = old;
  }
});

test("missing/expired guest receipts and non-allowlisted endpoints cannot read or mutate another work", async () => {
  const old = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = String(input instanceof Request ? input.url : input);
    if (url.includes("consume_rate_limit")) return response(true);
    assert.match(url, /guest_submissions/);
    return response([]);
  };
  try {
    await assert.rejects(
      guest(req, "/api/guest/status", { token }),
      (e: unknown) => e instanceof ApiError && e.code === "submission_unavailable",
    );
    await assert.rejects(
      guest(req, "/api/guest/delete", { token }),
      (e: unknown) => e instanceof ApiError && e.status === 404,
    );
  } finally {
    globalThis.fetch = old;
  }
});

test("guest start rejects honeypots, immediate submissions and client-selected draft IDs before any write", async () => {
  const old = globalThis.fetch;
  globalThis.fetch = async (input) => {
    assert.match(String(input instanceof Request ? input.url : input), /consume_rate_limit$/);
    return response(true);
  };
  try {
    for (const data of [
      { started: Date.now() - 5000, website: "bot" },
      { started: Date.now() },
      { started: Date.now() - 5000, id: "other-work" },
    ])
      await assert.rejects(guest(req, "/api/guest/start", data), ApiError);
  } finally {
    globalThis.fetch = old;
  }
});
