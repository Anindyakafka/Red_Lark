import test from "node:test";
import assert from "node:assert/strict";
import {
  invitationOrigin,
  invitationPage,
  checkInvitationDeployment,
} from "../src/server/staff-invitation.ts";
import handler from "../src/server/api.ts";
test("invitation links default to the public site, never local development", () => {
  assert.equal(invitationOrigin(""), "https://redlarkworkshop.com");
  assert.equal(invitationOrigin("   "), "https://redlarkworkshop.com");
  for (const origin of [
    "http://localhost:3000",
    "https://localhost",
    "https://example.netlify.app",
    "https://example.invalid/path",
    "https://user:pass@example.invalid",
  ])
    assert.throws(() => invitationOrigin(origin));
  const url = new URL(invitationPage("a".repeat(56), invitationOrigin("")));
  assert.equal(url.pathname, "/en/verify/");
  assert.equal(url.search, "");
  assert.equal(new URLSearchParams(url.hash.slice(1)).get("invite"), "a".repeat(56));
});
test("old email GET links redirect without consuming the token or contacting Auth", async () => {
  const original = globalThis.fetch;
  process.env.SITE_URL = "https://redlarkworkshop.com";
  globalThis.fetch = async () => {
    throw Error("Must not contact Auth on GET");
  };
  try {
    for (const token of ["a".repeat(56), ""]) {
      const response = await handler(
        new Request(`https://redlarkworkshop.com/api/auth/invite?token_hash=${token}`),
      );
      assert.equal(response.status, 303);
      assert.equal(response.headers.get("set-cookie"), null);
      assert.equal(response.headers.get("X-Redlark-Invite-Flow"), "confirm-v1");
      assert.match(response.headers.get("location")!, /\/en\/verify\//);
    }
  } finally {
    globalThis.fetch = original;
  }
});
test("invitation command requires a deployed confirmation endpoint before any email is sent", async () => {
  await assert.rejects(
    checkInvitationDeployment(
      "https://example.invalid",
      async () => new Response("old endpoint", { status: 400 }),
    ),
  );
  await assert.doesNotReject(
    checkInvitationDeployment(
      "https://example.invalid",
      async () =>
        new Response(null, { status: 303, headers: { "X-Redlark-Invite-Flow": "confirm-v1" } }),
    ),
  );
});
