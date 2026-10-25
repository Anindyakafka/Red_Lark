import Image from "next/image";
import NextLink from "next/link";
import { Collection } from "@/components/archive";
import { UiText } from "@/i18n/client";
import { isLocale } from "@/i18n/config";
import { localizeMetadata } from "@/i18n/metadata";
import { publicPosters } from "@/lib/catalog";
import { landingCopy } from "@/lib/landing-copy";
import { pageMeta } from "@/lib/metadata";

const baseMetadata = pageMeta(
  "Free political graphics / India",
  "RED LARK WORKSHOP: a multilingual archive and Workshop of free political graphics for movements in India. Browse, print and contribute.",
  "/",
);

const heroPosterSlugs = [
  "work-0ed79c2c-db5b-4d3f-b9a5-fa82d55586da", // USUPPER
  "work-66f6b915-70ab-4554-a4de-5d667ceaa422", // The Everpresent
  "work-4b74636c-1685-4d15-8c88-49a6482a1a94", // choke
];

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const language = (await params).locale;
  const locale = isLocale(language) ? language : "en";
  const copy = landingCopy(locale);
  const heroPosters = heroPosterSlugs.flatMap((slug) => {
    const poster = publicPosters.find((item) => item.slug === slug && !item.placeholder);
    return poster ? [poster] : [];
  });
  const preview = publicPosters
    .filter((poster) => (poster.archiveStatus || "usable") === "usable")
    .sort((a, b) => (b.createdAt || String(b.year)).localeCompare(a.createdAt || String(a.year)))
    .slice(0, 10);
  return (
    <>
      <section className="redlark-hero">
        <div className="hero-heading">
          <p className="label">ARCHIVE / WORKSHOP / INDIA</p>
          <h1>
            RED LARK
            <br />
            <span>WORKSHOP</span>
          </h1>
          <div className="hero-ctas">
            <NextLink prefetch={false} className="button accent" href={`/${locale}/collection/`}>
              <UiText id="Browse collection" />
            </NextLink>
            <NextLink prefetch={false} className="button" href={`/${locale}/workshop/`}>
              <UiText id="Open Workshop" />
            </NextLink>
            <NextLink prefetch={false} className="button" href={`/${locale}/contribute/`}>
              <UiText id="Contribute" />
            </NextLink>
          </div>
        </div>
        <div className="poster-wall" aria-label="Featured posters from the collection">
          {heroPosters.map((poster, index) => (
            <NextLink
              prefetch={false}
              className={`wall-print wall-print-${index}`}
              href={`/${locale}/poster/${poster.slug}/`}
              key={poster.slug}
              aria-label={poster.title}
            >
              <Image
                src={poster.preview}
                alt={poster.alt}
                width={400}
                height={566}
                sizes="(max-width: 700px) 48vw, 25vw"
                priority={index === 0}
              />
            </NextLink>
          ))}
          <span className="wall-caption">FEATURED FROM THE COLLECTION</span>
        </div>
      </section>
      <section className="prose landing-about">
        <p className="label">ABOUT</p>
        <div className="landing-about-content">
          <p data-copy="about">{copy.about}</p>
          <NextLink prefetch={false} className="landing-about-link" href={`/${locale}/about/`}>
            <UiText id="Learn more about us" />
          </NextLink>
        </div>
      </section>
      <section className="landing-preview">
        <div className="landing-preview-heading">
          <h2>
            <UiText id="COLLECTION" />
          </h2>
        </div>
        <Collection posters={preview} compact />
        <NextLink prefetch={false} className="button accent" href={`/${locale}/collection/`}>
          <UiText id="See more" />
        </NextLink>
      </section>
    </>
  );
}
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return localizeMetadata(baseMetadata, (await params).locale);
}
