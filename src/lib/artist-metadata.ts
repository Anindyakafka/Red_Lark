import type { Artist } from "./types";

/** Display names are not identities: multiple anonymous contributors must stay separate. */
export function artistMetadataTitle(artist: Artist, catalogue: readonly Artist[]): string {
  const duplicate = catalogue.some((other) => other.id !== artist.id && other.name === artist.name);
  // The archive ID is already public in the artist URL; never use account IDs or contact fields.
  return duplicate ? `${artist.name} / ${artist.id}` : artist.name;
}
