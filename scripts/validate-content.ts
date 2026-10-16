import fs from "node:fs";
import path from "node:path";
import { LICENSES, type Artist, type Poster } from "../src/lib/types";
import { validatePoster, validateArtist } from "../src/lib/validate";
import { resolveSiteOrigin } from "../src/lib/site-origin";
import { CONTACT_EMAIL } from "../src/config/site";
import images from "../content/studio/images.json";
import captions from "../content/studio/captions.json";
import { canRemix } from "../src/lib/licenses";
if (fs.existsSync(".env.local")) process.loadEnvFile(".env.local");

const read = <T>(dir: string): T[] =>
  fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) as T);
const artists = read<Artist>("content/artists");
const posters = read<Poster>("content/posters");
const community: unknown = JSON.parse(fs.readFileSync("content/community.json", "utf8"));
const errors: string[] = [];
for (const artist of artists) {
  errors.push(...validateArtist(artist).map((error) => `${artist.id}: ${error}`));
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
  for (const w of [240, 400, 700])
    for (const format of ["webp", "avif"])
      if (
        !fs.existsSync(
          path.join("public", poster.preview.replace("preview.webp", `preview-${w}.${format}`)),
        )
      )
        errors.push(`${poster.slug}: missing responsive preview ${w}.${format}`);
}
for (const [label, ids] of [
  ["poster", posters.map((p) => p.slug)],
  ["artist", artists.map((a) => a.id)],
] as const)
  if (new Set(ids).size !== ids.length) errors.push(`Duplicate ${label} identifiers`);
if (!posters.length) errors.push("Archive has no posters");
for (const assets of [images, captions]) {
  if (new Set(assets.map((asset) => asset.code)).size !== assets.length)
    errors.push("Duplicate Studio library code");
  for (const asset of assets) {
    const poster = posters.find((poster) => poster.slug === asset.workSlug);
    if (!poster || !canRemix(poster))
      errors.push(`Studio asset ${asset.code} lacks a remix-eligible source`);
    else if ("layerIds" in asset) {
      if (
        asset.code !== poster.imageCode ||
        !asset.layerIds.length ||
        asset.layerIds.some(
          (id) =>
            !poster.studioLayers?.layers.some((layer) => layer.id === id && layer.kind !== "text"),
        )
      )
        errors.push(`Invalid image library entry ${asset.code}`);
    } else if (asset.code !== poster.captionCode || !asset.text.trim())
      errors.push(`Invalid caption library entry ${asset.code}`);
  }
}
if (
  !Array.isArray(community) ||
  !community.every(
    (slug) => typeof slug === "string" && posters.some((p) => p.slug === slug && !p.placeholder),
  )
)
  errors.push("Community curation must list approved non-placeholder poster slugs only.");
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
fs.mkdirSync("src/generated", { recursive: true });
fs.writeFileSync("src/generated/catalog.json", JSON.stringify({ posters, artists }));
fs.writeFileSync("src/generated/artists.json", JSON.stringify(artists));
if (!CONTACT_EMAIL)
  console.warn(
    "[HUMAN CONFIGURATION] CONTACT_EMAIL is unset. Contact and submission delivery are unavailable; see docs/TODO_HUMAN.md.",
  );
else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(CONTACT_EMAIL))
  throw new Error("CONTACT_EMAIL must be a real, valid mailbox address");
if (new URL(resolveSiteOrigin(process.env)).hostname === "localhost")
  console.warn(
    "[HUMAN CONFIGURATION] Site origin uses localhost. Set SITE_URL or build on Netlify to use its deployment URL before publishing.",
  );
console.log(
  `Content valid: ${posters.length} posters, ${artists.length} artists, ${Object.keys(LICENSES).length} supported licence policies.`,
);
