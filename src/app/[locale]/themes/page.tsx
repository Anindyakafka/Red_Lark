import { UiText } from "@/i18n/client";
import { localizeMetadata } from "@/i18n/metadata";
import { Link } from "@/i18n/client";
import { PageIntro } from "@/components/page-intro";
import { themes, movements, publicPosters, slugify } from "@/lib/catalog";
import { pageMeta } from "@/lib/metadata";
const baseMetadata = pageMeta(
  "Themes and movements",
  "Browse posters by labor, housing, climate, migration, solidarity, ecology and accessibility, with movement context.",
  "/themes",
);
export default function Page() {
  return (
    <>
      <PageIntro
        index="05"
        title="COMMON GROUND."
        description="A way into the archive, by subject and by movement."
      />
      <div className="content-width index-grid">
        {themes.map((t) => (
          <Link className="index-card" href={`/theme/${slugify(t)}`} key={t}>
            <p className="label">
              <UiText id={"THEME /"} />
              {publicPosters.filter((p) => p.themes.includes(t)).length}
              <UiText id={"POSTERS"} />
            </p>
            <h2>{t} ↗</h2>
          </Link>
        ))}
      </div>
      <section className="content-width notice">
        <h2>
          <UiText id={"MOVEMENTS"} />
        </h2>
        <p>{movements.join(" / ")}</p>
      </section>
    </>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return localizeMetadata(baseMetadata, (await params).locale);
}
