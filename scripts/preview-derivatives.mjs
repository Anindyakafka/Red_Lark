import fs from "node:fs/promises";
import sharp from "sharp";
const files = (await fs.readdir("content/posters")).filter((f) => f.endsWith(".json"));
for (const name of files) {
  const p = JSON.parse(await fs.readFile(`content/posters/${name}`, "utf8"));
  const folder = `public/posters/${p.slug}`;
  for (const width of [240, 400, 700]) {
    await sharp(`${folder}/source.svg`)
      .resize({ width })
      .webp({ quality: 82 })
      .toFile(`${folder}/preview-${width}.webp`);
    await sharp(`${folder}/source.svg`)
      .resize({ width })
      .avif({ quality: 50 })
      .toFile(`${folder}/preview-${width}.avif`);
  }
}
console.log(`Created responsive AVIF/WebP variants for ${files.length} posters.`);
