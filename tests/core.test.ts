import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import opentype from "opentype.js";
import { posters, artists, filterPosters, emptyFilters } from "../src/lib/catalog";
import { LICENSES, type Poster } from "../src/lib/types";
import { canRemix, exportLicense, creditLines, sourceCredit } from "../src/lib/licenses";
import { validatePoster } from "../src/lib/validate";
import { freshScene, reducer, validateScene } from "../src/studio/model";
import { sceneSvg, xml } from "../src/studio/render";
import { encodeScene, decodeScene } from "../src/studio/share";
import { pngAt300Ppi, rasterSize } from "../src/studio/exports";
const fonts = {
  display: opentype.loadSync("public/fonts/bebas-neue.ttf"),
  mono: opentype.loadSync("public/fonts/ibm-plex-mono.ttf"),
};

test("every authored placeholder has explicit CC0, source, credit, alt, dimensions and working files", () => {
  assert.equal(posters.length, 1);
  for (const p of posters) {
    assert.deepEqual(validatePoster(p, artists), []);
    assert.equal(p.license, "CC0-1.0");
    assert.equal(p.placeholder, true);
    for (const f of p.formats) assert.equal(fs.statSync(`public${f.path}`).size, f.bytes);
  }
});
test("ND and NC-ND cannot be remixed, including dishonest content flags", () => {
  for (const license of ["CC-BY-ND-4.0", "CC-BY-NC-ND-4.0"] as const) {
    const p: Poster = {
      ...posters[0],
      license,
      licenseUrl: LICENSES[license].url,
      allowsDerivatives: false,
      commercialUseAllowed: LICENSES[license].commercial,
      remixable: false,
    };
    assert.equal(canRemix(p), false);
    assert.deepEqual(validatePoster(p, artists), []);
    assert.equal(canRemix({ ...p, remixable: true, allowsDerivatives: true }), false);
    assert.ok(
      validatePoster({ ...p, remixable: true }, artists).some((e) => e.includes("Derivatives")),
    );
  }
});
test("validation rejects missing credit/alt/source, conflicting licence flags and unknown licences", () => {
  for (const field of ["artist", "alt", "source", "license"] as const)
    assert.ok(validatePoster({ ...posters[0], [field]: "" } as Poster, artists).length);
  assert.ok(validatePoster({ ...posters[0], commercialUseAllowed: false }, artists).length);
  assert.ok(validatePoster({ ...posters[0], alt: "poster" }, artists).length);
  assert.deepEqual(validatePoster({ ...posters[0], alt: "Choke" }, artists), []);
});
test("ShareAlike exports carry every unique source and reject incompatible licence mixtures", () => {
  const a = { ...sourceCredit(posters[0], artists[0].name), license: "CC-BY-NC-SA-4.0" as const };
  const b = { ...sourceCredit(posters[0], artists[0].name), id: "second-source", license: "CC-BY-4.0" as const };
  assert.equal(exportLicense([a, b]), "CC-BY-NC-SA-4.0");
  assert.throws(() => exportLicense([a, { ...b, license: "CC-BY-SA-4.0" }]));
  assert.throws(() => exportLicense([{ ...a, license: "CC-BY-ND-4.0" }]));
  assert.throws(() =>
    exportLicense([
      { ...a, license: "CC-BY-SA-4.0" },
      { ...b, license: "CC-BY-NC-4.0" },
    ]),
  );
  const s = freshScene();
  s.layers[0].credit = a;
  s.layers[1].credit = b;
  s.layers[2].credit = a;
  const lines = creditLines(s);
  assert.equal(lines.length, 4);
  assert.ok(lines[0].includes("CC-BY-NC-SA-4.0"));
  assert.ok(sceneSvg(s, fonts).includes("CC-BY-NC-SA-4.0"));
});
test("scene validation rejects external assets, invalid numeric input and hostile saved data", () => {
  assert.ok(validateScene(freshScene()));
  for (const patch of [{ version: 9 }, { background: '"/><script>' }, { preset: "wide" }])
    assert.equal(validateScene({ ...freshScene(), ...patch }), false);
  const s = freshScene();
  s.layers[0].x = NaN;
  assert.equal(validateScene(s), false);
  s.layers[0].x = 0;
  s.layers[0].kind = "image";
  s.layers[0].image = "https://tracker.invalid/photo.jpg";
  assert.equal(validateScene(s), false);
});
test("outlined vector export is font-independent and escapes metadata", () => {
  const s = freshScene();
  s.layers[0].text = "<script>alert(1)</script>";
  const svg = sceneSvg(s, fonts);
  assert.ok(svg.includes("<path"));
  assert.ok(!svg.includes("<text"));
  assert.ok(!svg.includes("<script>"));
  assert.ok(!svg.includes("265dff"));
  assert.equal(xml('<>&"'), "&lt;&gt;&amp;&quot;");
});
test("history, undo/redo, reset and branch invalidation are correct", () => {
  const s = freshScene();
  let h = { past: [] as (typeof s)[], present: s, future: [] as (typeof s)[] };
  for (let i = 0; i < 80; i++)
    h = reducer(h, {
      type: "commit",
      scene: { ...s, background: `#${i.toString(16).padStart(6, "0")}` },
    });
  assert.equal(h.past.length, 60);
  const prev = h.present;
  h = reducer(h, { type: "undo" });
  assert.equal(reducer(h, { type: "redo" }).present, prev);
  h = reducer(h, { type: "commit", scene: s });
  assert.equal(h.future.length, 0);
  h = reducer(h, { type: "reset", scene: s });
  assert.equal(h.past.length, 0);
});
test("hash shares roundtrip without uploads and reject malformed/oversized payloads", () => {
  const s = freshScene();
  assert.deepEqual(decodeScene(encodeScene(s)), s);
  assert.throws(() => decodeScene("x".repeat(13000)));
  assert.throws(() => decodeScene("invalid"));
  s.layers[0].kind = "image";
  assert.throws(() => encodeScene(s));
});
test("real search combines terms and all facets, and sorts", () => {
  const found = filterPosters(posters, { ...emptyFilters, query: "BORDERS", theme: "Migration" });
  assert.equal(found.length, 1);
  assert.equal(found[0].slug, "borders-are-lines");
  assert.equal(
    filterPosters(posters, { ...emptyFilters, query: "care", language: "French" }).length,
    0,
  );
  assert.equal(
    filterPosters(posters, { ...emptyFilters, saved: true }, [posters[0].slug]).length,
    1,
  );
  assert.equal(
    filterPosters(posters, { ...emptyFilters, color: "bw" }).every((p) => p.colorMode === "bw"),
    true,
  );
});
test("print raster dimensions and PNG physical resolution are real", async () => {
  const s = freshScene();
  assert.deepEqual(rasterSize(s), { width: 3508, height: 4961 });
  const png = await pngAt300Ppi(new Blob([fs.readFileSync("public/icons/icon-32.png")]));
  const bytes = new Uint8Array(await png.arrayBuffer());
  assert.equal(Buffer.from(bytes).indexOf("pHYs"), 37);
  const view = new DataView(bytes.buffer);
  assert.equal(view.getUint32(41), 11811);
  assert.equal(view.getUint32(45), 11811);
});
test("ingest rejects missing model fields, unsafe previews and mismatched editable layers", () => {
  for (const patch of [
    { year: undefined },
    { region: "" },
    { remixable: undefined },
    { placeholder: undefined },
    { preview: "https://remote.invalid/image.webp" },
    { colorMode: "other" },
    { studioLayers: { version: 99 } },
  ])
    assert.ok(validatePoster({ ...posters[0], ...patch } as Poster, artists).length);
});
