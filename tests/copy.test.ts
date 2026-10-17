import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LandingBlocks } from "../src/components/landing-copy";
import english from "../content/copy/landing.en.json";
const source = JSON.parse(
  fs.readFileSync("tests/fixtures/landing-source.en.json", "utf8"),
) as typeof english;
const decode = (text: string) =>
  text
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
test("canonical Appendix A source is locked and English copy remains verbatim", () => {
  assert.equal(
    createHash("sha256").update(JSON.stringify(source)).digest("hex"),
    "235bb8f1c7b9ad3bb84faad9b2050164755991aa157851d8ef2d9f8d9f8e02af",
  );
  assert.deepEqual(english, source);
});
test("server-rendered landing blocks preserve every character, objective order and both links", () => {
  const html = renderToStaticMarkup(createElement(LandingBlocks, { copy: english, locale: "en" }));
  for (const key of ["aboutHeading", "about", "objectivesHeading", "aiHeading", "ai"] as const) {
    const match = html.match(new RegExp(`data-copy="${key}">([\\s\\S]*?)</`));
    assert.equal(decode(match?.[1] ?? ""), source[key]);
  }
  const objectives = [...html.matchAll(/data-copy="objective"[^>]*>([\s\S]*?)<\/li>/g)].map((m) =>
    decode(m[1]),
  );
  assert.deepEqual(objectives, source.objectives);
  const links = [...html.matchAll(/data-copy="policyLink"[^>]*>([\s\S]*?)<\/a>/g)].map((m) =>
    decode(m[1]),
  );
  assert.deepEqual(links, [source.policyLink, source.policyLink]);
  assert.equal(source.searchLabel, "SEARCH BOX");
  assert.equal(source.languageLabel, "CHOOSE LANGUAGE:");
  assert.deepEqual(source.languages, ["English", "Hindi", "Bengali", "Malayalam"]);
});
