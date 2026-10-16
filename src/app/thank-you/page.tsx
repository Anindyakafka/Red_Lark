import Link from "next/link";
import { pageMeta } from "@/lib/metadata";
export const metadata = {
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
      <p className="label">[EMAIL HANDOFF / NOT A DELIVERY RECEIPT]</p>
      <h1>READY IN YOUR HANDS.</h1>
      <p>
        Review and send the draft in your email app. This page does not confirm delivery or
        publication.
      </p>
      <p>
        If your email app did not open, return to the form and use the displayed contact address.
        Nothing was saved by this site.
      </p>
      <Link className="button accent" href="/contact">
        [BACK TO CONTACT] ↗
      </Link>
      <Link className="button" href="/collection">
        [BROWSE COLLECTION] ↗
      </Link>
    </section>
  );
}
