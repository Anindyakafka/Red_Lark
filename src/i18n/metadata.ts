import type { Metadata } from "next";
import { siteUrl } from "../lib/metadata";
import { isLocale, languageNames, locales, localePath } from "./config";
export function localizeMetadata(base: Metadata, language: string): Metadata {
  const locale = isLocale(language) ? language : "en";
  const canonical = String(base.alternates?.canonical ?? `${siteUrl}/`);
  const path = new URL(canonical, siteUrl).pathname;
  const title = typeof base.title === "string" ? base.title : "RED LARK WORKSHOP";
  const label = locale === "en" ? title : `${languageNames[locale]} / ${title}`;
  const url = `${siteUrl}${localePath(locale, path)}`;
  const description =
    locale === "en" ? base.description : `${languageNames[locale]} — ${base.description}`;
  return {
    ...base,
    title: label,
    description,
    alternates: {
      canonical: url,
      languages: Object.fromEntries(locales.map((l) => [l, `${siteUrl}${localePath(l, path)}`])),
    },
    openGraph: {
      ...base.openGraph,
      title: `${label} | RED LARK WORKSHOP`,
      description: description ?? undefined,
      url,
      locale: { en: "en_IN", hi: "hi_IN", bn: "bn_IN", ml: "ml_IN" }[locale],
    },
    twitter: {
      ...base.twitter,
      title: `${label} | RED LARK WORKSHOP`,
      description: description ?? undefined,
    },
  };
}
