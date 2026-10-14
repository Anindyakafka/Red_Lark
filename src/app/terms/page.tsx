import Link from "next/link";
import { pageMeta } from "@/lib/metadata";
export const metadata = pageMeta(
  "Terms and licence rules draft",
  "Draft rules for artwork reuse, derivatives, ShareAlike credits, submissions, artist removal and limitations of print exports.",
  "/terms",
);
export default function Page() {
  return (
    <article className="prose">
      <p className="legal-draft">DRAFT, NEEDS LEGAL REVIEW</p>
      <h1>READ THE SMALL PRINT.</h1>
      <Link className="button accent" href="/collection">
        [BROWSE LICENSED PRINTS] ↗
      </Link>
      <h2>EACH WORK HAS ITS OWN LICENCE.</h2>
      <p>
        The archive’s software licence is AGPL v3. It does not license every artwork, font or brand
        mark. Each poster lists its artist, source and specific licence. Current original
        placeholder art is CC0; font licences are distributed with the local font files.
      </p>
      <h2>DERIVATIVES ARE A REAL BOUNDARY.</h2>
      <p>
        A NoDerivatives licence, including CC BY-NC-ND, forbids remixing under that licence. Such
        posters can appear as approved downloads but never as Studio bases or elements. “Free” is
        not a substitute for permission. Non-commercial restrictions and attribution requirements
        remain attached to sources.
      </p>
      <h2>SHAREALIKE AND EXPORT CREDITS.</h2>
      <p>
        Studio exports compose a source-credit strip and licence metadata from every visible source
        element. ShareAlike sources impose their licence on adaptations. The exporter rejects
        incompatible ShareAlike combinations and combinations of CC BY-SA with non-commercial
        sources. Do not remove required credits. Images you upload remain subject to their owners’
        rights.
      </p>
      <h2>SUBMISSIONS.</h2>
      <p>
        You must own submitted artwork or have permission to share it, and supply credit, an
        explicit licence and a source. Email handoff does not promise receipt or publication. A
        human reviews contributions before adding them to the repository. No user account or
        automatic public gallery exists.
      </p>
      <h2>ACCEPTABLE USE.</h2>
      <p>
        Do not use this service to infringe rights, expose private information, threaten people, or
        distribute unlawful material. Keep identifying details out of designs where their
        publication could put people at risk.
      </p>
      <h2>ARTIST REMOVAL / TAKEDOWN.</h2>
      <p>
        Use{" "}
        <Link className="underlined" href="/contact">
          the contact page
        </Link>{" "}
        with a poster URL and your concern. The project should review credit, permission and removal
        requests promptly. A real monitored inbox is a launch prerequisite.
      </p>
      <h2>PRINTING AND LIMITATIONS.</h2>
      <p>
        Check exports before printing. RGB colours, screen separation previews and uncalibrated home
        printers do not guarantee a press result. Files are provided without promises about
        suitability, availability or print outcomes; any liability wording needs legal review for
        the deployment jurisdiction.
      </p>
    </article>
  );
}
