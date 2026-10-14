import Link from "next/link";
import { PageIntro } from "@/components/page-intro";
import { themes, movements, posters, slugify } from "@/lib/catalog";
import { pageMeta } from "@/lib/metadata";
export const metadata = pageMeta(
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
              [THEME] / {posters.filter((p) => p.themes.includes(t)).length} POSTERS
            </p>
            <h2>{t} ↗</h2>
          </Link>
        ))}
      </div>
      <section className="content-width notice">
        <h2>[MOVEMENTS]</h2>
        <p>{movements.join(" / ")}</p>
      </section>
    </>
  );
}
