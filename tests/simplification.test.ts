import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import formats from "../content/formats.json";
import { filterPosters, emptyFilters } from "../src/lib/query";
import { posters } from "../src/lib/catalog";

test("Workshop and Contribute legacy URLs have permanent Netlify redirects", () => {
  const config = fs.readFileSync("netlify.toml", "utf8");
  for (const [from, to] of [
    ["/:locale/studio/*", "/:locale/workshop/:splat"],
    ["/:locale/submit/*", "/:locale/contribute/:splat"],
  ]) {
    assert.ok(config.includes(`from = "${from}"`));
    assert.ok(config.includes(`to = "${to}"`));
  }
  assert.equal((config.match(/status = 301/g) || []).length >= 2, true);
  assert.equal(config.includes("/:locale/takedown/*"), false);
});

test("Writing is a Type and existing kind filtering remains stable", () => {
  assert.ok(formats.some((type) => type.slug === "writing" && type.label === "Writing"));
  assert.deepEqual(filterPosters(posters, { ...emptyFilters, kind: "writing" }), []);
  assert.deepEqual(
    filterPosters(posters, { ...emptyFilters, kind: "poster-placard" }).map(
      (poster) => poster.slug,
    ),
    posters.filter((poster) => poster.kind === "poster-placard").map((poster) => poster.slug),
  );
});

test("archive defaults to approved usable records and keeps archive-only state explicit", () => {
  const archive = posters.map((poster) => ({
    ...poster,
    archiveStatus: poster.archiveStatus || "usable",
  }));
  assert.ok(
    archive.every(
      (poster) => poster.archiveStatus === "usable" || poster.archiveStatus === "archive-only",
    ),
  );
  assert.equal(
    archive.filter((poster) => poster.archiveStatus === "usable").length,
    posters.length,
  );
});
