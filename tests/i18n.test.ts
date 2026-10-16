import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { chooseLocale, localePath } from "../src/i18n/config";
import handler from "../netlify/edge-functions/language";
test("language negotiation respects quality, regional variants, exclusions and English fallback", () => {
  assert.equal(chooseLocale("fr;q=1,hi-IN;q=.8,en;q=.5"), "hi");
  assert.equal(chooseLocale("ml;q=0,bn;q=.4"), "bn");
  assert.equal(chooseLocale("de,fr"), "en");
  assert.equal(localePath("ml", "/studio/?remix=a"), "/ml/studio/?remix=a");
  assert.equal(localePath("hi", "/bn/collection/"), "/bn/collection/");
});
test("edge language redirect uses no cookie and does not vary cache by an identifier", async () => {
  const response = await handler(
    new Request("https://example.org/collection/?q=work", {
      headers: { "accept-language": "bn-IN" },
    }),
    { next: async () => new Response("not used") },
  );
  assert.equal(response.status, 302);
  assert.equal(response.headers.get("location"), "https://example.org/bn/collection/?q=work");
  assert.equal(response.headers.get("set-cookie"), null);
  assert.equal(response.headers.get("cache-control"), "no-store");
});
test("draft messages/copy retain parity, explicit review flags and all objective blocks", () => {
  const english = JSON.parse(fs.readFileSync("messages/en.json", "utf8"));
  for (const locale of ["hi", "bn", "ml"]) {
    const messages = JSON.parse(fs.readFileSync(`messages/${locale}.json`, "utf8"));
    assert.equal(messages.reviewed, false);
    assert.deepEqual(Object.keys(messages.strings).sort(), Object.keys(english.strings).sort());
    const copy = JSON.parse(fs.readFileSync(`content/copy/landing.${locale}.json`, "utf8"));
    assert.equal(copy.reviewed, false);
    assert.equal(copy.objectives.length, 6);
  }
});
