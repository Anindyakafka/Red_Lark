import test from "node:test";
import assert from "node:assert/strict";
import { newLayer, freshScene, validateScene } from "../src/studio/model.ts";
import { sceneSvg } from "../src/studio/render.ts";
import { transformGroup } from "../src/studio/groups.ts";
import { encodeScene, decodeScene } from "../src/studio/share.ts";
import sharp from "sharp";
import { migrateLocalDrafts } from "../src/lib/storage.ts";
import opentype from "opentype.js";

const fonts = {
  display: opentype.loadSync("public/fonts/bebas-neue.ttf"),
  mono: opentype.loadSync("public/fonts/ibm-plex-mono.ttf"),
};

test("a vector layer accepts a non-destructive crop in the validated scene and SVG export", () => {
  const layer = { ...newLayer("rectangle"), crop: { x: 0.1, y: 0.2, width: 0.6, height: 0.5 } };
  const scene = { ...freshScene(), layers: [layer] };
  assert.equal(validateScene(scene), true);
  const svg = sceneSvg(scene, fonts);
  assert.match(svg, /clipPath/);
  assert.match(svg, /data-crop/);
  assert.doesNotMatch(svg, /<image /);
});

test("an archive poster group clips vector members in SVG, raster and shared state", async () => {
  const group = {
    id: "source-1",
    x: 0,
    y: 0,
    width: 200,
    height: 100,
    rotation: 0,
    crop: { x: 0, y: 0, width: 0.5, height: 1 },
  };
  const red = {
    ...newLayer("rectangle", "red"),
    groupId: group.id,
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    color: "#ff0000",
  };
  const blue = {
    ...newLayer("rectangle", "blue"),
    groupId: group.id,
    x: 100,
    y: 0,
    width: 100,
    height: 100,
    color: "#0000ff",
  };
  const scene = { ...freshScene(), layers: [red, blue], groups: [group] };
  assert.equal(validateScene(scene), true);
  const svg = sceneSvg(scene, fonts);
  assert.match(svg, /poster-group-0/);
  const pixels = await sharp(Buffer.from(svg))
    .resize(600, 849)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const left = (50 * pixels.info.width + 50) * pixels.info.channels;
  const right = (50 * pixels.info.width + 150) * pixels.info.channels;
  assert.ok(pixels.data[left] > 200 && pixels.data[left + 1] < 60);
  assert.ok(pixels.data[right] > 200 && pixels.data[right + 1] > 200);
  assert.deepEqual(decodeScene(encodeScene(scene)).groups, scene.groups);
  const moved = transformGroup(scene, group.id, {
    ...group,
    x: 70,
    y: 40,
    width: 300,
    height: 150,
    rotation: 30,
  });
  assert.equal(validateScene(moved), true);
  assert.equal(moved.layers[0].groupId, group.id);
  assert.equal(moved.layers[0].width, 150);
  assert.equal(moved.groups?.[0].rotation, 30);
});

test("shared designs reject non-PNG data URLs and oversized payloads", () => {
  const scene = freshScene();
  scene.layers = [{ ...newLayer("rectangle"), image: "data:image/jpeg;base64,AA==" }];
  assert.equal(validateScene(scene), false);
  assert.throws(() => encodeScene(scene));
  const large = freshScene();
  large.layers = [{ ...newLayer("text"), text: "X".repeat(1501) }];
  assert.throws(() => encodeScene(large));
  assert.throws(() => decodeScene("v3." + "A".repeat(12001)));
});

test("version-two drafts and links migrate without dropping their vector layers", () => {
  const old = { ...freshScene(), version: 2 as const };
  const values = new Map<string, string>([["redlark.studio.v2", JSON.stringify(old)]]);
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  } as Storage;
  migrateLocalDrafts(storage);
  assert.equal(values.has("redlark.studio.v2"), false);
  assert.equal(JSON.parse(values.get("redlark.studio.v3")!).version, 3);
  const oldLink = encodeScene(old).replace(/^v3\./, "v2.");
  assert.equal(decodeScene(oldLink).version, 3);
  assert.equal(decodeScene(oldLink).layers.length, old.layers.length);
});
