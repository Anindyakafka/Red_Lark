import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import * as hb from "harfbuzzjs";
import { createShapedFont } from "../src/studio/shaping";
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
