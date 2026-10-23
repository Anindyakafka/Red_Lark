import type { MetadataRoute } from "next";
import { publicPosters, publicArtists, themes, slugify } from "@/lib/catalog";
import { siteUrl } from "@/lib/metadata";
import { locales, localePath } from "@/i18n/config";
import categories from "../../content/categories.json";
import { blogPosts } from "@/lib/blog.server";
export const dynamic = "force-static";
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    "",
    "/collection",
    "/categories",
    "/blog",
    "/policies",
    "/policies/ai-policy",
    "/policies/licensing",
    "/policies/contributor-guidelines",
    "/discover",
    "/artists",
    "/themes",
    "/workshop",
    "/community",
    "/contribute",
    "/archive",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
    ...publicPosters.map((p) => `/poster/${p.slug}`),
    ...blogPosts("en").map((post) => `/blog/${post.slug}`),
    ...categories.map((c) => `/category/${c.slug}`),
    ...publicArtists.map((a) => `/artist/${a.id}`),
    ...themes.map((t) => `/theme/${slugify(t)}`),
  ].flatMap((p) =>
    locales.map((locale) => ({
      url: `${siteUrl}${localePath(locale, `${p}/`)}`,
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, `${siteUrl}${localePath(l, `${p}/`)}`]),
        ),
      },
      changeFrequency: "monthly",
      priority: p === "" ? 1 : 0.7,
    })),
  );
}
