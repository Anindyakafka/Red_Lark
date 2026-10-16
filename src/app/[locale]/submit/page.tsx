import { UiText } from "@/i18n/client";
import { localizeMetadata } from "@/i18n/metadata";
import { PageIntro } from "@/components/page-intro";
import { HandoffForm } from "@/components/handoff-form";
import { ContactAddress } from "@/components/contact-address";
import { pageMeta } from "@/lib/metadata";
import { CONTACT_EMAIL } from "@/config/site";
const baseMetadata = pageMeta(
  "Submit a poster",
  "Propose an original poster or Studio creation for human review. Provide a source link, explicit licence and artist credit; no automatic uploads.",
  "/submit",
);
export default function Page() {
  const email = CONTACT_EMAIL;
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
          <h2>
            <UiText id={"[BEFORE YOU SUBMIT]"} />
          </h2>
          <p>
            <UiText
              id={
                "Nothing enters the archive without explicit permission, a source and artist credit. Finished artwork with a NoDerivatives licence cannot enter the remix library."
              }
            />
          </p>
          <p>
            <UiText
              id={
                "Send a link to your work, not private files or personal details. No accounts. No automatic publication."
              }
            />
          </p>
          <ContactAddress email={email} />
        </aside>
      </div>
    </>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return localizeMetadata(baseMetadata, (await params).locale);
}
