import Image from "next/image";
import NextLink from "next/link";
import { Collection } from "@/components/archive";
import { LandingBlocks, type LandingCopy } from "@/components/landing-copy";
import { LanguageSwitcher, UiText } from "@/i18n/client";
import { isLocale, type Locale } from "@/i18n/config";
import { localizeMetadata } from "@/i18n/metadata";
import { posters } from "@/lib/catalog";
import { pageMeta } from "@/lib/metadata";
import en from "../../../content/copy/landing.en.json";
import hi from "../../../content/copy/landing.hi.json";
import bn from "../../../content/copy/landing.bn.json";
import ml from "../../../content/copy/landing.ml.json";
import categories from "../../../content/categories.json";
import formats from "../../../content/formats.json";
const copies: Record<Locale, LandingCopy> = { en, hi, bn, ml };
const baseMetadata = pageMeta(
  "Free political graphics / India",
  "RED LARK WORKSHOP: a multilingual archive and workshop of free political graphics for movements in India. Browse, print and create.",
  "/",
);
export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const language = (await params).locale;
  const locale = isLocale(language) ? language : "en";
  const copy = copies[locale];
  return (
    <>
      <section className="redlark-hero">
        <div className="hero-heading">
          <p className="label">[ARCHIVE / WORKSHOP / INDIA]</p>
          <h1>
            RED LARK
            <br />
            <span>WORKSHOP</span>
          </h1>
          <div className="hero-ctas">
            <NextLink prefetch={false} className="button accent" href={`/${locale}/collection/`}>
              <UiText id="Browse collection" /> ↗
            </NextLink>
            <NextLink prefetch={false} className="button" href={`/${locale}/studio/`}>
              <UiText id="Open Studio" /> ↗
            </NextLink>
          </div>
        </div>
        <div className="poster-wall" aria-label="Original CC0 placeholder studies">
          {[posters[0], posters[7], posters[12]].map((p, i) => (
            <NextLink
              prefetch={false}
              className={`wall-print wall-print-${i}`}
              href={`/${locale}/poster/${p.slug}/`}
              key={p.slug}
              aria-label={p.title}
            >
              <Image
                src={p.preview}
                alt={p.alt}
                width={400}
                height={566}
                sizes="(max-width: 700px) 48vw, 25vw"
                priority={i === 0}
              />
            </NextLink>
          ))}
          <span className="wall-caption">[CC0 PLACEHOLDER STUDIES / 2026]</span>
        </div>
      </section>
      <LandingBlocks copy={copy} locale={locale} />
      <section className="landing-controls" id="archive-search">
        <form
          role="search"
          aria-labelledby="landing-search-label"
          action={`/${locale}/collection/`}
        >
          <label htmlFor="landing-search" id="landing-search-label">
            {copy.searchLabel}
          </label>
          <div className="landing-search-row">
            <input
              type="search"
              id="landing-search"
              name="q"
              maxLength={150}
              placeholder={locale === "en" ? "Words, artists, languages…" : undefined}
            />
            <button type="submit">
              <UiText id="Search" /> ↗
            </button>
          </div>
        </form>
        <LanguageSwitcher landing />
      </section>
      <section className="landing-taxonomy">
        <div className="section-heading">
          <p className="label">[STEP 2]</p>
          <h2>
            <UiText id="Categories" />
          </h2>
          <NextLink prefetch={false} href={`/${locale}/collection/`}>
            ALL (Uncategorized) ↗
          </NextLink>
        </div>
        <div className="category-grid">
          {categories.map((c, i) => (
            <NextLink prefetch={false} href={`/${locale}/category/${c.slug}/`} key={c.slug}>
              <span>[{String(i + 1).padStart(2, "0")}]</span>
              <span className="category-label">{c.label}</span>
              <span aria-hidden="true">↗</span>
            </NextLink>
          ))}
        </div>
      </section>
      <section className="landing-formats">
        <div className="section-heading">
          <p className="label">[STEP 3]</p>
          <h2>
            <UiText id="Choose format" />
          </h2>
        </div>
        <div className="format-grid">
          {formats.map((f, i) => (
            <NextLink prefetch={false} href={`/${locale}/collection/?kind=${f.slug}`} key={f.slug}>
              <span>[{String(i + 1).padStart(2, "0")}]</span>
              <strong>
                {f.label.includes("/") ? (
                  <>
                    {f.label.split("/")[0]}/<wbr />
                    {f.label.split("/")[1]}
                  </>
                ) : (
                  f.label
                )}
              </strong>
              <span aria-hidden="true">↗</span>
            </NextLink>
          ))}
        </div>
        <div className="format-actions">
          <NextLink prefetch={false} className="button accent" href={`/${locale}/studio/`}>
            <UiText id="CREATE YOUR OWN CAMPAIGN MATERIAL" /> ↗
          </NextLink>
          <NextLink prefetch={false} className="button" href={`/${locale}/submit/`}>
            <UiText id="UPLOAD YOUR OWN ART AND DESIGN" /> ↗
          </NextLink>
        </div>
      </section>
      <Collection posters={posters} />
    </>
  );
}
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return localizeMetadata(baseMetadata, (await params).locale);
}
