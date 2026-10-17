import type * as HarfBuzz from "harfbuzzjs";
export interface ShapedFont {
  unitsPerEm: number;
  layout(text: string): {
    glyphs: { id: number; path: { toSVG(): string } }[];
    positions: { xAdvance: number; yAdvance: number; xOffset: number; yOffset: number }[];
  };
}
export function createShapedFont(hb: typeof HarfBuzz, bytes: Uint8Array): ShapedFont {
  const blob = new hb.Blob(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer,
  );
  const face = new hb.Face(blob);
  const font = new hb.Font(face);
  return {
    unitsPerEm: face.upem,
    layout(text) {
      const buffer = new hb.Buffer();
      buffer.addText(text);
      buffer.guessSegmentProperties();
      hb.shape(font, buffer);
      const infos = buffer.getGlyphInfos();
      const positions = buffer.getGlyphPositions();
      return {
        glyphs: infos.map((info) => ({
          id: info.codepoint,
          path: { toSVG: () => font.glyphToPath(info.codepoint) },
        })),
        positions,
      };
    },
  };
}
