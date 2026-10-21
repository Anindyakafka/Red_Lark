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
const result = await client.rpc("public_catalogue");
if (result.error || !Array.isArray(result.data))
  throw new Error(
    "Public catalogue fetch failed; provider details withheld. Refusing a stale rebuild.",
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
const base = "https://files.redlarkworkshop.com";
if (process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, "") !== base)
  throw new Error("Approved public file origin is missing or unexpected.");
const data = JSON.parse(fs.readFileSync("src/generated/catalog.json", "utf8")) as {
  posters: Poster[];
  artists: Artist[];
};
for (const work of result.data as PublicWork[]) {
  const policy = LICENSES[work.licence_id];
  if (!policy) throw new Error("Unreviewed published licence; build refused.");
  if (work.remixable && !policy.derivatives)
    throw new Error("Published derivative gate violation; build refused.");
  const artist: Artist = {
    id: work.artist_id,
    name: work.artist_name,
    bio: "Contributor to Red Lark Workshop.",
    links: [],
    placeholder: work.placeholder,
    ...(work.contact ? { publicContact: { value: work.contact, consented: true } } : {}),
    ...(work.upi ? { publicUpi: { value: work.upi, consented: true } } : {}),
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
    formats: work.files
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
    remixable: work.remixable,
    remixImage: work.remixable ? work.public_url : undefined,
    placeholder: work.placeholder,
    preview: work.public_preview_url,
    dominantColor: "#f3f0e6",
  };
  poster.publicContact = artist.publicContact;
  poster.publicUpi = artist.publicUpi;
  const failures = [...validateArtist(artist), ...validatePoster(poster, [artist])];
  if (failures.length)
    throw new Error(
      `Published work validation failed: ${failures.join("; ")}. Private fields withheld.`,
    );
  if (data.posters.some((p) => p.slug === poster.slug))
    throw new Error("Published slug conflicts with file-based content.");
  data.posters.push(poster);
  if (!data.artists.some((a) => a.id === artist.id)) data.artists.push(artist);
}
fs.writeFileSync("src/generated/catalog.json", JSON.stringify(data));
fs.writeFileSync("src/generated/artists.json", JSON.stringify(data.artists));
console.log(
  `Merged ${result.data.length} approved public works; private keys and owner IDs were never fetched.`,
);
