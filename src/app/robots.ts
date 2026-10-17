import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/metadata";
export const dynamic = "force-static";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        ...["en", "hi", "bn", "ml"].flatMap((l) => [`/${l}/admin/`, `/${l}/account/`]),
        "/admin/",
        "/account/",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
