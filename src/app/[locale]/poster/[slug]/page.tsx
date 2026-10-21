import { UiText } from "@/i18n/client";
import { localizeMetadata } from "@/i18n/metadata";
import { Link } from "@/i18n/client";
import { notFound } from "next/navigation";
import { posters, posterFor, artistFor, fileSize } from "@/lib/catalog";
import { pageMeta } from "@/lib/metadata";
import { PosterImage } from "@/components/poster-image";
import { LicenseGate } from "@/components/license-gate";
import { Download } from "@/components/download";
import { ArtistContact } from "@/components/artist-contact";
import { PrintInstructions } from "@/components/print-instructions";
import { isLocale } from "@/i18n/config";
import categories from "../../../../../content/categories.json";
export const dynamicParams = false;
export function generateStaticParams() {
  return posters.map((p) => ({ slug: p.slug }));
}
async function baseGenerateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const p = posterFor((await params).slug);
  return p
    ? pageMeta(
        p.title,
        `${p.title} by ${artistFor(p.artist).name}. ${p.languages.join(", ")} print files, ${p.license}. ${p.caption}`,
        `/poster/${p.slug}`,
        p.preview.replace("preview.webp", "og.png"),
      )
    : pageMeta("Poster not found", "This poster is not in the archive.", "/404");
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale: language } = await params;
  const locale = isLocale(language) ? language : "en";
  const p = posterFor(slug);
  if (!p) notFound();
  const artist = artistFor(p.artist);
  return (
    <article className="poster-detail">
      <header className="mobile-poster-intro">
        <p className="label">
          <UiText id={"POSTER /"} />
          {p.placeholder ? "PLACEHOLDER" : "PUBLISHED"} / {p.license}
        </p>
        <p className="mobile-poster-title">{p.titleOriginal ?? p.title}</p>
        <a href="#downloads" className="button accent">
          <UiText id={"DOWNLOAD FOR FREE"} /> ↓
        </a>
      </header>
      <div className="detail-art">
        <PosterImage poster={p} priority large />
      </div>
      <div className="detail-copy">
        <Link href="/collection" className="label">
          <UiText id={"← COLLECTION"} />
        </Link>
        <p className="label">
          {p.placeholder ? "PLACEHOLDER" : "PUBLISHED"} / {p.year} / {p.languages.join(" / ")}
        </p>
        <h1 className="desktop-poster-title">{p.titleOriginal ?? p.title}</h1>
        {p.titleOriginal && <p className="detail-translation">{p.title}</p>}
        <a className="button accent desktop-download-cta" href="#downloads">
          <UiText id="DOWNLOAD FOR FREE" /> ↓
        </a>
        <p>
          <UiText id={"BY"} />{" "}
          <Link href={`/artist/${artist.id}`} className="underlined">
            {artist.name}
          </Link>
        </p>
        <p>{p.caption}</p>
        {Object.values(p.translations ?? {}).some((translation) => !translation.reviewed) && (
          <p className="notice">
            <UiText id="DRAFT TRANSLATION — NEEDS NATIVE REVIEW" />
          </p>
        )}
        <dl className="work-specifications">
          <div>
            <dt>
              <UiText id="Image Code" />
            </dt>
            <dd>{p.imageCode}</dd>
          </div>
          <div>
            <dt>
              <UiText id="Caption Code" />
            </dt>
            <dd>{p.captionCode}</dd>
          </div>
          <div>
            <dt>
              <UiText id="Format" />
            </dt>
            <dd>{[...new Set(p.formats.map((file) => file.format))].join(" / ")}</dd>
          </div>
          <div>
            <dt>
              <UiText id="Size" />
            </dt>
            <dd>
              {[
                ...new Set(
                  p.formats.filter((file) => file.size !== "Bundle").map((file) => file.size),
                ),
              ].join(" / ")}
            </dd>
          </div>
          <div>
            <dt>
              <UiText id="Resolution" />
            </dt>
            <dd>
              {[...new Set(p.formats.flatMap((file) => (file.dpi ? [file.dpi] : [])))].join(" / ")}{" "}
              DPI{" "}
              <UiText
                id={
                  p.preview.startsWith("https://files.redlarkworkshop.com/")
                    ? "estimated at the stated print size; raster artwork remains raster inside a PDF"
                    : "where specified; PDF and SVG are vectors"
                }
              />
            </dd>
          </div>
          <div>
            <dt>
              <UiText id="Artist" />
            </dt>
            <dd>{artist.name}</dd>
          </div>
        </dl>
        <section className="ai-disclosure" data-ai-use={p.aiUse}>
          <h2>
            <UiText id="AI-use disclosure" />
          </h2>
          <p>
            <strong>{p.aiUse.toUpperCase()}</strong> {p.aiDisclosure}
          </p>
        </section>
        <ArtistContact
          artist={
            p.preview.startsWith("https://files.redlarkworkshop.com/")
              ? { ...artist, publicContact: p.publicContact, publicUpi: p.publicUpi }
              : artist
          }
        />
        <LicenseGate poster={p} />
        <section className="downloads" id="downloads">
          <h2>
            <UiText id={"DOWNLOAD FOR FREE"} />
          </h2>
          <p className="small">
            <UiText
              id={
                p.preview.startsWith("https://files.redlarkworkshop.com/")
                  ? "Uploaded raster artwork; A4/A2 PDFs have fixed paper sizes. Use the stated resolution estimate to judge print quality. Exporting a larger file cannot add image detail."
                  : "RGB print files. Correct physical size, outlined type. No bleed. Choose “actual size” when printing."
              }
            />
          </p>
          {p.formats.map((f) => (
            <Download key={f.path} href={f.path}>
              {f.size} / {f.format}{" "}
              <span>
                {f.dpi ? `${f.dpi} DPI / ` : ""}
                {fileSize(f.bytes)} ↓
              </span>
            </Download>
          ))}
        </section>
        <PrintInstructions locale={locale} />
        <section className="work-tags">
          <h2>
            <UiText id="Tags" />
          </h2>
          <p>{p.tags.join(" / ")}</p>
          {p.categories.map((category) => (
            <Link className="underlined" key={category} href={`/category/${category}/`}>
              {categories.find((item) => item.slug === category)?.label ?? category}
            </Link>
          ))}
        </section>
        <section className="license-block">
          <h2>
            <UiText id={"LICENSE"} />
          </h2>
          <p>
            <a href={p.licenseUrl} rel="noreferrer" className="underlined">
              {p.license} ↗
            </a>
          </p>
          <p>
            {p.allowsDerivatives ? "Derivatives permitted." : "Derivatives prohibited."}{" "}
            {p.commercialUseAllowed
              ? "Commercial reuse permitted under this licence."
              : "Non-commercial use only."}
          </p>
          <p>
            <UiText id={"Credit:"} />
            {artist.name}.{" "}
            <a href={p.source} className="underlined">
              <UiText id={"Source ↗"} />
            </a>
          </p>
          <p>
            <UiText id={"Support artists directly:"} />{" "}
            {artist.supportUrl ? (
              <a href={artist.supportUrl} rel="noreferrer">
                <UiText id={"artist support link ↗"} />
              </a>
            ) : (
              "This is an invented placeholder credit; no donation link is available."
            )}
          </p>
          <Link className="underlined" href="/submit">
            <UiText id={"Send us how you used it / propose a contribution ↗"} />
          </Link>
        </section>
      </div>
      <section className="more-by-artist">
        <h2>
          <UiText id="More by the artist" />
        </h2>
        <div className="rail-grid">
          {posters
            .filter((work) => work.artist === artist.id && work.slug !== p.slug)
            .slice(0, 4)
            .map((work) => (
              <Link key={work.slug} href={`/poster/${work.slug}/`}>
                <PosterImage poster={work} />
                <h3>{work.titleOriginal ?? work.title}</h3>
                {work.titleOriginal && <p>{work.title}</p>}
              </Link>
            ))}
        </div>
        <Link className="button" href={`/artist/${artist.id}/`}>
          <UiText id="More by the artist" /> ↗
        </Link>
      </section>
    </article>
  );
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  return localizeMetadata(await baseGenerateMetadata(props), (await props.params).locale);
}
