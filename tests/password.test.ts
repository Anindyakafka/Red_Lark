import test from "node:test";
import assert from "node:assert/strict";
import { passwordError } from "../src/server/password.ts";
import { ApiError } from "../src/server/security.ts";
test("password errors preserve the MFA requirement and explain safe retry paths without provider details", () => {
  assert.doesNotThrow(() => passwordError(null));
  for (const [provider, expected, status] of [
    ["insufficient_aal", "password_mfa_required", 403],
    ["same_password", "password_unchanged", 422],
    ["weak_password", "password_too_weak", 422],
    ["reauthentication_needed", "password_reauthentication_required", 401],
    ["current_password_required", "password_reauthentication_required", 401],
    ["unknown", "password_update_failed", 400],
  ] as const)
    assert.throws(
      () => passwordError({ code: provider }),
      (e: unknown) => e instanceof ApiError && e.code === expected && e.status === status,
    );
  assert.throws(
    () => passwordError({ status: 429 }),
    (e: unknown) => e instanceof ApiError && e.code === "try_later",
  );
});
