import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import opentype from "opentype.js";
import { posters, artists } from "../src/lib/catalog";
import { sourceCredit, sceneCredits } from "../src/lib/licenses";
import { freshScene, validateScene } from "../src/studio/model";
import { cleanTemplate, creditSettings, attributionMetadata } from "../src/studio/attribution";
import { sceneSvg } from "../src/studio/render";
import { pngAt300Ppi } from "../src/studio/exports";
import { encodeScene, decodeScene } from "../src/studio/share";
const fonts = {
  display: opentype.loadSync("public/fonts/bebas-neue.ttf"),
  mono: opentype.loadSync("public/fonts/ibm-plex-mono.ttf"),
};
test("clean remixes keep source metadata after deleting every layer, never draw credits while editing", () => {
  const source = { ...sourceCredit(posters[0], artists[0].name), license: "CC-BY-SA-4.0" as const };
  const scene = cleanTemplate(structuredClone(posters[0].studioLayers!), source);
  assert.ok(!scene.layers.some((l) => l.id.endsWith("-edition")));
  // The chosen source supersedes any legacy per-layer CC0 records.
  scene.layers = scene.layers.map((l) => ({ ...l, credit: source }));
  scene.sources = [source];
  assert.equal(creditSettings(scene).enabled, true);
  assert.ok(!sceneSvg(scene, fonts, undefined, true).includes("data-export-credit"));
  assert.ok(sceneSvg(scene, fonts).includes("data-export-credit"));
  scene.layers = [];
  assert.deepEqual(sceneCredits(decodeScene(encodeScene(scene))), [source]);
  assert.equal(attributionMetadata(scene).adaptationLicense, "CC-BY-SA-4.0");
  scene.exportCredit = { ...creditSettings(scene), enabled: false };
  assert.ok(!sceneSvg(scene, fonts).includes("data-export-credit"));
  assert.ok(sceneSvg(scene, fonts).includes("The Wet Ink Workshop"));
  assert.ok(validateScene(scene));
  assert.equal(validateScene({ ...scene, sources: [{ ...source, license: "unknown" }] }), false);
});
test("blank and CC0 projects default to clean exports; edition removal is narrowly scoped", () => {
  assert.equal(creditSettings(freshScene()).enabled, false);
  const scene = cleanTemplate(structuredClone(posters[0].studioLayers!));
  assert.equal(creditSettings(scene).enabled, false);
  scene.layers[0].text = "ARTIST CREDIT / KEEP THIS ARTWORK TEXT";
  assert.equal(cleanTemplate(scene).layers[0].text, scene.layers[0].text);
});
test("PNG exports embed Unicode attribution without imported EXIF and keep 300-PPI density", async () => {
  const source = new Blob([fs.readFileSync("public/posters/a-future-we-share/A3.png")]);
  const metadata = JSON.stringify({ artist: "বাংলা മലയാളം", license: "CC-BY-SA-4.0" });
  const bytes = Buffer.from(await (await pngAt300Ppi(source, metadata)).arrayBuffer());
  assert.ok(bytes.includes(Buffer.from(metadata)));
  assert.ok(bytes.includes(Buffer.from("iTXt")));
  assert.ok(!bytes.includes(Buffer.from("eXIf")));
  assert.equal(bytes.readUInt32BE(bytes.indexOf("pHYs") + 4), 11811);
});
