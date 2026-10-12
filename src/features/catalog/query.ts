import type { Artwork, AssetKind } from "./types";

export function filterArtworks(items: Artwork[], kind: AssetKind, query: string, collection: string) {
  const needle = query.trim().toLocaleLowerCase();
  return items.filter(item => item.kind === kind &&
    (collection === "All" || item.collection === collection) &&
    [item.title, item.collection, ...item.tags].join(" ").toLocaleLowerCase().includes(needle));
}
