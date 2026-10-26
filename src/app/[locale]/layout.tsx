import { Link } from "@/i18n/client";
import { existsSync } from "node:fs";
import path from "node:path";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Header, Footer } from "@/components/shell";
import { BrowseCTA } from "@/components/preferences";
import { siteUrl } from "@/lib/metadata";
import "@fontsource-variable/kode-mono/wght.css";
import "../globals.css";
import { LocaleProvider, UiText } from "@/i18n/client";
import { isLocale } from "@/i18n/config";
import { localeMessages } from "@/i18n/messages";
const display = localFont({
  src: "../../../public/fonts/display.woff2",
  variable: "--font-display",
  display: "swap",
  fallback: ["Impact", "Arial Narrow", "Arial", "sans-serif"],
});
const mono = localFont({
  src: "../../../public/fonts/mono.woff2",
  variable: "--font-mono",
  // Read controls immediately with the full fallback stack on slow first visits;
  // avoid a late body-font swap repainting the collection's licensing note.
  display: "optional",
  preload: false,
  adjustFontFallback: false,
  fallback: ["Courier New", "Courier", "monospace"],
});
const licensedBengaliFont = existsSync(path.resolve("public/fonts/licensed/bengali-regular.ttf"));
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Red Lark Workshop | Free protest posters",
    template: "%s | Red Lark Workshop",
  },
  description:
    "Find an original protest poster, read its licence, download a print file, or make your own in a private browser-only Workshop.",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icons/mark.svg", type: "image/svg+xml" },
      { url: "/icons/icon-16.png", sizes: "16x16" },
      { url: "/icons/icon-32.png", sizes: "32x32" },
    ],
    apple: [{ url: "/icons/icon-180.png", sizes: "180x180" }],
  },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f0e6" },
    { media: "(prefers-color-scheme: dark)", color: "#151515" },
  ],
};
export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale?: string }>;
}) {
  const language = (await params).locale ?? "en";
  const locale = isLocale(language) ? language : "en";
  return (
    <html
      lang={locale}
      className={`${display.variable} ${mono.variable}${licensedBengaliFont ? " licensed-bengali" : ""}`}
    >
      <head>
        <link
          rel="alternate"
          type="application/rss+xml"
          title="RED LARK WORKSHOP notes"
          href={`/${locale}/feed.xml`}
        />
        {["devanagari", "bengali", "malayalam"]
          .filter(
            (script) =>
              !(script === "bengali" && licensedBengaliFont) &&
              script !==
                ({ hi: "devanagari", bn: "bengali", ml: "malayalam" } as Record<string, string>)[
                  locale
                ],
          )
          .map((script) => (
            <link
              key={script}
              rel="preload"
              as="font"
              type="font/woff2"
              crossOrigin="anonymous"
              href={`/fonts/indic/noto-sans-${script}-nav.woff2`}
            />
          ))}
        {locale === "bn" && licensedBengaliFont && (
          <link
            rel="preload"
            as="font"
            type="font/ttf"
            crossOrigin="anonymous"
            href="/fonts/licensed/bengali-regular.ttf"
          />
        )}
        {locale !== "en" && !(locale === "bn" && licensedBengaliFont) && (
          <link
            rel="preload"
            as="font"
            type="font/woff2"
            crossOrigin="anonymous"
            href={`/fonts/indic/noto-sans-${{ hi: "devanagari", bn: "bengali", ml: "malayalam" }[locale]}-ui.woff2`}
          />
        )}
      </head>
      <body>
        <LocaleProvider locale={locale} strings={localeMessages(locale).strings}>
          <a className="skip-link" href="#main">
            <UiText id="Skip to content" />
          </a>
          <Header />
          {locale !== "en" && (
            <aside
              className="translation-notice"
              lang="en"
              aria-labelledby="translation-notice-label"
            >
              <span id="translation-notice-label" className="sr-only">
                <UiText id="Translation review notice" />
              </span>
              <UiText
                id={
                  "DRAFT TRANSLATION — NEEDS NATIVE REVIEW Untranslated interface text falls back to English."
                }
              />
              <Link href="/en/">
                <UiText id={"Read canonical English"} />
              </Link>
              .
            </aside>
          )}
          <main id="main" tabIndex={-1}>
            {children}
          </main>
          <Footer />
          <BrowseCTA />
        </LocaleProvider>
      </body>
    </html>
  );
}

export const dynamicParams = false;
export function generateStaticParams() {
  return ["en", "hi", "bn", "ml"].map((locale) => ({ locale }));
}
