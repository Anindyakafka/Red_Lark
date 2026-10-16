import { UiText } from "@/i18n/client";
import { localizeMetadata } from "@/i18n/metadata";
import { Link } from "@/i18n/client";
import { notFound } from "next/navigation";
import { posters, posterFor, artistFor, fileSize } from "@/lib/catalog";
import { pageMeta } from "@/lib/metadata";
import { PosterImage } from "@/components/poster-image";
import { LicenseGate } from "@/components/license-gate";
import { Download } from "@/components/download";
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
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const p = posterFor((await params).slug);
  if (!p) notFound();
  const artist = artistFor(p.artist);
  return (
    <article className="poster-detail">
      <header className="mobile-poster-intro">
        <p className="label">
          <UiText id={"[POSTER /"} />
          {p.placeholder ? "PLACEHOLDER" : "PUBLISHED"} / {p.license}]
        </p>
        <p className="mobile-poster-title">{p.titleOriginal ?? p.title}</p>
        <a href="#downloads" className="button accent">
          <UiText id={"[DOWNLOAD PRINT FILES] ↓"} />
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
          [{p.placeholder ? "PLACEHOLDER" : "PUBLISHED"}] / {p.year} / {p.languages.join(" / ")}
        </p>
        <h1 className="desktop-poster-title">{p.titleOriginal ?? p.title}</h1>
        {p.titleOriginal && <p className="detail-translation">{p.title}</p>}
        <p>
          <UiText id={"BY"} />{" "}
          <Link href={`/artist/${artist.id}`} className="underlined">
            {artist.name}
          </Link>
        </p>
        <p>{p.caption}</p>
        <LicenseGate poster={p} />
        <section className="downloads" id="downloads">
          <h2>
            <UiText id={"[DOWNLOAD]"} />
          </h2>
          <p className="small">
            <UiText
              id={
                "RGB print files. Correct physical size, outlined type. No bleed. Choose “actual size” when printing."
              }
            />
          </p>
          {p.formats.map((f) => (
            <Download key={f.path} href={f.path}>
              {f.size} / {f.format} <span>{fileSize(f.bytes)} ↓</span>
            </Download>
          ))}
        </section>
        <section className="license-block">
          <h2>
            <UiText id={"[LICENSE]"} />
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
    </article>
  );
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  return localizeMetadata(await baseGenerateMetadata(props), (await props.params).locale);
}
