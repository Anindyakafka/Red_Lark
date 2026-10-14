import type { MetadataRoute } from "next";
import { posters, artists, themes, slugify } from "@/lib/catalog";
import { siteUrl } from "@/lib/metadata";
export const dynamic = "force-static";
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    "",
    "/collection",
    "/discover",
    "/artists",
    "/themes",
    "/studio",
    "/community",
    "/submit",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
    ...posters.map((p) => `/poster/${p.slug}`),
    ...artists.map((a) => `/artist/${a.id}`),
    ...themes.map((t) => `/theme/${slugify(t)}`),
  ].map((p) => ({
    url: `${siteUrl}${p}/`,
    changeFrequency: "monthly",
    priority: p === "" ? 1 : 0.7,
  }));
}
