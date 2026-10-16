import { rssFeed } from "@/lib/blog.server";
import { isLocale, locales } from "@/i18n/config";
import { siteUrl } from "@/lib/metadata";
export const dynamic = "force-static";
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}
export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return new Response("Not found", { status: 404 });
  return new Response(rssFeed(locale, siteUrl), {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
