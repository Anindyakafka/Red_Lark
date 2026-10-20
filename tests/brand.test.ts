import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { CONTACT_EMAIL } from "../src/config/site";
import { migrateLocalDrafts, LEGACY_STORAGE_PREFIX } from "../src/lib/storage";

test("legacy bookmarks migrate once without dropping data on a failed write", () => {
  const previous = LEGACY_STORAGE_PREFIX;
  const values = new Map([[`${previous}.saved.v1`, '["a-future-we-share"]']]);
  let fail = true;
  const storage = {
    getItem: (k: string) => values.get(k) ?? null,
    setItem: (k: string, v: string) => {
      if (fail) throw Error("quota");
      values.set(k, v);
    },
    removeItem: (k: string) => {
      values.delete(k);
    },
  } as Storage;
  migrateLocalDrafts(storage);
  assert.ok(values.has(`${previous}.saved.v1`));
  fail = false;
  migrateLocalDrafts(storage);
  assert.equal(values.get("redlark.saved.v1"), '["a-future-we-share"]');
  assert.ok(!values.has(`${previous}.saved.v1`));
  migrateLocalDrafts(storage);
  assert.equal(values.size, 1);
});

test("owner-supplied contact and UTF-8 poster descriptions are present", () => {
  assert.equal(CONTACT_EMAIL, "redlarkworkshop@gmail.com");
  for (const name of fs.readdirSync("content/posters")) {
    const p = JSON.parse(fs.readFileSync(`content/posters/${name}`, "utf8"));
    assert.ok(p.alt.includes("“") && p.alt.includes("”"));
    assert.ok(!p.alt.includes(String.fromCharCode(226)));
  }
});
