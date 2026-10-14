import type { Scene } from "@/lib/types";
import { PRESETS } from "@/lib/types";
import { assertExportable } from "./model";
import { sceneSvg, type Fonts } from "./render";
import { track } from "@/lib/analytics";
import { strToU8, zipSync } from "fflate";

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
export function rasterSize(scene: Scene) {
  const p = PRESETS[scene.preset];
  return p.unit === "px"
    ? { width: p.width, height: p.height }
    : { width: Math.round((p.width / 25.4) * 300), height: Math.round((p.height / 25.4) * 300) };
}
async function raster(scene: Scene, fonts: Fonts) {
  const svg = sceneSvg(scene, fonts);
  const size = rasterSize(scene);
  if (size.width * size.height > 36_000_000)
    throw new Error(
      "This raster exceeds the supported pixel budget. Export the vector PDF instead.",
    );
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () =>
        reject(new Error("The browser could not render an asset. Try a vector export."));
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Your browser does not support image export. Use SVG instead.");
    ctx.drawImage(img, 0, 0, size.width, size.height);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) =>
          b
            ? resolve(b)
            : reject(new Error("Image export ran out of memory. Try PDF or a smaller preset.")),
        "image/png",
      ),
    );
    canvas.width = canvas.height = 1;
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}
function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const b of bytes) {
    crc ^= b;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
export async function pngAt300Ppi(blob: Blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const chunk = new Uint8Array(21);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, 9);
  chunk.set(strToU8("pHYs"), 4);
  view.setUint32(8, 11811);
  view.setUint32(12, 11811);
  chunk[16] = 1;
  view.setUint32(17, crc32(chunk.slice(4, 17)));
  return new Blob([bytes.slice(0, 33), chunk, bytes.slice(33)], { type: "image/png" });
}
export async function exportFile(
  scene: Scene,
  fonts: Fonts,
  format: "SVG" | "PNG" | "PDF" | "TILED" | "SEPARATIONS",
) {
  const license = assertExportable(scene);
  const base = `mirafra-${scene.preset.toLowerCase()}`;
  const svg = sceneSvg(scene, fonts);
  if (format === "SVG") download(new Blob([svg], { type: "image/svg+xml" }), `${base}.svg`);
  else if (format === "PNG") {
    const image = await raster(scene, fonts);
    download(
      PRESETS[scene.preset].unit === "mm" ? await pngAt300Ppi(image) : image,
      `${base}${scene.preset === "Social" ? "" : "-300ppi"}.png`,
    );
  } else if (format === "SEPARATIONS") {
    const inks = [
      ...new Set(scene.layers.filter((l) => !l.hidden && l.kind !== "image").map((l) => l.color)),
    ];
    const files: Record<string, Uint8Array> = {
      "README.txt": strToU8(
        `Uncalibrated one-ink composition previews, not press-ready plates.\n${license}\nCredits are on every sheet.\n`,
      ),
    };
    inks.forEach((ink, i) => {
      files[`ink-${i + 1}-${ink.slice(1)}.svg`] = strToU8(sceneSvg(scene, fonts, ink));
    });
    download(
      new Blob([new Uint8Array(zipSync(files))], { type: "application/zip" }),
      `${base}-ink-previews.zip`,
    );
  } else {
    const { jsPDF } = await import("jspdf");
    await import("svg2pdf.js");
    const p = PRESETS[scene.preset];
    const width = p.unit === "mm" ? p.width : (p.width / 96) * 25.4;
    const height = p.unit === "mm" ? p.height : (p.height / 96) * 25.4;
    const node = new DOMParser().parseFromString(svg, "image/svg+xml").documentElement;
    const pdf = new jsPDF({
      unit: "mm",
      format: format === "TILED" ? [210, 297] : [width, height],
      compress: true,
    });
    if (format === "TILED") {
      const printableWidth = 190,
        printableHeight = 277;
      const columns = Math.ceil(width / printableWidth),
        rows = Math.ceil(height / printableHeight);
      for (let row = 0; row < rows; row++)
        for (let col = 0; col < columns; col++) {
          if (row || col) pdf.addPage([210, 297]);
          pdf.saveGraphicsState();
          pdf.rect(10, 10, 190, 277);
          pdf.clip();
          pdf.discardPath();
          await pdf.svg(node, {
            x: 10 - col * printableWidth,
            y: 10 - row * printableHeight,
            width,
            height,
          });
          pdf.restoreGraphicsState();
          pdf.setFontSize(7);
          pdf.text(
            `Mirafra / tile ${col + 1},${row + 1} of ${columns},${rows} / print 100% / trim at 10mm`,
            10,
            293,
          );
        }
    } else await pdf.svg(node, { x: 0, y: 0, width, height });
    pdf.setProperties({
      title: "Mirafra composition",
      subject: license,
      author: "See source credit strip",
      keywords: "Mirafra, browser-only, outlined vector type",
    });
    download(pdf.output("blob"), `${base}${format === "TILED" ? "-a4-tiles" : ""}.pdf`);
  }
  track("studio-export");
}
export async function importImage(file: File) {
  if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type))
    throw new Error(
      "Use a JPEG, PNG, WebP or AVIF image. SVG and animated uploads are not accepted.",
    );
  if (file.size > 12_000_000) throw new Error("Choose an image under 12 MB.");
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("This file is not a supported image."));
      image.src = url;
    });
    if (image.naturalWidth * image.naturalHeight > 40_000_000)
      throw new Error("This decoded image is too large. Choose an image under 40 megapixels.");
    const scale = Math.min(1, 1800 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Image import is unsupported by this browser.");
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return { data: canvas.toDataURL("image/png"), width: canvas.width, height: canvas.height };
  } finally {
    URL.revokeObjectURL(url);
  }
}
