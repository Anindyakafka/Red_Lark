import test from "node:test";
import assert from "node:assert/strict";
import {
  imageDescription,
  normalizeTags,
  selectedLicence,
} from "../src/lib/contribution-metadata.ts";
import { LICENSES } from "../src/lib/types.ts";

test("blank upload descriptions receive deterministic title, format and artist text", () => {
  assert.equal(
    imageDescription({
      alt: " ",
      title: "Solidarity",
      format_slug: "poster-placard",
      artist_name: "Workshop",
    }),
    'Poster/Placard titled "Solidarity" by Workshop',
  );
  assert.equal(imageDescription({ alt: "A red bird.", title: "Title" }), "A red bird.");
});
test("tags strip markup and controls, normalize spacing, deduplicate and retain display labels", () => {
  assert.deepEqual(
    normalizeTags([" protest ", "PROTEST", " <b>Local</b>   solidarity\u0000", "Local solidarity"]),
    ["Protest", "Local solidarity"],
  );
  assert.throws(() => normalizeTags(["x".repeat(31)]), /tag_too_long/);
  assert.throws(
    () => normalizeTags(Array.from({ length: 11 }, (_, i) => `tag ${i}`)),
    /too_many_tags/,
  );
  assert.deepEqual(normalizeTags(["শ্রমিক", "मज़दूर", "തൊഴിലാളി"]), [
    "শ্রমিক",
    "मज़दूर",
    "തൊഴിലാളി",
  ]);
});
test("four plain licence cards and NC produce all seven official licences and retain ND gate", () => {
  assert.equal(selectedLicence("open", false), "CC-BY-SA-4.0");
  assert.equal(selectedLicence("open", true), "CC-BY-NC-SA-4.0");
  assert.equal(selectedLicence("credit", false), "CC-BY-4.0");
  assert.equal(selectedLicence("credit", true), "CC-BY-NC-4.0");
  assert.equal(selectedLicence("free", true), "CC0-1.0");
  for (const nc of [true, false])
    assert.equal(LICENSES[selectedLicence("unchanged", nc)].derivatives, false);
});
