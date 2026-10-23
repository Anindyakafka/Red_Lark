import data from "@/generated/catalog.json" with { type: "json" };
import type { Artist, Poster } from "./types";
export const posters = data.posters as Poster[];
export const artists = data.artists as Artist[];
/** Public browse/detail routes exclude historic context-only records. */
export const publicPosters = posters.filter((poster) => poster.archiveStatus !== "archive-only");
export const publicArtists = artists.filter((artist) =>
  publicPosters.some((poster) => poster.artist === artist.id),
);
export const themes = [...new Set(publicPosters.flatMap((p) => p.themes))].sort();
export const movements = [...new Set(publicPosters.flatMap((p) => p.movements))].sort();
export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
export const artistFor = (id: string) => artists.find((a) => a.id === id)!;
export const posterFor = (slug: string) => publicPosters.find((p) => p.slug === slug);
export { fileSize, emptyFilters, filterPosters, type Filters } from "./query";
