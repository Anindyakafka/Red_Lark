import type { Font } from "opentype.js";
import type { ShapedFont } from "./shaping";
import { LICENSES } from "@/lib/types";
import { PRESETS, type FontId, type Layer, type Scene } from "@/lib/types";
import { creditLines, sceneCredits } from "@/lib/licenses";
import { assertExportable, dimensions } from "./model";
export type Fonts = Record<FontId, Font> & { indic?: Record<"hi" | "bn" | "ml", ShapedFont> };
export const xml = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]!,
  );
export function textPaths(
  text: string,
  font: Font,
  x: number,
  y: number,
  size: number,
  width: number,
  color: string,
  indic?: Fonts["indic"],
) {
  return text
    .split("\n")
    .map((line, i) => {
      if (indic && /[\u0900-\u097f\u0980-\u09ff\u0d00-\u0d7f]/.test(line)) {
        const language = /[\u0d00-\u0d7f]/.test(line)
          ? "ml"
          : /[\u0980-\u09ff]/.test(line)
            ? "bn"
            : "hi";
        const shaped = indic[language];
        const run = shaped.layout(line);
        if (run.glyphs.some((g) => g.id === 0))
          throw new Error(
            "This text includes a glyph unavailable in the selected Indic font. Use separate text layers for different scripts.",
          );
        const actualSize = Math.min(
          size,
          (width * shaped.unitsPerEm) /
            Math.max(
              1,
              run.positions.reduce((n, p) => n + p.xAdvance, 0),
            ),
        );
        const scale = actualSize / shaped.unitsPerEm;
        let pen = 0;
        return run.glyphs
          .map((g, j) => {
            const p = run.positions[j];
            const transform = `translate(${x + (pen + p.xOffset) * scale} ${y + size * (1 + i * 1.5) - p.yOffset * scale}) scale(${scale} ${-scale})`;
            pen += p.xAdvance;
            return `<g fill="${color}" transform="${transform}"><path d="${g.path.toSVG()}"/></g>`;
          })
          .join("");
      }
      const actualSize = Math.min(
        size,
        (size * width) / Math.max(1, font.getAdvanceWidth(line, size)),
      );
      const d = font.getPath(line, x, y + size * (0.85 + i * 1.05), actualSize).toPathData(2);
      return `<path fill="${color}" d="${d}"/>`;
    })
    .join("");
}
export function layerMarkup(l: Layer, fonts: Fonts) {
  const { width: w, height: h } = l;
  let inner = "";
  switch (l.kind) {
    case "text":
      inner = textPaths(
        l.text,
        fonts[l.font],
        0,
        0,
        Math.min(
          l.fontSize,
          h /
            Math.max(1, l.text.split("\n").length) /
            (/[\u0900-\u0d7f]/.test(l.text) ? 1.5 : 1.05),
        ),
        w,
        l.color,
        fonts.indic,
      );
      break;
    case "rectangle":
      inner = `<rect width="${w}" height="${h}" fill="${l.color}"/>`;
      break;
    case "circle":
      inner = `<ellipse cx="${w / 2}" cy="${h / 2}" rx="${w / 2}" ry="${h / 2}" fill="${l.color}"/>`;
      break;
    case "star": {
      const points = Array.from({ length: 24 }, (_, i) => {
        const a = (i * Math.PI) / 12 - Math.PI / 2;
        const r = i % 2 ? 0.36 : 0.5;
        return `${w / 2 + Math.cos(a) * w * r},${h / 2 + Math.sin(a) * h * r}`;
      }).join(" ");
      inner = `<polygon points="${points}" fill="${l.color}"/>`;
      break;
    }
    case "arrow":
      inner = `<path d="M0 ${h * 0.32}H${w * 0.68}V0L${w} ${h / 2} ${w * 0.68} ${h}V${h * 0.68}H0Z" fill="${l.color}"/>`;
      break;
    case "halftone":
    case "grain": {
      const step = Math.max(l.kind === "halftone" ? 14 : 11, Math.sqrt((w * h) / 1600));
      const marks: string[] = [];
      for (let y = 3; y < h; y += step)
        for (let x = 3; x < w; x += step) {
          const seed = (x * 31 + y * 17) % 13;
          if (l.kind === "halftone" || seed > 4)
            marks.push(
              `<circle cx="${x + (l.kind === "grain" ? seed / 3 : 0)}" cy="${y}" r="${l.kind === "halftone" ? 3 : 1 + seed / 15}" fill="${l.color}"/>`,
            );
        }
      inner = marks.join("");
      break;
    }
    case "image":
      inner = `<image href="${xml(l.image ?? "")}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"/>`;
      break;
  }
  return `<g transform="translate(${l.x} ${l.y}) rotate(${l.rotation} ${w / 2} ${h / 2})">${inner}</g>`;
}
export function sceneSvg(scene: Scene, fonts: Fonts, separation?: string) {
  const license = assertExportable(scene);
  const { width, height } = dimensions(scene);
  const preset = PRESETS[scene.preset];
  const lines = creditLines(scene).flatMap((line) => line.match(/.{1,110}/g) ?? []);
  const stripHeight = Math.max(27, lines.length * 10 + 10);
  const stripTop = height - stripHeight;
  const layers = scene.layers
    .filter((l) => !l.hidden && (!separation || l.color === separation))
    .map((l) => layerMarkup(separation ? { ...l, color: "#151515" } : l, fonts))
    .join("");
  const credits = lines
    .map((line, i) =>
      textPaths(line, fonts.mono, 10, stripTop + 5 + i * 10, 7, width - 20, "#151515"),
    )
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${preset.width}${preset.unit}" height="${preset.height}${preset.unit}" viewBox="0 0 ${width} ${height}"><title>Red Lark Workshop composition</title><metadata>${xml(JSON.stringify({ sourceLicense: license, adaptationLicense: sceneCredits(scene).some((c) => LICENSES[c.license].shareAlike) ? license : "User additions: rights retained", credits: creditLines(scene), preset: scene.preset, rasterPpi: preset.unit === "mm" ? 300 : undefined }))}</metadata><defs><clipPath id="artboard"><rect width="${width}" height="${stripTop}"/></clipPath></defs><rect width="${width}" height="${height}" fill="${separation ? "#ffffff" : scene.background}"/><g clip-path="url(#artboard)">${layers}</g><rect y="${stripTop}" width="${width}" height="${stripHeight}" fill="#f3f0e6"/><path d="M0 ${stripTop}H${width}" stroke="#151515"/>${credits}</svg>`;
}
