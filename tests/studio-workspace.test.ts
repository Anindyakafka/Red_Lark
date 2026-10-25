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
import { newLayer } from "../src/studio/model";
import {
  FULL_CROP,
  resizeCrop,
  applyCrop,
  worldPoint,
  localPoint,
  cropImageFrame,
  zoomAt,
  gestureView,
} from "../src/studio/geometry";
import sharp from "sharp";
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
  const source = new Blob([fs.readFileSync("public/posters/borders-are-lines/A3.png")]);
  const metadata = JSON.stringify({ artist: "বাংলা മലയാളം", license: "CC-BY-SA-4.0" });
  const bytes = Buffer.from(await (await pngAt300Ppi(source, metadata)).arrayBuffer());
  assert.ok(bytes.includes(Buffer.from(metadata)));
  assert.ok(bytes.includes(Buffer.from("iTXt")));
  assert.ok(!bytes.includes(Buffer.from("eXIf")));
  assert.equal(bytes.readUInt32BE(bytes.indexOf("pHYs") + 4), 11811);
});

test("all eight crop handles change the requested sides, move within bounds and enforce minimums", () => {
  const rect = { x: 0.2, y: 0.2, width: 0.6, height: 0.6 };
  for (const handle of ["n", "ne", "e", "se", "s", "sw", "w", "nw"] as const) {
    const next = resizeCrop(rect, handle, 0.05, 0.05);
    assert.equal(next.x, handle.includes("w") ? 0.25 : 0.2);
    assert.equal(next.y, handle.includes("n") ? 0.25 : 0.2);
    if (!handle.includes("w") && !handle.includes("e"))
      assert.ok(Math.abs(next.width - 0.6) < 1e-10);
    if (!handle.includes("n") && !handle.includes("s"))
      assert.ok(Math.abs(next.height - 0.6) < 1e-10);
    const constrained = resizeCrop(rect, handle, -10, 10);
    assert.ok(constrained.x >= 0 && constrained.y >= 0);
    assert.ok(
      constrained.x + constrained.width <= 1.000001 &&
        constrained.y + constrained.height <= 1.000001,
    );
    assert.ok(constrained.width >= 0.019999 && constrained.height >= 0.019999);
    const locked = resizeCrop(rect, handle, 0.1, 0.04, 1.5);
    assert.ok(Math.abs(locked.width / locked.height - 1.5) < 1e-10);
  }
  assert.deepEqual(resizeCrop(rect, "move", -1, 2), { ...rect, x: 0, y: 0.4 });
});
test("rotated crop and re-crop keep the same original-image points at the same world coordinates", () => {
  const layer = {
    ...newLayer("image"),
    x: 140,
    y: 110,
    width: 300,
    height: 200,
    rotation: 37,
    image: "data:image/png;base64,AA==",
  };
  const next = applyCrop(layer, { x: 0.2, y: 0.1, width: 0.5, height: 0.6 });
  const oldPoint = worldPoint(layer, { x: 150, y: 100 });
  const frame = cropImageFrame(next);
  const nextPoint = worldPoint(next, {
    x: frame.x + frame.width * 0.5,
    y: frame.y + frame.height * 0.5,
  });
  assert.ok(Math.abs(oldPoint.x - nextPoint.x) < 1e-8 && Math.abs(oldPoint.y - nextPoint.y) < 1e-8);
  const restored = applyCrop(next, FULL_CROP);
  for (const key of ["x", "y", "width", "height", "rotation"] as const)
    assert.ok(Math.abs(restored[key] - layer[key]) < 1e-8);
  const point = localPoint(layer, worldPoint(layer, { x: 35, y: 60 }));
  assert.ok(Math.abs(point.x - 35) < 1e-8 && Math.abs(point.y - 60) < 1e-8);
  assert.equal(next.image, layer.image);
});
test("cropped SVG pixels match the chosen original region without destroying image bytes", async () => {
  const pixels = Buffer.alloc(100 * 50 * 3);
  for (let y = 0; y < 50; y++)
    for (let x = 0; x < 100; x++) pixels[(y * 100 + x) * 3 + (x < 50 ? 0 : 2)] = 255;
  const image = `data:image/png;base64,${(
    await sharp(pixels, { raw: { width: 100, height: 50, channels: 3 } })
      .png()
      .toBuffer()
  ).toString("base64")}`;
  const original = { ...newLayer("image"), x: 0, y: 0, width: 200, height: 100, image };
  const scene = {
    ...freshScene(),
    layers: [applyCrop(original, { x: 0.5, y: 0, width: 0.5, height: 1 })],
  };
  const svg = sceneSvg(scene, fonts),
    { data, info } = await sharp(Buffer.from(svg))
      .resize(600, 849)
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
  const offset = (50 * info.width + 150) * info.channels;
  assert.ok(data[offset] < 10 && data[offset + 2] > 245);
  assert.equal(scene.layers[0].image, image);
  assert.ok(validateScene(scene));
  assert.equal(
    validateScene({
      ...scene,
      layers: [{ ...scene.layers[0], crop: { x: 0.9, y: 0, width: 0.5, height: 1 } }],
    }),
    false,
  );
});
test("viewport zoom and two-finger translation keep the midpoint's artboard coordinate stable", () => {
  const view = { zoom: 1, x: 40, y: 30 },
    anchor = { x: 180, y: 240 };
  const zoomed = zoomAt(view, 2, anchor);
  assert.equal((anchor.x - zoomed.x) / zoomed.zoom, (anchor.x - view.x) / view.zoom);
  assert.equal((anchor.y - zoomed.y) / zoomed.zoom, (anchor.y - view.y) / view.zoom);
  const gesture = gestureView(view, anchor, { x: 220, y: 210 }, 1.5);
  assert.equal((220 - gesture.x) / gesture.zoom, (anchor.x - view.x) / view.zoom);
  assert.equal((210 - gesture.y) / gesture.zoom, (anchor.y - view.y) / view.zoom);
  assert.equal(zoomAt(view, 100, anchor).zoom, 4);
  assert.equal(zoomAt(view, 0.001, anchor).zoom, 0.25);
});
