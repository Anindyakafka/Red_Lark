import { UiText } from "@/i18n/client";
import { localizeMetadata } from "@/i18n/metadata";
import { Link } from "@/i18n/client";
import { PageIntro } from "@/components/page-intro";
import { pageMeta } from "@/lib/metadata";
import curated from "../../../../content/community.json" with { type: "json" };
import { posters } from "@/lib/catalog";
import { Collection } from "@/components/archive";
const baseMetadata = pageMeta(
  "Community",
  "A curated gallery for reviewed Workshop-made posters. Upload your work privately without an account for human review.",
  "/community",
);
export default function Page() {
  return (
    <>
      <PageIntro
        index="09"
        title="A WALL WE SHARE."
        description="A curated gallery for Workshop-made prints, with consent, credit and context."
        action="Submit a creation"
        href="/contribute"
      />
      {curated.length ? (
        <Collection
          posters={posters.filter((p) => (curated as string[]).includes(p.slug))}
          heading="REVIEWED COMMUNITY PRINTS"
        />
      ) : (
        <section className="content-width empty-state">
          <p className="label">
            <UiText id={"NO REVIEWED SUBMISSIONS YET"} />
          </p>
          <h2>
            <UiText id={"YOUR WORK COULD GO HERE."} />
          </h2>
          <p>
            <UiText
              id={"No invented community posts. Make a print, then propose it for human review."}
            />
          </p>
          <Link className="button" href="/workshop" prefetch={false}>
            <UiText id={"MAKE A POSTER ↗"} />
          </Link>
        </section>
      )}
    </>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return localizeMetadata(baseMetadata, (await params).locale);
}
