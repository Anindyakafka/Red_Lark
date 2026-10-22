import type { Font } from "opentype.js";
import type { ShapedFont } from "./shaping";
import { PRESETS, type FontId, type Layer, type Scene } from "@/lib/types";
import { creditLines } from "@/lib/licenses";
import { assertExportable, dimensions } from "./model";
import { creditSettings, attributionMetadata } from "./attribution";
export type Fonts = Record<FontId, Font> & { indic?: Record<"hi" | "bn" | "ml", ShapedFont> };
/** Credits can combine a title and artist in different scripts on the same line. */
export function creditPaths(
  text: string,
  fonts: Fonts,
  x: number,
  y: number,
  width: number,
  fontSize = 7,
  color = "#151515",
) {
  if (!/[\u0900-\u097f\u0980-\u09ff\u0d00-\u0d7f]/.test(text))
    return textPaths(text, fonts.mono, x, y, fontSize, width, color);
  if (!fonts.indic)
    throw new Error("Indic credit fonts are not loaded. Retry after fonts finish loading.");
  const parts =
    text.match(
      /[\u0900-\u097f][\u0900-\u097f\u200c\u200d]*|[\u0980-\u09ff][\u0980-\u09ff\u200c\u200d]*|[\u0d00-\u0d7f][\u0d00-\u0d7f\u200c\u200d]*|[^\u0900-\u097f\u0980-\u09ff\u0d00-\u0d7f]+/gu,
    ) || [];
  const runs = parts.map((part) => {
    const language = /[\u0900-\u097f]/.test(part)
      ? "hi"
      : /[\u0980-\u09ff]/.test(part)
        ? "bn"
        : /[\u0d00-\u0d7f]/.test(part)
          ? "ml"
          : null;
    if (!language) return { text: part, width: fonts.mono.getAdvanceWidth(part, 1) };
    const font = fonts.indic![language],
      run = font.layout(part);
    if (run.glyphs.some((glyph) => glyph.id === 0))
      throw new Error(
        "A credit contains an unsupported glyph. Keep the credit intact and choose a supported font.",
      );
    return {
      text: part,
      font,
      run,
      width: run.positions.reduce((sum, position) => sum + position.xAdvance, 0) / font.unitsPerEm,
    };
  });
  const size = Math.min(
    fontSize,
    width /
      Math.max(
        1,
        runs.reduce((sum, run) => sum + run.width, 0),
      ),
  );
  let pen = x;
  return runs
    .map((run) => {
      const left = pen;
      pen += run.width * size;
      if (!run.font || !run.run)
        return `<path fill="${color}" d="${fonts.mono.getPath(run.text, left, y + fontSize, size).toPathData(2)}"/>`;
      const scale = size / run.font.unitsPerEm;
      let advance = 0;
      return run.run.glyphs
        .map((glyph, index) => {
          const position = run.run.positions[index];
          const transform = `translate(${left + (advance + position.xOffset) * scale} ${y + fontSize - position.yOffset * scale}) scale(${scale} ${-scale})`;
          advance += position.xAdvance;
          return `<g fill="${color}" transform="${transform}"><path d="${glyph.path.toSVG()}"/></g>`;
        })
        .join("");
    })
    .join("");
}
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
export function sceneSvg(scene: Scene, fonts: Fonts, separation?: string, editing = false) {
  assertExportable(scene);
  const { width, height } = dimensions(scene);
  const preset = PRESETS[scene.preset];
  const settings = creditSettings(scene);
  const columns = Math.max(10, Math.floor(settings.width / (settings.fontSize * 0.62)));
  const lines = creditLines(scene).flatMap(
    (line) => line.match(new RegExp(`.{1,${columns}}`, "gu")) ?? [],
  );
  const layers = scene.layers
    .filter((l) => !l.hidden && (!separation || l.color === separation))
    .map((l) => layerMarkup(separation ? { ...l, color: "#151515" } : l, fonts))
    .join("");
  const credits = lines
    .map((line, i) =>
      creditPaths(
        line,
        fonts,
        settings.x + 4,
        settings.y + 4 + i * settings.fontSize * 1.5,
        settings.width - 8,
        settings.fontSize,
        settings.color,
      ),
    )
    .join("");
  const credit =
    !editing && settings.enabled
      ? `<g data-export-credit="true"><rect x="${settings.x}" y="${settings.y}" width="${settings.width}" height="${lines.length * settings.fontSize * 1.5 + 8}" fill="${settings.background}"/>${credits}</g>`
      : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${preset.width}${preset.unit}" height="${preset.height}${preset.unit}" viewBox="0 0 ${width} ${height}"><title>Red Lark Workshop composition</title><metadata>${xml(JSON.stringify(attributionMetadata(scene)))}</metadata><defs><clipPath id="artboard"><rect width="${width}" height="${height}"/></clipPath></defs><rect width="${width}" height="${height}" fill="${separation ? "#ffffff" : scene.background}"/><g clip-path="url(#artboard)">${layers}${credit}</g></svg>`;
}
