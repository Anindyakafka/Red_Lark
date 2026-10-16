import Link from "next/link";
import { PageIntro } from "@/components/page-intro";
import { pageMeta } from "@/lib/metadata";
export const metadata = pageMeta(
  "About Red Lark Workshop",
  "Red Lark Workshop is a free open archive for protest posters and a private poster-making Studio. Learn how to print, remix responsibly and support artists.",
  "/about",
);
export default function Page() {
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
        <h2>FIND. READ. PRINT.</h2>
        <p>
          Find a poster, read its licence and credit, choose the paper size, and print. No account
          or payment stands between you and a download.
        </p>
        <h2>REMIX WITH PERMISSION.</h2>
        <p>
          Our Studio runs in your browser. Reuse approved elements, add your words, and export a
          print. A finished poster’s licence may forbid modification even when its download is free.
          We respect that rule.
        </p>
        <h2>SUPPORT THE ARTIST.</h2>
        <p>
          Credit belongs with the work. Where an artist supplies a support link, use it directly. We
          do not process donations or payments. The current artist credits are openly labelled
          invented placeholders, so there are no real donation destinations yet.
        </p>
        <h2>THIS IS A STARTING COLLECTION.</h2>
        <p>
          All 18 current designs are original vector and typographic placeholder studies, dedicated
          to CC0. They are not borrowed work or claims of a real artist’s endorsement. The team will
          replace them with properly credited, explicitly licensed contributions.
        </p>
        <h2>PRINT AT THE RIGHT SIZE.</h2>
        <p>
          PDFs have exact A4, A3, A2 or 18 × 24 inch pages with outlined type. Choose “actual size”
          in your print dialog. The supplied print files are RGB without bleed; consult a shop
          before requesting CMYK or edge-to-edge finishing. A3 PNGs have 300 pixels per inch at
          their declared size.
        </p>
        <p>
          Studio PDFs preserve vectors and outline fonts. Colour-separation views are composition
          previews, not calibrated press plates. Inspect a sample print before a large run.
        </p>
        <Link className="button accent" href="/submit">
          [SUBMIT A POSTER] ↗
        </Link>
      </article>
    </>
  );
}
