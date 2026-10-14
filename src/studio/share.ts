import LZString from "lz-string";
import type { Scene } from "@/lib/types";
import { validateScene } from "./model";
export function encodeScene(scene: Scene) {
  if (scene.layers.some((l) => l.kind === "image"))
    throw new Error(
      "Share links exclude uploaded images. Export a file to share this composition.",
    );
  const state = LZString.compressToEncodedURIComponent(JSON.stringify(scene));
  if (state.length > 12000)
    throw new Error("This design is too large for a safe share link. Export a file instead.");
  return state;
}
export function decodeScene(hash: string) {
  if (hash.length > 12000) throw new Error("This share link is too large.");
  const raw = LZString.decompressFromEncodedURIComponent(hash);
  if (!raw || raw.length > 160000) throw new Error("This share link is invalid.");
  const parsed: unknown = JSON.parse(raw);
  if (!validateScene(parsed) || parsed.layers.some((l) => l.kind === "image"))
    throw new Error("The shared design is unsupported or contains an upload.");
  return parsed;
}
