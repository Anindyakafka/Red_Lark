import { imageDescription } from "../src/lib/contribution-metadata.ts";
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { LICENSES, type Artist, type Poster, type LicenseId } from "../src/lib/types.ts";
import { validateArtist, validatePoster } from "../src/lib/validate.ts";
try {
  process.loadEnvFile(".env.local");
} catch {
  /* CI provides scoped public build variables. */
}
if (process.env.PUBLIC_CATALOGUE_ENABLED !== "1") {
  console.log("Remote catalogue disabled; checked-in public content remains available.");
  process.exit(0);
}
const url = process.env.SUPABASE_URL,
  key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
if (!url || !key)
  throw new Error(
    "Public catalogue build variables missing; refusing a silently incomplete publication.",
  );
const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const [result, archiveResult] = await Promise.all([
  client.rpc("public_catalogue"),
  client.rpc("archive_catalogue"),
]);
if (
  result.error ||
  !Array.isArray(result.data) ||
  archiveResult.error ||
  !Array.isArray(archiveResult.data)
)
  throw new Error(
    "Public archive snapshot fetch failed; provider details withheld. Refusing a stale rebuild.",
  );
type PublicWork = {
  id: string;
  slug: string;
  title: string;
  artist_id: string;
  artist_name: string;
  caption: string;
  alt: string;
  source: string;
  licence_id: LicenseId;
  remixable: boolean;
  format_slug: string;
  languages: string[];
  translations: Poster["translations"];
  tags: string[];
  ai_use: Poster["aiUse"];
  ai_disclosure: string;
  placeholder: boolean;
  public_url: string;
  public_preview_url: string;
  created_at: string;
  contact: string;
  upi: string;
  categories: string[];
  files: {
    kind: string;
    key: string;
    mime: string;
    bytes: number;
    width: number;
    height: number;
    dpi: number;
  }[];
};
type ArchiveWork = Omit<PublicWork, "remixable" | "public_url" | "contact" | "upi" | "files"> & {
  archive_status: "archive-only";
};
const base = "https://files.redlarkworkshop.com";
if (process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, "") !== base)
  throw new Error("Approved public file origin is missing or unexpected.");
const data = JSON.parse(fs.readFileSync("src/generated/catalog.json", "utf8")) as {
  posters: Poster[];
  artists: Artist[];
};
// A deployment starts from checked-in content, but local verification may run this more than once.
// Replace the prior generated remote snapshot rather than treating it as authored file content.
data.posters = data.posters.filter((poster) => !poster.preview?.startsWith(`${base}/works/`));
const retainedArtistIds = new Set(data.posters.map((poster) => poster.artist));
data.artists = data.artists.filter((artist) => retainedArtistIds.has(artist.id));
function appendWork(work: PublicWork | ArchiveWork) {
  const archiveOnly = "archive_status" in work && work.archive_status === "archive-only";
  const liveWork = archiveOnly ? undefined : (work as PublicWork);
  const policy = LICENSES[work.licence_id];
  if (!policy) throw new Error("Unreviewed published licence; build refused.");
  if (liveWork?.remixable && !policy.derivatives)
    throw new Error("Published derivative gate violation; build refused.");
  const artist: Artist = {
    id: work.artist_id,
    name: work.artist_name,
    bio: "Contributor to Red Lark Workshop.",
    links: [],
    placeholder: work.placeholder,
    ...(liveWork?.contact ? { publicContact: { value: liveWork.contact, consented: true } } : {}),
    ...(liveWork?.upi ? { publicUpi: { value: liveWork.upi, consented: true } } : {}),
  };
  const code = work.id
    .replaceAll("-", "")
    .replace(/[0-9a-f]/g, (c) => String.fromCharCode(97 + parseInt(c, 16)));
  const poster: Poster = {
    slug: work.slug,
    title: work.title,
    caption: work.caption || work.title,
    alt: imageDescription(work),
    artist: artist.id,
    artistUrl: `/artist/${artist.id}/`,
    year: new Date(work.created_at).getUTCFullYear(),
    createdAt: work.created_at,
    categories: work.categories,
    tags: work.tags,
    kind: work.format_slug,
    imageCode: `3${code}`,
    captionCode: `4${code}`,
    aiUse: work.ai_use,
    aiDisclosure: work.ai_disclosure || `Contributor declaration: ${work.ai_use}.`,
    languages: work.languages,
    translations: work.translations,
    themes: work.categories.length ? work.categories : ["Uncategorized"],
    movements: [],
    colorMode: "color",
    region: "India",
    formats: archiveOnly
      ? []
      : liveWork!.files
          .filter((f) => f.kind !== "preview")
          .map((f) => ({
            path: `${base}/${f.key}`,
            format: f.mime === "application/pdf" ? "PDF" : "PNG",
            size: f.kind === "pdf-a2" ? "A2" : "A4",
            bytes: Number(f.bytes),
            dpi: Number(f.dpi),
            pixelWidth: f.width,
            pixelHeight: f.height,
          })),
    license: work.licence_id,
    licenseUrl: policy.url,
    allowsDerivatives: policy.derivatives,
    commercialUseAllowed: policy.commercial,
    source: work.source,
    remixable: liveWork?.remixable ?? false,
    remixImage: liveWork?.remixable ? liveWork.public_url : undefined,
    placeholder: work.placeholder,
    preview: work.public_preview_url,
    dominantColor: "#f3f0e6",
    archiveStatus: archiveOnly ? "archive-only" : "usable",
  };
  poster.publicContact = artist.publicContact;
  poster.publicUpi = artist.publicUpi;
  const failures = [...validateArtist(artist), ...validatePoster(poster, [artist])];
  if (failures.length)
    throw new Error(
      `Published work validation failed: ${failures.join("; ")}. Private fields withheld.`,
    );
  if (data.posters.some((p) => p.slug === poster.slug)) {
    if (archiveOnly) return;
    throw new Error("Published slug conflicts with file-based content.");
  }
  data.posters.push(poster);
  if (!data.artists.some((a) => a.id === artist.id)) data.artists.push(artist);
}
for (const work of result.data as PublicWork[]) appendWork(work);
for (const work of archiveResult.data as ArchiveWork[]) appendWork(work);
fs.writeFileSync("src/generated/catalog.json", JSON.stringify(data));
fs.writeFileSync("src/generated/artists.json", JSON.stringify(data.artists));
console.log(
  `Merged ${result.data.length} live works and ${archiveResult.data.length} archive-only works; private keys, owner IDs and contact fields were never fetched for archive records.`,
);
