import test from "node:test";
import assert from "node:assert/strict";
import { filterArtworks } from "../src/features/catalog/query";
import { artworks } from "../src/content/catalog";
test("catalogue search combines kind, collection, and case-insensitive tags", () => {
  assert.equal(filterArtworks(artworks, "poster", " BIRD ", "All")[0].slug, "the-open-sky");
  assert.equal(filterArtworks(artworks, "poster", "bird", "Type experiments").length, 0);
  assert.equal(filterArtworks(artworks, "sticker", "bird", "All")[0].slug, "little-bird");
  assert.equal(filterArtworks(artworks, "poster", "no match", "All").length, 0);
});
