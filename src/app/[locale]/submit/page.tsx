import { UiText } from "@/i18n/client";
import { localizeMetadata } from "@/i18n/metadata";
import { PageIntro } from "@/components/page-intro";
import { UploadPanel } from "@/components/account-client";
import { ContactAddress } from "@/components/contact-address";
import { pageMeta } from "@/lib/metadata";
import { CONTACT_EMAIL } from "@/config/site";
const baseMetadata = pageMeta(
  "Submit a poster",
  "Upload an original poster or Studio creation privately for human review. Explicit licence and artist credit are required; publication is never automatic.",
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
        <UploadPanel />
        <aside aria-labelledby="submission-guidance-heading">
          <h2 id="submission-guidance-heading">
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
                "Browsing, downloading, the Studio and guest submissions need no account. An optional account lets you manage your contributions."
              }
            />
          </p>
          <ContactAddress email={email} />
          <p>
            <UiText id="Email fallback: if you prefer not to create an account, email the team with a link to your artwork, its licence and artist credit." />
          </p>
        </aside>
      </div>
    </>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return localizeMetadata(baseMetadata, (await params).locale);
}
