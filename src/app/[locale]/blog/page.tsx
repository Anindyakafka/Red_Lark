import { PageIntro } from "@/components/page-intro";
import { UiText } from "@/i18n/client";
import { pageMeta } from "@/lib/metadata";
import { localizeMetadata } from "@/i18n/metadata";
export default function Blog() {
  return (
    <>
      <PageIntro
        index="BLOG"
        title="Notes from the workshop"
        description="Printing, distribution and conversations with artists. Editorial content is being prepared."
      />
      <section className="prose">
        <p>
          <UiText id="[EDITORIAL PLACEHOLDERS] Draft posts are being prepared; no artist interview has been published." />
        </p>
      </section>
    </>
  );
}
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return localizeMetadata(
    pageMeta(
      "Workshop blog",
      "Notes on printing, distribution and political graphics. Editorial placeholders are clearly marked.",
      "/blog",
    ),
    (await params).locale,
  );
}
