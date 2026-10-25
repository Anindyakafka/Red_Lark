import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  imageDescription,
  normalizeTags,
  selectedLicence,
  orderReviewWorks,
} from "../src/lib/contribution-metadata.ts";
import { LICENSES } from "../src/lib/types.ts";

test("queue sorts by actual submission events and labels older records with creation time only", () => {
  const queue = orderReviewWorks([
    {
      id: "old-draft",
      created_at: "2026-01-01",
      work_notifications: [{ event: "pending", created_at: "2026-10-21" }],
    },
    { id: "newer-draft", created_at: "2026-10-20" },
  ]);
  assert.equal(queue[0].id, "old-draft");
  assert.equal(queue[0].submitted_at, "2026-10-21");
  assert.equal(queue[1].submitted_at, null);
});

test("shared upload metadata loads in the native Node local API bridge", () => {
  const result = spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      "import { normalizeTags } from './src/lib/contribution-metadata.ts'; if(normalizeTags(['protest'])[0] !== 'Protest') process.exit(1)",
    ],
    { env: { ...process.env, NODE_OPTIONS: "" }, stdio: "ignore" },
  );
  assert.equal(result.status, 0);
});

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
  assert.equal(
    imageDescription({ alt: "A bright red bird in flight.", title: "Title" }),
    "A bright red bird in flight.",
  );
  assert.equal(
    imageDescription({ alt: "Poster", title: "Solidarity", artist_name: "Workshop" }),
    'Poster titled "Solidarity" by Workshop',
  );
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
