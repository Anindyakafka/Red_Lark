import { UiText } from "@/i18n/client";
import { localizeMetadata } from "@/i18n/metadata";
import { Link } from "@/i18n/client";
import { PageIntro } from "@/components/page-intro";
import { artists, posters } from "@/lib/catalog";
import { pageMeta } from "@/lib/metadata";
const baseMetadata = pageMeta(
  "Artists",
  "Meet the credited creators behind the archive. Current entries are openly labelled invented credits for original placeholder studies.",
  "/artists",
);
export default function Page() {
  return (
    <>
      <PageIntro
        index="04"
        title="CREDIT THE HANDS."
        description="Artists make the work. An archive should make their names visible."
        action="Submit artwork"
        href="/submit"
      />
      <div className="content-width index-grid">
        {artists.map((a) => (
          <article className="index-card" key={a.id}>
            <span className="label">{a.placeholder ? "PLACEHOLDER CREDIT" : "ARTIST"}</span>
            <h2>
              <Link href={`/artist/${a.id}`}>{a.name} ↗</Link>
            </h2>
            <p>{a.bio}</p>
            <p className="label">
              {posters.filter((p) => p.artist === a.id).length}
              <UiText id={"PRINT STUDIES"} />
            </p>
          </article>
        ))}
      </div>
    </>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return localizeMetadata(baseMetadata, (await params).locale);
}
