import artistData from "@/generated/artists.json" with { type: "json" };
import type { Artist, Poster } from "./types";
export const artists = artistData as Artist[];
const artistFor = (id: string) => artists.find((a) => a.id === id);
export function fileSize(bytes: number) {
  return bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`;
}
export interface Filters {
  query: string;
  format: string;
  theme: string;
  movement: string;
  language: string;
  artist: string;
  license: string;
  color: string;
  sort: string;
  saved: boolean;
}
export const emptyFilters: Filters = {
  query: "",
  format: "",
  theme: "",
  movement: "",
  language: "",
  artist: "",
  license: "",
  color: "",
  sort: "newest",
  saved: false,
};
export function filterPosters(items: Poster[], f: Filters, saved: string[] = []) {
  const terms = f.query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return items
    .filter((p) => {
      const hay = [
        p.title,
        p.titleOriginal ?? "",
        p.caption,
        artistFor(p.artist)?.name ?? "",
        ...p.themes,
        ...p.movements,
        ...p.languages,
      ]
        .join(" ")
        .toLocaleLowerCase();
      return (
        terms.every((t) => hay.includes(t)) &&
        (!f.format || p.formats.some((v) => v.format === f.format)) &&
        (!f.theme || p.themes.includes(f.theme)) &&
        (!f.movement || p.movements.includes(f.movement)) &&
        (!f.language || p.languages.includes(f.language)) &&
        (!f.artist || p.artist === f.artist) &&
        (!f.license || p.license === f.license) &&
        (!f.color || p.colorMode === f.color) &&
        (!f.saved || saved.includes(p.slug))
      );
    })
    .sort((a, b) =>
      f.sort === "az"
        ? a.title.localeCompare(b.title)
        : f.sort === "za"
          ? b.title.localeCompare(a.title)
          : f.sort === "oldest"
            ? a.year - b.year || a.slug.localeCompare(b.slug)
            : b.year - a.year || a.slug.localeCompare(b.slug),
    );
}
