import test from "node:test";
import assert from "node:assert/strict";
import { artistMetadataTitle } from "../src/lib/artist-metadata";
import { pageMeta } from "../src/lib/metadata";
import { localizeMetadata } from "../src/i18n/metadata";
import type { Artist } from "../src/lib/types";

test("same-name anonymous artists have distinct metadata in every locale without changing credit", () => {
  const artists: Artist[] = ["artist-first-public", "artist-second-public"].map((id) => ({
    id,
    name: "Anonymous contributor",
    bio: "Contributor to Red Lark Workshop.",
    placeholder: false,
    links: [],
  }));
  for (const locale of ["en", "hi", "bn", "ml"]) {
    const metadata = artists.map((artist) =>
      localizeMetadata(
        pageMeta(artistMetadataTitle(artist, artists), artist.bio, `/artist/${artist.id}`),
        locale,
      ),
    );
    assert.notEqual(metadata[0].title, metadata[1].title);
    assert.notEqual(metadata[0].openGraph?.title, metadata[1].openGraph?.title);
    assert.notEqual(metadata[0].twitter?.title, metadata[1].twitter?.title);
    assert.ok(String(metadata[0].alternates?.canonical).includes(artists[0].id));
  }
  assert.equal(artists[0].name, "Anonymous contributor");
  assert.equal(artistMetadataTitle(artists[0], [artists[0]]), "Anonymous contributor");
});
