import fs from "node:fs";
import path from "node:path";
import { LICENSES, type Artist, type Poster } from "../src/lib/types";
import { validatePoster } from "../src/lib/validate";

const read = <T>(dir: string): T[] =>
  fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) as T);
const artists = read<Artist>("content/artists");
const posters = read<Poster>("content/posters");
const errors: string[] = [];
for (const artist of artists) {
  if (!artist.id || !artist.name || !artist.bio || !Array.isArray(artist.links))
    errors.push(`Invalid artist ${artist.id}`);
  for (const link of artist.links ?? [])
    if (!/^(https:\/\/|\/)/.test(link.url)) errors.push(`Unsafe artist URL ${artist.id}`);
}
for (const poster of posters) {
  errors.push(...validatePoster(poster, artists).map((e) => `${poster.slug}: ${e}`));
  for (const file of poster.formats ?? []) {
    const target = path.join("public", file.path);
    if (!fs.existsSync(target)) errors.push(`${poster.slug}: missing ${file.path}`);
    else if (fs.statSync(target).size !== file.bytes)
      errors.push(`${poster.slug}: byte size mismatch ${file.path}`);
  }
  if (poster.preview && !fs.existsSync(path.join("public", poster.preview)))
    errors.push(`${poster.slug}: missing preview`);
}
for (const [label, ids] of [
  ["poster", posters.map((p) => p.slug)],
  ["artist", artists.map((a) => a.id)],
] as const)
  if (new Set(ids).size !== ids.length) errors.push(`Duplicate ${label} identifiers`);
if (!posters.length) errors.push("Archive has no posters");
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
fs.mkdirSync("src/generated", { recursive: true });
fs.writeFileSync("src/generated/catalog.json", JSON.stringify({ posters, artists }));
if (!process.env.CONTACT_EMAIL)
  console.warn(
    "[HUMAN CONFIGURATION] CONTACT_EMAIL is unset. Contact and submission delivery are unavailable; see docs/TODO_HUMAN.md.",
  );
else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(process.env.CONTACT_EMAIL))
  throw new Error("CONTACT_EMAIL must be a real, valid mailbox address");
if (!process.env.SITE_URL || process.env.SITE_URL.includes("localhost"))
  console.warn(
    "[HUMAN CONFIGURATION] SITE_URL uses localhost. Set the production origin and rebuild before publishing.",
  );
console.log(
  `Content valid: ${posters.length} posters, ${artists.length} artists, ${Object.keys(LICENSES).length} supported licence policies.`,
);
