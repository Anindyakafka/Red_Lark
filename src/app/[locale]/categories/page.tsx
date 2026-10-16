import categories from "../../../../content/categories.json";
import { PageIntro } from "@/components/page-intro";
import { Link, UiText } from "@/i18n/client";
import { posters } from "@/lib/catalog";
import { pageMeta } from "@/lib/metadata";
import { localizeMetadata } from "@/i18n/metadata";
export default function Categories() {
  return (
    <>
      <PageIntro
        index="CATEGORIES"
        title="Categories"
        description="Find political graphics by subject. A work can belong to more than one category."
      />
      <section className="landing-taxonomy">
        <Link className="button" href="/collection">
          <UiText id="ALL (Uncategorized)" />
        </Link>
        <div className="category-grid">
          {categories.map((category, index) => (
            <Link key={category.slug} href={`/category/${category.slug}/`}>
              <span>[{String(index + 1).padStart(2, "0")}]</span>
              <span className="category-label">{category.label}</span>
              <span>
                {posters.filter((poster) => poster.categories.includes(category.slug)).length}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return localizeMetadata(
    pageMeta(
      "Categories",
      "Explore 28 subjects in the free political graphics archive. Filter by format, language and artist.",
      "/categories",
    ),
    (await params).locale,
  );
}
