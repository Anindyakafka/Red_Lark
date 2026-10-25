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
import * as hb from "harfbuzzjs";
import { createShapedFont } from "../src/studio/shaping";
import workshop from "../content/workshop.json";

await Promise.all(
  ["content/posters", "content/artists", "public/posters", "src/generated", "public/icons"].map(
    (dir) => fs.mkdir(dir, { recursive: true }),
  ),
);
const fonts: Fonts = {
  display: opentype.loadSync("public/fonts/bebas-neue.ttf"),
  mono: opentype.loadSync("public/fonts/ibm-plex-mono.ttf"),
  indic: {
    hi: createShapedFont(hb, await fs.readFile("public/fonts/indic/noto-sans-devanagari-full.ttf")),
    bn: createShapedFont(hb, await fs.readFile("public/fonts/indic/noto-sans-bengali-full.ttf")),
    ml: createShapedFont(hb, await fs.readFile("public/fonts/indic/noto-sans-malayalam-full.ttf")),
  },
};
const artists: Artist[] = [
  {
    id: "wet-ink-workshop",
    name: "The Wet Ink Workshop",
    bio: "In-house credit for original AI-assisted vector placeholder studies used to test this archive. These are not contributions by a featured artist.",
    links: [],
    placeholder: true,
  },
];
for (const artist of artists)
  await fs.writeFile(`content/artists/${artist.id}.json`, JSON.stringify(artist, null, 2));
// Preserve the original artwork's palette/edition index while generating only
// the one placeholder retained in the archive.
const entries = [
  [14, "BORDERS\nARE LINES", "Borders are lines", "Migration", "Freedom of movement", ""],
] as [number, string, string, string, string, string][];
const posters: Poster[] = [];
for (const [i, headline, title, theme, movement, original] of entries) {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const artist = artists[0];
  const bw = i % 4 === 2;
  const dark = i % 5 === 3;
  const bg = bw ? "#f3f0e6" : dark ? "#151515" : i % 3 === 0 ? "#e32219" : "#f3f0e6";
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
    text: `PLACEHOLDER${original ? " / DRAFT TRANSLATION" : ""} / ${String(i + 1).padStart(2, "0")} / CC0`,
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
    dpi: 300,
    pixelWidth: px,
    pixelHeight: Math.round((px * 420) / 297),
  });
  for (const size of ["A4", "A2"] as const) {
    const preset = PRESETS[size];
    const pixelWidth = Math.round((preset.width / 25.4) * 300);
    const pixelHeight = Math.round((preset.height / 25.4) * 300);
    const artwork = Buffer.from(sceneSvg({ ...scene, preset: size }, fonts));
    for (const format of ["PNG", "JPEG"] as const) {
      const extension = format === "JPEG" ? "jpg" : "png";
      const filename = `${size}.${extension}`;
      const raster = sharp(artwork).resize(pixelWidth, pixelHeight).withMetadata({ density: 300 });
      await (
        format === "JPEG" ? raster.jpeg({ quality: 95, chromaSubsampling: "4:4:4" }) : raster.png()
      ).toFile(`${folder}/${filename}`);
      formatFiles.push({
        format,
        size,
        path: `/posters/${slug}/${filename}`,
        bytes: (await fs.stat(`${folder}/${filename}`)).size,
        dpi: 300,
        pixelWidth,
        pixelHeight,
      });
    }
  }
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
    ...workshop[slug as keyof typeof workshop],
    aiUse: "generated",
    slug,
    title,
    ...(original ? { titleOriginal: original } : {}),
    languages: [i === 9 ? "Hindi" : i === 13 ? "Bengali" : i === 16 ? "Malayalam" : "English"],
    translations: original
      ? {
          [i === 9 ? "hi" : i === 13 ? "bn" : "ml"]: {
            title: original,
            caption: "Draft translation / original CC0 placeholder study",
            tags: [theme],
            reviewed: false,
          },
        }
      : {},
    artist: artist.id,
    year: 2026,
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
    alt: `${dark ? "Black" : bg === "#e32219" ? "Signal-red" : "Off-white"} typographic print reading “${headline.replaceAll("\n", " ")}”, with an ${i % 3 === 0 ? "angular starburst" : i % 3 === 1 ? "arrow" : "array of halftone dots"} and a clearly marked placeholder credit.`,
    caption:
      "Original vector study authored for the Red Lark Workshop rebuild. Placeholder artwork, free under CC0; not a contribution by a real artist.",
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
await import("./brand");
