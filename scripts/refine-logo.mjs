import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import ImageTracer from "imagetracerjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "public", "brand");
await fs.mkdir(output, { recursive: true });
const { data, info } = await sharp(path.join(root, "mirafra.jpeg"))
  .blur(0.8)
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
// Keep the black bird and wire; exclude the original grey raster wordmark.
const rgba = new Uint8ClampedArray(info.width * info.height * 4);
for (let i = 0; i < info.width * info.height; i++) {
  const black =
    data[i * info.channels] < 65 &&
    data[i * info.channels + 1] < 65 &&
    data[i * info.channels + 2] < 65;
  rgba[i * 4] = rgba[i * 4 + 1] = rgba[i * 4 + 2] = black ? 0 : 255;
  rgba[i * 4 + 3] = black ? 255 : 0;
}
const traced = ImageTracer.imagedataToSVG(
  { width: info.width, height: info.height, data: rgba },
  {
    ltres: 8,
    qtres: 8,
    rightangleenhance: false,
    pathomit: 35,
    colorsampling: 0,
    numberofcolors: 2,
    pal: [
      { r: 0, g: 0, b: 0, a: 255 },
      { r: 255, g: 255, b: 255, a: 0 },
    ],
    scale: 1,
    viewbox: true,
    desc: false,
    roundcoords: 1,
  },
);
const paths = (traced.match(/<path\b[^>]*>/g) ?? [])
  .filter((p) => !/opacity="0"/.test(p))
  .join("")
  .replaceAll('fill="rgb(0,0,0)"', 'fill="currentColor"')
  .replaceAll('stroke="rgb(0,0,0)"', 'stroke="currentColor"');
if (!paths) throw new Error("No logo paths were traced");
const mark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1147 620" role="img" aria-label="Mirafra bird on barbed wire"><title>Mirafra</title>${paths}</svg>`;
await fs.writeFile(path.join(output, "mirafra-mark.svg"), mark);
// A vector wordmark with a portable outlined glyph set, rather than a font dependency.
const glyphs = {
  M: "M0 100V0H17L40 65 63 0H80V100H65V28L45 84H35L15 28V100Z",
  I: "M0 0H16V100H0Z",
  R: "M0 100V0H44Q70 0 70 28Q70 47 52 54L76 100H58L35 57H16V100ZM16 14V43H41Q54 43 54 28Q54 14 41 14Z",
  A: "M0 100 34 0H52L86 100H69L60 72H26L17 100ZM31 57H55L43 20Z",
  F: "M0 100V0H67V15H16V42H59V57H16V100Z",
};
const advances = { M: 104, I: 40, R: 100, A: 110, F: 91 };
let x = 0;
const wordPaths = [..."MIRAFRA"]
  .map((letter) => {
    const p = `<path transform="translate(${x} 0)" d="${glyphs[letter]}"/>`;
    x += advances[letter];
    return p;
  })
  .join("");
const wordmark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${x - 24} 100" role="img" aria-label="Mirafra"><title>Mirafra</title><g fill="currentColor" fill-rule="evenodd">${wordPaths}</g></svg>`;
await fs.writeFile(path.join(output, "mirafra-wordmark.svg"), wordmark);
const lockup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1147 830" role="img" aria-label="Mirafra"><title>Mirafra</title>${paths}<g transform="translate(50 640) scale(${1047 / (x - 24)})" fill="currentColor" fill-rule="evenodd">${wordPaths}</g></svg>`;
await fs.writeFile(path.join(output, "mirafra-logo.svg"), lockup);
for (const [name, svg, width] of [
  ["mirafra-logo", lockup, 3200],
  ["mirafra-mark", mark, 2400],
]) {
  await sharp(Buffer.from(svg))
    .resize({ width })
    .png()
    .toFile(path.join(output, `${name}.png`));
  await sharp(Buffer.from(svg.replace('role="img"', 'style="color:white" role="img"')))
    .resize({ width })
    .png()
    .toFile(path.join(output, `${name}-white.png`));
}
await sharp(Buffer.from(lockup))
  .flatten({ background: "#f5f3ec" })
  .resize({ width: 1200 })
  .jpeg({ quality: 92 })
  .toFile(path.join(output, "mirafra-proof.jpg"));
console.log(
  "Generated vector mark, outlined wordmark, lockup, and transparent high-resolution PNGs in public/brand.",
);
