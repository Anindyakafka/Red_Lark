import test from "node:test";
import assert from "node:assert/strict";
import { adminMfaFresh } from "../src/server/admin-mfa.ts";
test("admin verification lasts one day for validated AAL2 TOTP sessions, never plain password sessions", () => {
  const now = Date.now(),
    claims = (age: number) => ({
      aal: "aal2",
      amr: [{ method: "totp", timestamp: now / 1000 - age }],
    });
  for (const seconds of [0, 600, 3600, 43200, 86399])
    assert.equal(adminMfaFresh(claims(seconds), now), true);
  assert.equal(adminMfaFresh(claims(86401), now), false);
  assert.equal(adminMfaFresh(claims(-60), now), false);
  assert.equal(adminMfaFresh({ ...claims(0), aal: "aal1" }, now), false);
  assert.equal(
    adminMfaFresh({ aal: "aal2", amr: [{ method: "password", timestamp: now / 1000 }] }, now),
    false,
  );
});
