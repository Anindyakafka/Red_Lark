import { deflateSync, inflateSync, strToU8, strFromU8 } from "fflate";
import type { Scene } from "@/lib/types";
import { migrateScene, validateScene } from "./model";
export function encodeScene(scene: Scene) {
  if (!validateScene(scene)) throw new Error("This composition is invalid or unsupported.");
  if (scene.layers.some((l) => l.kind === "image"))
    throw new Error(
      "Share links exclude uploaded images. Export a file to share this composition.",
    );
  const raw = strToU8(JSON.stringify(scene));
  if (raw.length > 160000)
    throw new Error("This design is too large for a share link. Export a file instead.");
  const compressed = deflateSync(raw);
  const state =
    "v3." +
    btoa(String.fromCharCode(...compressed))
      .replaceAll("+", "-")
      .replaceAll("/", "_")
      .replace(/=+$/, "");
  if (state.length > 12000)
    throw new Error("This design is too large for a safe share link. Export a file instead.");
  return state;
}
export function decodeScene(hash: string) {
  if (hash.length > 12000) throw new Error("This share link is too large.");
  if (!/^v[23]\.[A-Za-z0-9_-]+$/.test(hash))
    throw new Error("This share link is invalid or uses an unsupported encoding.");
  const encoded = hash.slice(3).replaceAll("-", "+").replaceAll("_", "/");
  const bytes = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
  // A fixed output buffer prevents a compressed payload from allocating unbounded memory.
  const decoded = inflateSync(bytes, { out: new Uint8Array(160001) });
  if (!decoded.length || decoded.length > 160000)
    throw new Error("This shared design exceeds the supported size.");
  const raw = strFromU8(decoded);
  const parsed: unknown = JSON.parse(raw);
  const scene = migrateScene(parsed);
  if (!scene || scene.layers.some((l) => l.kind === "image"))
    throw new Error("The shared design is unsupported or contains an upload.");
  return scene;
}
