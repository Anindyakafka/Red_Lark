import fs from "node:fs/promises";
import opentype from "opentype.js";
import sharp from "sharp";
import PDFDocument from "pdfkit";
import SVGtoPDF from "svg-to-pdfkit";
import { zipSync, strToU8 } from "fflate";
import {
  LICENSES,
  PRESETS,
  type Artist,
  type Poster,
  type Scene,
  type Layer,
} from "../src/lib/types";
import { freshScene, newLayer } from "../src/studio/model";
import { sceneSvg, type Fonts } from "../src/studio/render";

await Promise.all(
  ["content/posters", "content/artists", "public/posters", "src/generated", "public/icons"].map(
    (dir) => fs.mkdir(dir, { recursive: true }),
  ),
);
const fonts: Fonts = {
  display: opentype.loadSync("public/fonts/bebas-neue.ttf"),
  mono: opentype.loadSync("public/fonts/ibm-plex-mono.ttf"),
};
const artists: Artist[] = [
  {
    id: "mirafra-type-lab",
    name: "Mirafra Type Lab",
    bio: "An invented credit for original typographic placeholder studies authored for this build. Not a real artist collective.",
    links: [],
    placeholder: true,
  },
  {
    id: "mirafra-print-lab",
    name: "Mirafra Print Lab",
    bio: "An invented credit for original geometric placeholder studies authored for this build. No external artist's work is used.",
    links: [],
    placeholder: true,
  },
];
for (const artist of artists)
  await fs.writeFile(`content/artists/${artist.id}.json`, JSON.stringify(artist, null, 2));
const entries = [
  ["WE ARE\nSTILL HERE", "We are still here", "Solidarity", "Mutual aid", ""],
  ["HOMES\nFOR ALL", "Homes for all", "Housing", "Housing justice", ""],
  ["CARE\nIS WORK", "Care is work", "Labor", "May Day", ""],
  ["NO ONE\nIS DISPOSABLE", "No one is disposable", "Solidarity", "Mutual aid", ""],
  ["OUR AIR\nOUR FUTURE", "Our air, our future", "Climate", "Climate justice", ""],
  ["MAKE\nROOM", "Make room", "Migration", "Freedom of movement", ""],
  ["LISTEN\nTO THE LAND", "Listen to the land", "Ecology", "Climate justice", ""],
  ["PUBLIC\nSPACE", "Public space", "Housing", "Right to the city", ""],
  ["MANY\nVOICES", "Many voices", "Solidarity", "Mutual aid", ""],
  [
    "UN MUNDO\nPARA TODAS",
    "A world for everyone",
    "Solidarity",
    "Mutual aid",
    "Un mundo para todas",
  ],
  [
    "NOTHING\nABOUT US\nWITHOUT US",
    "Nothing about us without us",
    "Accessibility",
    "Disability justice",
    "",
  ],
  ["LESS\nEXTRACTION\nMORE CARE", "Less extraction, more care", "Climate", "Climate justice", ""],
  ["WE KEEP\nEACH OTHER\nSAFE", "We keep each other safe", "Solidarity", "Mutual aid", ""],
  ["LE DROIT\nAU REPOS", "The right to rest", "Labor", "May Day", "Le droit au repos"],
  ["BORDERS\nARE LINES", "Borders are lines", "Migration", "Freedom of movement", ""],
  ["A FUTURE\nWE SHARE", "A future we share", "Ecology", "Climate justice", ""],
  ["BUILD\nTOGETHER", "Build together", "Housing", "Right to the city", ""],
  ["TAKE\nUP SPACE", "Take up space", "Accessibility", "Disability justice", ""],
];
const posters: Poster[] = [];
for (let i = 0; i < entries.length; i++) {
  const [headline, title, theme, movement, original] = entries[i];
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const artist = artists[i % 2];
  const bw = i % 4 === 2;
  const dark = i % 5 === 3;
  const bg = dark ? "#151515" : i % 3 === 0 ? "#e32219" : "#f3f0e6";
  const ink = dark || bg === "#e32219" ? "#f3f0e6" : bw ? "#151515" : "#e32219";
  const scene: Scene = { ...freshScene(), background: bg, colors: bw ? 1 : 2, layers: [] };
  const credit = {
    id: slug,
    title,
    artist: artist.name,
    license: "CC0-1.0" as const,
    source: `/poster/${slug}/`,
  };
  const text: Layer = {
    ...newLayer("text", `${slug}-type`),
    x: 28,
    y: 50,
    width: 544,
    height: 340,
    text: headline,
    fontSize: headline.length > 26 ? 112 : 145,
    color: ink,
    credit,
  };
  scene.layers.push(text);
  scene.layers.push({
    ...newLayer(i % 3 === 0 ? "star" : i % 3 === 1 ? "arrow" : "halftone", `${slug}-symbol`),
    x: i % 3 === 0 ? 170 : 35,
    y: 480,
    width: i % 3 === 0 ? 250 : 520,
    height: 200,
    color: ink,
    rotation: i % 3 === 1 ? -8 : 0,
    credit,
  });
  scene.layers.push({
    ...newLayer("text", `${slug}-edition`),
    x: 28,
    y: 740,
    width: 544,
    height: 45,
    text: `PLACEHOLDER / ${String(i + 1).padStart(2, "0")} / CC0`,
    font: "mono",
    fontSize: 15,
    color: ink,
    credit,
  });
  const svg = sceneSvg(scene, fonts);
  const folder = `public/posters/${slug}`;
  await fs.mkdir(folder, { recursive: true });
  await fs.writeFile(`${folder}/source.svg`, svg);
  await sharp(Buffer.from(svg))
    .resize({ width: 700 })
    .webp({ quality: 82 })
    .toFile(`${folder}/preview.webp`);
  await sharp(Buffer.from(svg))
    .resize({ width: 700 })
    .avif({ quality: 50 })
    .toFile(`${folder}/preview.avif`);
  await sharp(Buffer.from(svg))
    .resize({ width: 1200, height: 630, fit: "contain", background: "#f3f0e6" })
    .png()
    .toFile(`${folder}/og.png`);
  // Vector PDF from the same original layers. Text is outlined; no viewer font substitution.
  const formatFiles: Poster["formats"] = [];
  for (const size of ["A4", "A3", "A2", "18x24"] as const) {
    const p = PRESETS[size];
    const widthPt = (p.width / 25.4) * 72;
    const heightPt = (p.height / 25.4) * 72;
    const pdf = new PDFDocument({
      size: [widthPt, heightPt],
      margin: 0,
      info: {
        Title: title,
        Author: artist.name,
        Subject: "CC0 original placeholder; RGB; no bleed; print at actual size.",
      },
    });
    const chunks: Buffer[] = [];
    const done = new Promise<Buffer>((resolve, reject) => {
      pdf.on("data", (chunk: Buffer) => chunks.push(chunk));
      pdf.on("end", () => resolve(Buffer.concat(chunks)));
      pdf.on("error", reject);
    });
    SVGtoPDF(pdf, sceneSvg({ ...scene, preset: size }, fonts), 0, 0, {
      width: widthPt,
      height: heightPt,
      assumePt: false,
    });
    pdf.end();
    const filename = size + ".pdf";
    const bytes = await done;
    await fs.writeFile(folder + "/" + filename, bytes);
    formatFiles.push({
      format: "PDF",
      size,
      path: "/posters/" + slug + "/" + filename,
      bytes: bytes.length,
    });
  }
  const px = Math.round((297 / 25.4) * 300);
  await sharp(Buffer.from(svg))
    .resize({ width: px })
    .withMetadata({ density: 300 })
    .png()
    .toFile(`${folder}/A3.png`);
  formatFiles.push({
    format: "PNG",
    size: "A3",
    path: `/posters/${slug}/A3.png`,
    bytes: (await fs.stat(`${folder}/A3.png`)).size,
  });
  formatFiles.push({
    format: "SVG",
    size: "A3",
    path: `/posters/${slug}/source.svg`,
    bytes: Buffer.byteLength(svg),
  });
  const bundle = zipSync({
    "source.svg": strToU8(svg),
    "A3.pdf": new Uint8Array(await fs.readFile(`${folder}/A3.pdf`)),
    "LICENSE.txt": strToU8(
      `${title}\n${artist.name}\nCC0-1.0 original placeholder artwork\n${LICENSES["CC0-1.0"].url}\n`,
    ),
  });
  await fs.writeFile(`${folder}/bundle.zip`, bundle);
  formatFiles.push({
    format: "ZIP",
    size: "Bundle",
    path: `/posters/${slug}/bundle.zip`,
    bytes: bundle.byteLength,
  });
  const poster: Poster = {
    slug,
    title,
    ...(original ? { titleOriginal: original } : {}),
    languages: [i === 9 ? "Spanish" : i === 13 ? "French" : "English"],
    artist: artist.id,
    year: 2026 - (i % 3),
    themes: [theme],
    movements: [movement],
    colorMode: bw ? "bw" : "color",
    region: "Open archive",
    formats: formatFiles,
    license: "CC0-1.0",
    licenseUrl: LICENSES["CC0-1.0"].url,
    allowsDerivatives: true,
    commercialUseAllowed: true,
    source: `/poster/${slug}/`,
    artistUrl: `/artist/${artist.id}/`,
    alt: `${dark ? "Black" : bg === "#e32219" ? "Signal-red" : "Off-white"} typographic print reading â€œ${headline.replaceAll("\n", " ")}â€, with an ${i % 3 === 0 ? "angular starburst" : i % 3 === 1 ? "arrow" : "array of halftone dots"} and a clearly marked placeholder credit.`,
    caption:
      "Original vector study authored for the Mirafra rebuild. Placeholder artwork, free under CC0; not a contribution by a real artist.",
    remixable: true,
    placeholder: true,
    preview: `/posters/${slug}/preview.webp`,
    dominantColor: bg,
    studioLayers: scene,
  };
  await fs.writeFile(`content/posters/${slug}.json`, JSON.stringify(poster, null, 2));
  posters.push(poster);
}
await fs.writeFile("src/generated/catalog.json", JSON.stringify({ posters, artists }));
const icon =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#f3f0e6"/><path d="M80 420V92H148L256 268 364 92H432V420H352V250L256 398 160 250V420Z" fill="#151515"/><path d="M0 460H512V512H0Z" fill="#e32219"/></svg>';
await fs.writeFile("public/icons/mark.svg", icon);
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
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#f3f0e6"/><path d="M0 20H1200M0 610H1200" stroke="#151515" stroke-width="6"/>${fonts.display.getPath("MIRAFRA", 40, 310, 270).toSVG(2)}${fonts.mono.getPath("FREE POSTERS. YOUR WORDS. PUBLIC WALLS.", 45, 440, 34).toSVG(2)}<rect x="45" y="480" width="1110" height="70" fill="#e32219"/></svg>`;
await sharp(Buffer.from(og)).png().toFile("public/og-default.png");
await fs.writeFile(
  "public/site.webmanifest",
  JSON.stringify(
    {
      name: "Mirafra â€” Free protest poster archive",
      short_name: "Mirafra",
      start_url: "/",
      display: "standalone",
      background_color: "#f3f0e6",
      theme_color: "#e32219",
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
console.log(
  `Authored ${posters.length} CC0 placeholders with vector sources, four print PDFs, 300-PPI PNGs, previews, and bundles.`,
);
