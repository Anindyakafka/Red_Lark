import test from "node:test";
import assert from "node:assert/strict";
import { privateShellPath } from "../src/lib/private-routes.ts";
test("private ID pages reuse a localized shell without changing other routes or trusting the ID", () => {
  const id = "12345678-1234-1234-1234-123456789012";
  for (const locale of ["en", "hi", "bn", "ml"]) {
    assert.equal(
      privateShellPath(`/${locale}/account/works/${id}/`),
      `/${locale}/account/works/edit/`,
    );
    assert.equal(
      privateShellPath(`/${locale}/admin/review/${id}`),
      `/${locale}/admin/review/item/`,
    );
    assert.equal(
      privateShellPath(`/${locale}/account/works/new/`),
      `/${locale}/account/works/new/`,
    );
  }
  assert.equal(privateShellPath("/en/account/works/../../api/"), "/en/account/works/../../api/");
});
