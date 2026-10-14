import { PageIntro } from "@/components/page-intro";
import { pageMeta } from "@/lib/metadata";
export const metadata = pageMeta(
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
        description="[COMING SOON] No photo uploads here. Text search is available now."
        action="Use text search"
        href="/collection"
      />
      <section className="prose">
        <h2>FIND BY WORDS FOR NOW.</h2>
        <p>
          Privacy-preserving image matching needs an on-device model and an evaluated archive index.
          We have not shipped that feature, and this page does not collect an image.
        </p>
      </section>
    </>
  );
}
