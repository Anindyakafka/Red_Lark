import { PageIntro } from "@/components/page-intro";
import { HandoffForm } from "@/components/handoff-form";
import { ContactAddress } from "@/components/contact-address";
import { pageMeta } from "@/lib/metadata";
export const metadata = pageMeta(
  "Submit a poster",
  "Propose an original poster or Studio creation for human review. Provide a source link, explicit licence and artist credit; no automatic uploads.",
  "/submit",
);
export default function Page() {
  const email = process.env.CONTACT_EMAIL ?? "";
  return (
    <>
      <PageIntro
        index="06"
        title="ADD YOUR VOICE."
        description="Propose a poster, or tell us how you used a print. We review every contribution."
        action="Read licence rules"
        href="/terms"
      />
      <div className="content-width form-layout">
        <HandoffForm kind="submit" email={email} />
        <aside>
          <h2>[BEFORE YOU SUBMIT]</h2>
          <p>
            Nothing enters the archive without explicit permission, a source and artist credit.
            Finished artwork with a NoDerivatives licence cannot enter the remix library.
          </p>
          <p>
            Send a link to your work, not private files or personal details. No accounts. No
            automatic publication.
          </p>
          <ContactAddress email={email} />
        </aside>
      </div>
    </>
  );
}
