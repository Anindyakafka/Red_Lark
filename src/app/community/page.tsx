import Link from "next/link";
import { PageIntro } from "@/components/page-intro";
import { pageMeta } from "@/lib/metadata";
export const metadata = pageMeta(
  "Community",
  "A curated gallery for reviewed Studio-made posters. No submissions are published yet; propose your work through the email handoff.",
  "/community",
);
export default function Page() {
  return (
    <>
      <PageIntro
        index="09"
        title="A WALL WE SHARE."
        description="A curated gallery for Studio-made prints, with consent, credit and context."
        action="Submit a creation"
        href="/submit"
      />
      <section className="content-width empty-state">
        <p className="label">[NO REVIEWED SUBMISSIONS YET]</p>
        <h2>YOUR WORK COULD GO HERE.</h2>
        <p>No invented community posts. Make a print, then propose it for human review.</p>
        <Link className="button" href="/studio" prefetch={false}>
          [MAKE A POSTER] ↗
        </Link>
      </section>
    </>
  );
}
