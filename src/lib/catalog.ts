import data from "@/generated/catalog.json" with { type: "json" };
import type { Artist, Poster } from "./types";
export const posters = data.posters as Poster[];
export const artists = data.artists as Artist[];
export const themes = [...new Set(posters.flatMap((p) => p.themes))].sort();
export const movements = [...new Set(posters.flatMap((p) => p.movements))].sort();
export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
export const artistFor = (id: string) => artists.find((a) => a.id === id)!;
export const posterFor = (slug: string) => posters.find((p) => p.slug === slug);
export { fileSize, emptyFilters, filterPosters, type Filters } from "./query";
