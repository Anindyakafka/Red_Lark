import fs from "node:fs";
import { createHash } from "node:crypto";
import categories from "../content/categories.json" with { type: "json" };
import formats from "../content/formats.json" with { type: "json" };
import catalogue from "../src/generated/catalog.json" with { type: "json" };
import { LICENSES } from "../src/lib/types.ts";
const literal = (value: unknown) => `'${String(value).replaceAll("'", "''")}'`;
const uuid = (slug: string) => {
  const h = createHash("sha256").update(slug).digest("hex").slice(0, 32);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20)}`;
};
const sql = [
  "-- Deterministic, original CC0 placeholders only. No hosted files are uploaded by this SQL.",
  "begin;",
  `select set_config('request.jwt.claims','{"role":"service_role"}',true);`,
];
for (const c of categories)
  sql.push(
    `insert into public.categories(slug,label) values(${literal(c.slug)},${literal(c.label)}) on conflict(slug) do update set label=excluded.label;`,
  );
for (const f of formats)
  sql.push(
    `insert into public.formats(slug,label) values(${literal(f.slug)},${literal(f.label)}) on conflict(slug) do update set label=excluded.label;`,
  );
for (const [id, l] of Object.entries(LICENSES))
  sql.push(
    `insert into public.licences(id,url,derivatives,commercial,share_alike) values(${literal(id)},${literal(l.url)},${l.derivatives},${l.commercial},${l.shareAlike}) on conflict(id) do nothing;`,
  );
for (const p of catalogue.posters) {
  if (!p.placeholder || p.license !== "CC0-1.0")
    throw new Error("Backend seed accepts original CC0 placeholders only.");
  const id = uuid(p.slug);
  sql.push(
    `insert into public.works(id,slug,title,artist_name,caption,alt,source,licence_id,remixable,format_slug,languages,translations,tags,ai_use,ai_disclosure,placeholder,status) values(${literal(id)},${literal(p.slug)},${literal(p.title)},'The Wet Ink Workshop',${literal(p.caption)},${literal(p.alt)},${literal(new URL(p.source, "https://redlarkworkshop.com").href)},'CC0-1.0',${p.remixable},${literal(p.kind)},array[${p.languages.map(literal).join(",")}],${literal(JSON.stringify(p.translations ?? {}))}::jsonb,array[${p.tags.map(literal).join(",")}]::text[],${literal(p.aiUse)},${literal(p.aiDisclosure)},true,'draft') on conflict(slug) do nothing;`,
  );
  for (const c of p.categories)
    sql.push(
      `insert into public.work_categories values(${literal(id)},${literal(c)}) on conflict do nothing;`,
    );
  for (const t of p.tags) {
    const slug = t.normalize("NFC");
    sql.push(
      `insert into public.tags values(${literal(slug)},${literal(t)}) on conflict do nothing;`,
      `insert into public.work_tags values(${literal(id)},${literal(slug)}) on conflict do nothing;`,
    );
  }
  sql.push(
    `insert into public.images(code,work_id) values(${literal(p.imageCode)},${literal(id)}) on conflict do nothing;`,
    `insert into public.captions(code,work_id,text) values(${literal(p.captionCode)},${literal(id)},${literal(p.title)}) on conflict do nothing;`,
  );
}
sql.push("commit;");
fs.writeFileSync("supabase/seed.sql", sql.join("\n") + "\n");
console.log(
  `Prepared SQL seed: ${categories.length} categories, ${formats.length} formats, ${catalogue.posters.length} draft CC0 placeholders. No remote changes or public files.`,
);
