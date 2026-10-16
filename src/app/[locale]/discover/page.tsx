import { UiText } from "@/i18n/client";
import { localizeMetadata } from "@/i18n/metadata";
import { Link } from "@/i18n/client";
import { PageIntro } from "@/components/page-intro";
import { PosterImage } from "@/components/poster-image";
import { posters, movements, slugify } from "@/lib/catalog";
import { pageMeta } from "@/lib/metadata";
const baseMetadata = pageMeta(
  "Discover",
  "Find original poster studies through curated movement and language selections. Explore solidarity, climate justice, labor and public space.",
  "/discover",
);
export default function Page() {
  return (
    <>
      <PageIntro
        index="03"
        title="FIND YOUR THREAD."
        description="By movement. By language. By a little curiosity."
      />
      <div className="content-width">
        {movements.slice(0, 3).map((m) => (
          <section className="discover-rail" key={m}>
            <div className="rail-heading">
              <h2>{m}</h2>
              <Link
                href={`/theme/${slugify(posters.find((p) => p.movements.includes(m))!.themes[0])}`}
              >
                <UiText id={"[EXPLORE] ↗"} />
              </Link>
            </div>
            <div className="rail-grid">
              {posters
                .filter((p) => p.movements.includes(m))
                .slice(0, 3)
                .map((p) => (
                  <Link href={`/poster/${p.slug}`} key={p.slug}>
                    <PosterImage poster={p} />
                    <h3>{p.title}</h3>
                    <p className="small">
                      {p.languages.join(" / ")} / {p.license} /{" "}
                      {p.placeholder ? "PLACEHOLDER" : "PUBLISHED"}
                    </p>
                  </Link>
                ))}
            </div>
          </section>
        ))}
        <section className="notice">
          <h2>
            <UiText id={"WORDS TRAVEL."} />
          </h2>
          <p>
            <UiText
              id={
                "Original-language titles sit beside English titles. Explore the Spanish and French placeholder studies in the collection’s language filter."
              }
            />
          </p>
          <Link className="button" href="/collection">
            <UiText id={"[BROWSE LANGUAGES] ↗"} />
          </Link>
        </section>
        <section className="notice">
          <h2>
            <UiText id={"[PRINT + TYPE KITS]"} />
          </h2>
          <p>
            <UiText
              id={
                "Each poster detail page offers a graphics ZIP with a vector source, A3 PDF and licence file. The local type kit contains Bebas Neue and IBM Plex Mono with their original open font licences."
              }
            />
          </p>
          <a className="button accent" href="/bundles/redlark-type-kit.zip" download>
            <UiText id={"[DOWNLOAD FONT PACK / OFL] ↓"} />
          </a>
        </section>
      </div>
    </>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return localizeMetadata(baseMetadata, (await params).locale);
}
