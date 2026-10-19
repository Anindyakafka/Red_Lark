import { UiText } from "@/i18n/client";
import { localizeMetadata } from "@/i18n/metadata";
import { PageIntro } from "@/components/page-intro";
import { HandoffForm } from "@/components/handoff-form";
import { ContactAddress } from "@/components/contact-address";
import { pageMeta } from "@/lib/metadata";
import { CONTACT_EMAIL } from "@/config/site";
const baseMetadata = pageMeta(
  "Contact and artist removal",
  "Contact Red Lark Workshop about credit, permission, takedowns, print problems or collaboration. Messages are stored privately and emailed to the team.",
  "/contact",
);
export default function Page() {
  const email = CONTACT_EMAIL;
  return (
    <>
      <PageIntro
        index="07"
        title="LET'S TALK."
        description="Questions, corrections, artist removal requests, and print problems."
        action="How we handle data"
        href="/privacy"
      />
      <div className="content-width form-layout">
        <HandoffForm kind="contact" email={email} />
        <aside aria-labelledby="contact-address-heading">
          <h2 id="contact-address-heading">
            <UiText id={"[CONTACT ADDRESS]"} />
          </h2>
          <ContactAddress email={email} />
          <p>
            <UiText
              id={
                "For takedowns, include the poster URL and a short explanation of your rights or permission concern. Avoid sending unnecessary identifying documents."
              }
            />
          </p>
          <p className="small">
            <UiText
              id={"Contact messages are stored privately. You can also email the team directly."}
            />
          </p>
        </aside>
      </div>
    </>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return localizeMetadata(baseMetadata, (await params).locale);
}
