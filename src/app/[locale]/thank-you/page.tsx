import { UiText } from "@/i18n/client";
import { localizeMetadata } from "@/i18n/metadata";
import { Link } from "@/i18n/client";
import { pageMeta } from "@/lib/metadata";
const baseMetadata = {
  ...pageMeta(
    "Email handoff prepared",
    "Your email draft is ready to review and send in your own mail app. Red Lark Workshop has not received a message automatically.",
    "/thank-you",
  ),
  robots: { index: false, follow: true },
};
export default function Page() {
  return (
    <section className="prose">
      <p className="label">
        <UiText id={"[EMAIL HANDOFF / NOT A DELIVERY RECEIPT]"} />
      </p>
      <h1>
        <UiText id={"READY IN YOUR HANDS."} />
      </h1>
      <p>
        <UiText
          id={
            "Review and send the draft in your email app. This page does not confirm delivery or publication."
          }
        />
      </p>
      <p>
        <UiText
          id={
            "If your email app did not open, return to the form and use the displayed contact address. Nothing was saved by this site."
          }
        />
      </p>
      <Link className="button accent" href="/contact">
        <UiText id={"[BACK TO CONTACT] ↗"} />
      </Link>
      <Link className="button" href="/collection">
        <UiText id={"[BROWSE COLLECTION] ↗"} />
      </Link>
    </section>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return localizeMetadata(baseMetadata, (await params).locale);
}
