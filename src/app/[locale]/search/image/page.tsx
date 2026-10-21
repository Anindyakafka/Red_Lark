import { UiText } from "@/i18n/client";
import { localizeMetadata } from "@/i18n/metadata";
import { PageIntro } from "@/components/page-intro";
import { pageMeta } from "@/lib/metadata";
const baseMetadata = pageMeta(
  "Image search — coming soon",
  "Image search is not implemented. No photo is collected or uploaded; use working text and catalogue filters instead.",
  "/search/image",
);
export default function Page() {
  return (
    <>
      <PageIntro
        index="SEARCH"
        title="IMAGE SEARCH."
        description="COMING SOON No photo uploads here. Text search is available now."
        action="Use text search"
        href="/collection"
      />
      <section className="prose">
        <h2>
          <UiText id={"FIND BY WORDS FOR NOW."} />
        </h2>
        <p>
          <UiText
            id={
              "Privacy-preserving image matching needs an on-device model and an evaluated archive index. We have not shipped that feature, and this page does not collect an image."
            }
          />
        </p>
      </section>
    </>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return localizeMetadata(baseMetadata, (await params).locale);
}
