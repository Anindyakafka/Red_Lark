import { PageIntro } from "@/components/page-intro";
import { HandoffForm } from "@/components/handoff-form";
import { ContactAddress } from "@/components/contact-address";
import { pageMeta } from "@/lib/metadata";
import { CONTACT_EMAIL } from "@/config/site";
export const metadata = pageMeta(
  "Contact and artist removal",
  "Contact Red Lark Workshop about credit, permission, takedowns, print problems or collaboration. Messages are handed off to your own email app.",
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
        <aside>
          <h2>[CONTACT ADDRESS]</h2>
          <ContactAddress email={email} />
          <p>
            For takedowns, include the poster URL and a short explanation of your rights or
            permission concern. Avoid sending unnecessary identifying documents.
          </p>
          <p className="small">
            Your mail provider handles email delivery. This static website has no inbox or
            submission database.
          </p>
        </aside>
      </div>
    </>
  );
}
