import type { Metadata } from "next";
export const siteUrl = (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
export function pageMeta(
  title: string,
  description: string,
  path: string,
  image = "/og-default.png",
): Metadata {
  return {
    title,
    description,
    alternates: { canonical: `${siteUrl}${path === "/" ? "/" : `${path}/`}` },
    openGraph: {
      title: `${title} | Mirafra`,
      description,
      url: `${siteUrl}${path === "/" ? "/" : `${path}/`}`,
      type: "website",
      images: [{ url: image, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Mirafra`,
      description,
      images: [image],
    },
  };
}
