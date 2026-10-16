import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Header, Footer } from "@/components/shell";
import { BrowseCTA } from "@/components/preferences";
import { siteUrl } from "@/lib/metadata";
import "./globals.css";
const display = localFont({
  src: "../../public/fonts/display.woff2",
  variable: "--font-display",
  display: "swap",
  fallback: ["Impact", "Arial Narrow", "Arial", "sans-serif"],
});
const mono = localFont({
  src: "../../public/fonts/mono.woff2",
  variable: "--font-mono",
  display: "swap",
  fallback: ["Courier New", "Courier", "monospace"],
});
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Red Lark Workshop | Free protest posters",
    template: "%s | Red Lark Workshop",
  },
  description:
    "Find an original protest poster, read its licence, download a print file, or make your own in a private browser-only Studio.",
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
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`}>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Header />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <Footer />
        <BrowseCTA />
      </body>
    </html>
  );
}
