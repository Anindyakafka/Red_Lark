import { Link, UiText } from "@/i18n/client";
import { localizeMetadata } from "@/i18n/metadata";
import { PageIntro } from "@/components/page-intro";
import { UploadPanel } from "@/components/account-client";
import { ContactAddress } from "@/components/contact-address";
import { pageMeta } from "@/lib/metadata";
import { CONTACT_EMAIL } from "@/config/site";
const baseMetadata = pageMeta(
  "Contribute",
  "Share artwork or writing privately for human review. Your contribution is never published automatically.",
  "/contribute",
);
export default function Page() {
  const email = CONTACT_EMAIL;
  return (
    <>
      <PageIntro
        index="06"
        title="CONTRIBUTE."
        description="Share artwork or writing. We review every contribution."
        action="Read licence rules"
        href="/terms"
      />
      <div className="content-width form-layout">
        <UploadPanel />
        <aside aria-labelledby="submission-guidance-heading">
          <h2 id="submission-guidance-heading">
            <UiText id={"BEFORE YOU CONTRIBUTE"} />
          </h2>
          <p>
            <UiText
              id={
                "Nothing enters the Collection without human review. A licence and credit let us decide what can be reused; unfinished details are flagged for staff follow-up."
              }
            />
          </p>
          <p>
            <UiText
              id={
                "Browsing, downloading, the Workshop and guest submissions need no account. An optional account lets you manage your contributions."
              }
            />
          </p>
          <p>
            <Link href="/signup">
              <UiText id="Create a contributor account" />
            </Link>
            {" / "}
            <Link href="/login">
              <UiText id="Sign in" />
            </Link>
          </p>
          <ContactAddress email={email} />
          <p>
            <UiText id="Email fallback: email the team with a link to your artwork, its licence and artist credit. No account is needed." />
          </p>
        </aside>
      </div>
    </>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return localizeMetadata(baseMetadata, (await params).locale);
}
