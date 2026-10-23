import { strFromU8, unzipSync } from "fflate";
import sharp from "sharp";
import { ApiError, sha256 } from "./security.ts";

export const WRITING_MIMES = [
  "text/plain",
  "text/markdown",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export function isWritingMime(mime: string): mime is (typeof WRITING_MIMES)[number] {
  return (WRITING_MIMES as readonly string[]).includes(mime);
}

function decodeEntities(value: string) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function plainText(input: Buffer) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(input);
  } catch {
    throw new ApiError(422, "invalid_file");
  }
}

function docxText(input: Buffer) {
  try {
    const files = unzipSync(input, { filter: (file) => file.name === "word/document.xml" });
    const document = files["word/document.xml"];
    if (!document || document.byteLength > 2_000_000) throw new Error("invalid");
    return decodeEntities(
      strFromU8(document)
        .replace(/<w:tab\b[^>]*\/>/gi, "\t")
        .replace(/<\/w:p>/gi, "\n")
        .replace(/<[^>]+>/g, ""),
    );
  } catch {
    throw new ApiError(422, "invalid_file");
  }
}

function cleanText(value: string) {
  const text = value
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .trim();
  if (!text || text.length > 100_000) throw new ApiError(422, "invalid_file");
  return text;
}

function xml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[character]!,
  );
}

export async function sanitizeWriting(input: Buffer, mime: string) {
  if (!isWritingMime(mime)) throw new ApiError(422, "invalid_file");
  const text = cleanText(
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ? docxText(input)
      : plainText(input),
  );
  const lines = text
    .split("\n")
    .flatMap((line) => line.match(/.{1,52}(?:\s|$)|\S+?(?:\s|$)/g) || [line])
    .slice(0, 52)
    .map((line) => xml(line.trimEnd()));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="1980" viewBox="0 0 1400 1980"><rect width="1400" height="1980" fill="#f5f0e6"/><rect x="54" y="54" width="1292" height="1872" fill="none" stroke="#111" stroke-width="12"/><text x="112" y="174" font-family="sans-serif" font-size="54" font-weight="700" fill="#d71920">WRITING</text><line x1="112" y1="210" x2="1288" y2="210" stroke="#111" stroke-width="7"/>${lines.map((line, index) => `<text x="112" y="${300 + index * 30}" font-family="monospace" font-size="24" fill="#111">${line || " "}</text>`).join("")}</svg>`;
  const preview = await sharp(Buffer.from(svg)).webp({ quality: 82 }).toBuffer();
  return {
    text: Buffer.from(text + "\n", "utf8"),
    preview,
    width: 1400,
    height: 1980,
    sha256: sha256(Buffer.from(text, "utf8")),
  };
}
