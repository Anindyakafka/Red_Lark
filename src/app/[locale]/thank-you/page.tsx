import { UiText } from "@/i18n/client";
import { localizeMetadata } from "@/i18n/metadata";
import { Link } from "@/i18n/client";
import { pageMeta } from "@/lib/metadata";
const baseMetadata = {
  ...pageMeta(
    "Thank you",
    "Thank you for contacting Red Lark Workshop. Review decisions and replies are handled by the team.",
    "/thank-you",
  ),
  robots: { index: false, follow: true },
};
export default function Page() {
  return (
    <section className="prose">
      <p className="label">
        <UiText id={"THANK YOU"} />
      </p>
      <h1>
        <UiText id={"READY IN YOUR HANDS."} />
      </h1>
      <p>
        <UiText
          id={
            "The form confirms whether your message was saved. This page alone is not a delivery receipt or publication decision."
          }
        />
      </p>
      <p>
        <UiText
          id={
            "If the form reported a delivery error, your stored message will be retried. You can also use the displayed contact address."
          }
        />
      </p>
      <Link className="button accent" href="/contact">
        <UiText id={"BACK TO CONTACT ↗"} />
      </Link>
      <Link className="button" href="/collection">
        <UiText id={"BROWSE COLLECTION ↗"} />
      </Link>
    </section>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return localizeMetadata(baseMetadata, (await params).locale);
}
