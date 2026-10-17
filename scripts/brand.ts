import fs from "node:fs/promises";
import sharp from "sharp";
import opentype from "opentype.js";

// Original geometric artwork drawn for this project. No deck/web imagery.
const bird =
  '<path d="M54 349 142 266 170 173 215 222 310 80 303 226 389 199 431 224 479 228 434 250 399 306 305 334 230 399 253 330 170 326 76 421 103 351Z" fill="#c51d14"/><path d="m214 266 77-57-32 97Z" fill="#151515"/><circle cx="405" cy="227" r="7" fill="#f3f0e6"/>';
const wrap = (body: string, view = "0 0 512 512") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${view}">${body}</svg>`;
await fs.mkdir("public/brand", { recursive: true });
await fs.mkdir("public/icons", { recursive: true });
const icon = wrap('<rect width="512" height="512" fill="#f3f0e6"/>' + bird);
await fs.writeFile("public/icons/mark.svg", icon);
await fs.writeFile("public/brand/lark.svg", wrap(bird));
await fs.writeFile(
  "public/brand/ink-splatter.svg",
  wrap(
    '<path fill="currentColor" d="m251 52 22 83 61-45-24 87 88-19-42 66 92 25-94 26 49 72-83-23 13 92-63-64-33 103-23-92-72 39 24-83-99 8 70-64-82-47 102 1-28-88 73 47Z"/><circle cx="62" cy="90" r="17"/><circle cx="433" cy="408" r="21"/><circle cx="440" cy="80" r="9"/>',
  ),
);
await fs.writeFile(
  "public/brand/flame.svg",
  wrap(
    '<path fill="currentColor" d="M250 35c35 113-86 117-49 211 23-36 53-62 55-106 94 84 164 148 135 246-32 105-202 131-270 32-49-73-22-139 35-195-1 65 5 86 25 91-22-137 94-168 69-279Z"/>',
  ),
);
await fs.writeFile(
  "public/brand/cursor.svg",
  wrap(
    '<path d="m74 38 365 238-158 19-56 151Z" fill="currentColor"/><path d="m275 293 93 123" stroke="currentColor" stroke-width="44"/>',
  ),
);
for (const size of [16, 32, 180, 192, 512])
  await sharp(Buffer.from(icon)).resize(size, size).png().toFile(`public/icons/icon-${size}.png`);
const png = await fs.readFile("public/icons/icon-32.png");
const header = Buffer.alloc(22);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(1, 4);
header[6] = 32;
header[7] = 32;
header.writeUInt16LE(1, 10);
header.writeUInt16LE(32, 12);
header.writeUInt32LE(png.length, 14);
header.writeUInt32LE(22, 18);
await fs.writeFile("public/favicon.ico", Buffer.concat([header, png]));
const font = opentype.loadSync("public/fonts/bebas-neue.ttf");
const lettering =
  font.getPath("RED LARK", 40, 280, 215).toSVG(2) + font.getPath("WORKSHOP", 40, 470, 215).toSVG(2);
await fs.writeFile("public/brand/wordmark.svg", wrap(lettering, "0 0 1200 512"));
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#f3f0e6"/>${lettering}<g transform="translate(760 65) scale(.75)">${bird}</g><path d="M40 540H1160" stroke="#151515" stroke-width="5"/>${font.getPath("FREE POLITICAL GRAPHICS / INDIA", 40, 596, 43).toSVG(2)}</svg>`;
await sharp(Buffer.from(og)).png().toFile("public/og-default.png");
await fs.writeFile(
  "public/site.webmanifest",
  JSON.stringify(
    {
      name: "RED LARK WORKSHOP",
      short_name: "RED LARK",
      start_url: "/",
      display: "standalone",
      background_color: "#f3f0e6",
      theme_color: "#c51d14",
      icons: [192, 512].map((s) => ({
        src: `/icons/icon-${s}.png`,
        sizes: `${s}x${s}`,
        type: "image/png",
      })),
    },
    null,
    2,
  ),
);
console.log("Original lark, motifs, wordmark, icons and OG image generated.");
