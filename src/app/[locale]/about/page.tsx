import { UiText } from "@/i18n/client";
import { localizeMetadata } from "@/i18n/metadata";
import { Link } from "@/i18n/client";
import { PageIntro } from "@/components/page-intro";
import { pageMeta } from "@/lib/metadata";
import { landingCopy } from "@/lib/landing-copy";
import { isLocale } from "@/i18n/config";
const baseMetadata = pageMeta(
  "About Red Lark Workshop",
  "Red Lark Workshop is a free open archive for protest posters and a private poster-making Studio. Learn how to print, remix responsibly and support artists.",
  "/about",
);
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const language = (await params).locale;
  const copy = landingCopy(isLocale(language) ? language : "en");
  return (
    <>
      <PageIntro
        index="08"
        title="ART IN PUBLIC."
        description="Red Lark Workshop is a free print archive and a space to make your own poster."
        action="Open Studio"
        href="/studio"
      />
      <article className="prose">
        <h2>{copy.aboutHeading}</h2>
        <p data-about-copy>{copy.about}</p>
        <h2>{copy.objectivesHeading}</h2>
        <ol>
          {copy.objectives.map((objective) => (
            <li key={objective}>{objective}</li>
          ))}
        </ol>
        <h2>
          <UiText id={"FIND. READ. PRINT."} />
        </h2>
        <p>
          <UiText
            id={
              "Find a poster, read its licence and credit, choose the paper size, and print. No account or payment stands between you and a download."
            }
          />
        </p>
        <h2>
          <UiText id={"REMIX WITH PERMISSION."} />
        </h2>
        <p>
          <UiText
            id={
              "Our Studio runs in your browser. Reuse approved elements, add your words, and export a print. A finished poster’s licence may forbid modification even when its download is free. We respect that rule."
            }
          />
        </p>
        <h2>
          <UiText id={"SUPPORT THE ARTIST."} />
        </h2>
        <p>
          <UiText
            id={
              "Credit belongs with the work. Use an artist’s consented support details where supplied. We do not process payments. The Wet Ink Workshop is the in-house placeholder credit, not a featured artist contribution. No real donation destination has been supplied."
            }
          />
        </p>
        <h2>
          <UiText id={"THIS IS A STARTING COLLECTION."} />
        </h2>
        <p>
          <UiText
            id={
              "All 18 current designs are original vector and typographic placeholder studies, dedicated to CC0. They are not borrowed work or claims of a real artist’s endorsement. The team will replace them with properly credited, explicitly licensed contributions."
            }
          />
        </p>
        <h2>
          <UiText id={"PRINT AT THE RIGHT SIZE."} />
        </h2>
        <p>
          <UiText
            id={
              "PDFs have exact A4, A3, A2 or 18 × 24 inch pages with outlined type. Choose “actual size” in your print dialog. The supplied print files are RGB without bleed; consult a shop before requesting CMYK or edge-to-edge finishing. A4/A2 PNG and JPEG files have actual 300-DPI dimensions."
            }
          />
        </p>
        <p>
          <UiText
            id={
              "Studio PDFs preserve vectors and outline fonts. Colour-separation views are composition previews, not calibrated press plates. Inspect a sample print before a large run."
            }
          />
        </p>
        <Link className="button accent" href="/submit">
          <UiText id={"[SUBMIT A POSTER] ↗"} />
        </Link>
        <h2>
          <UiText id="Join the network" />
        </h2>
        <p>
          <UiText id="Artists, writers, designers and legal volunteers can contact the team about contributing, joining or commissioning campaign material. Contributor uploads are private until human review; contact messages are stored privately and emailed to the team." />
        </p>
        <p className="notice">
          <UiText id="[SUPPORT DETAILS PENDING] No site donation address or UPI ID is published. Ask the team before sending support; never infer payment details from placeholder artwork." />
        </p>
        <Link className="button" href="/contact">
          <UiText id="Contact" /> ↗
        </Link>
      </article>
    </>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return localizeMetadata(baseMetadata, (await params).locale);
}
