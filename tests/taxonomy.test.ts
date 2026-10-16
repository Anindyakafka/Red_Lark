import test from "node:test";
import assert from "node:assert/strict";
import categories from "../content/categories.json";
import formats from "../content/formats.json";
import { posters, artists } from "../src/lib/catalog";
import { emptyFilters, filterPosters } from "../src/lib/query";
import { validatePoster } from "../src/lib/validate";
import handler from "../netlify/edge-functions/language";
test("canonical inventories, category membership, artwork format and native search combine", () => {
  assert.equal(categories.length, 28);
  assert.equal(new Set(categories.map((c) => c.slug)).size, 28);
  assert.deepEqual(
    formats.map((f) => f.label),
    [
      "Badge",
      "Caricature",
      "Cartoon",
      "Flyer",
      "Meme",
      "Portrait",
      "Poster/Placard",
      "Stencil",
      "Sticker",
      "Zine",
    ],
  );
  const selected = filterPosters(posters, {
    ...emptyFilters,
    category: "displacement-and-migration",
    query: "homes",
    kind: "poster-placard",
  });
  assert.deepEqual(
    selected.map((p) => p.slug),
    ["homes-for-all"],
  );
  assert.equal(
    filterPosters(posters, { ...emptyFilters, language: "Malayalam", query: "ഒരുമിച്ച്" }).length,
    1,
  );
  assert.ok(
    validatePoster({ ...posters[0], categories: ["invented-category"] }, artists).some((error) =>
      error.includes("Categories"),
    ),
  );
});
test("legacy taxonomy redirects retain locale and query without cookies", async () => {
  const response = await handler(new Request("https://example.org/bn/theme/labor/?q=care"), {
    next: async () => new Response("unused"),
  });
  assert.equal(response.status, 308);
  assert.equal(response.headers.get("location"), "https://example.org/bn/category/workers/?q=care");
  assert.equal(response.headers.get("set-cookie"), null);
});
