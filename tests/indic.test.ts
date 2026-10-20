import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import * as hb from "harfbuzzjs";
import { createShapedFont } from "../src/studio/shaping";
import opentype from "opentype.js";
import { creditPaths } from "../src/studio/render";

test("a single visible source-credit line shapes Hindi, Bengali and Malayalam names together", () => {
  const fonts = {
    display: opentype.loadSync("public/fonts/bebas-neue.ttf"),
    mono: opentype.loadSync("public/fonts/ibm-plex-mono.ttf"),
    indic: {
      hi: createShapedFont(hb, fs.readFileSync("public/fonts/indic/noto-sans-devanagari-full.ttf")),
      bn: createShapedFont(hb, fs.readFileSync("public/fonts/indic/noto-sans-bengali-full.ttf")),
      ml: createShapedFont(hb, fs.readFileSync("public/fonts/indic/noto-sans-malayalam-full.ttf")),
    },
  };
  const text = "कल्पना / কল্পনা / കൽപ്പന / CC-BY-SA-4.0 / https://example.invalid/source";
  const paths = creditPaths(text, fonts, 10, 20, 500);
  assert.ok([...paths.matchAll(/<g /g)].length > 10);
  assert.ok(!paths.includes("NaN"));
  assert.throws(
    () => creditPaths(text, { display: fonts.display, mono: fonts.mono }, 10, 20, 500),
    /credit fonts/,
  );
});
for (const [script, phrases] of [
  ["devanagari", ["सबके लिए", "दुनिया", "क्ष त्र ज्ञ"]],
  ["bengali", ["বিশ্রামের", "অধিকার", "ক্ষ জ্ঞ"]],
  ["malayalam", ["ഒരുമിച്ച്", "പണിയാം", "ൺ ൻ ർ ൽ ൾ ൿ"]],
] as const)
  test(`HarfBuzz outlines ${script} phrases and conjuncts without missing glyphs`, () => {
    const font = createShapedFont(
      hb,
      fs.readFileSync(`public/fonts/indic/noto-sans-${script}-full.ttf`),
    );
    for (const phrase of phrases) {
      const run = font.layout(phrase);
      assert.ok(run.glyphs.length > 0);
      assert.ok(run.glyphs.every((g) => g.id !== 0));
      assert.ok(run.glyphs.some((g) => g.path.toSVG().startsWith("M")));
      assert.ok(run.positions.reduce((sum, p) => sum + p.xAdvance, 0) > 0);
    }
  });
