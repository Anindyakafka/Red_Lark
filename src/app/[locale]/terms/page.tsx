import { UiText } from "@/i18n/client";
import { localizeMetadata } from "@/i18n/metadata";
import { Link } from "@/i18n/client";
import { pageMeta } from "@/lib/metadata";
const baseMetadata = pageMeta(
  "Terms and licence rules draft",
  "Draft rules for artwork reuse, derivatives, ShareAlike credits, submissions, artist removal and limitations of print exports.",
  "/terms",
);
export default function Page() {
  return (
    <article className="prose">
      <p className="legal-draft">
        <UiText id={"Draft - needs legal review"} />
      </p>
      <h1>
        <UiText id={"READ THE SMALL PRINT."} />
      </h1>
      <Link className="button accent" href="/collection">
        <UiText id={"BROWSE LICENSED PRINTS ↗"} />
      </Link>
      <h2>
        <UiText id={"EACH WORK HAS ITS OWN LICENCE."} />
      </h2>
      <p>
        <UiText
          id={
            "The archive’s software licence is AGPL v3. It does not license every artwork, font or brand mark. Each poster lists its artist, source and specific licence. Current original placeholder art is CC0; font licences are distributed with the local font files."
          }
        />
      </p>
      <h2>
        <UiText id={"DERIVATIVES ARE A REAL BOUNDARY."} />
      </h2>
      <p>
        <UiText
          id={
            "The Workshop excludes NoDerivatives works, including CC BY-NC-ND, from bases and elements. ND licences restrict distribution of adapted material; ask the artist about additional permissions. Such works may be offered as downloads under their stated terms. Non-commercial restrictions and attribution requirements remain attached to sources."
          }
        />
      </p>
      <h2>
        <UiText id={"SHAREALIKE AND EXPORT CREDITS."} />
      </h2>
      <p>
        <UiText
          id={
            "Workshop exports compose a source-credit strip and licence metadata from every visible source element. ShareAlike sources impose their licence on adaptations. The exporter rejects incompatible ShareAlike combinations and combinations of CC BY-SA with non-commercial sources. Do not remove required credits. Images you upload remain subject to their owners’ rights."
          }
        />
      </p>
      <h2>
        <UiText id={"SUBMISSIONS."} />
      </h2>
      <p>
        <UiText
          id={
            "You must own submitted artwork or have permission to share it, and supply credit, an explicit licence and a source. Private uploads accept guest submissions or verified contributor accounts. An administrator reviews licence, credit, AI disclosure and consent before approval. Approval requests publication; it does not guarantee a review time or automatic inclusion in a curated gallery."
          }
        />
      </p>
      <h2>
        <UiText id={"ACCEPTABLE USE."} />
      </h2>
      <p>
        <UiText id="The upload form recommends sharing and remixing while keeping remixes open. You can instead require credit only, allow unrestricted use, or allow unchanged sharing only. The non-commercial option is unavailable for CC0. Legal details identify the exact licence. Image descriptions are optional; a title, format and artist template is used when blank. You may ask the team to change a licence, but permissions already granted cannot be recalled." />
      </p>
      <p>
        <UiText id="Profiles may use pseudonyms. Contact and UPI fields are optional and require independent explicit consent before publication. AI-use disclosure does not establish permission. Account export and deletion are available from the dashboard; at deletion you choose removal or anonymisation of published work. Copies already downloaded by others cannot be recalled." />
      </p>
      <p>
        <UiText
          id={
            "Do not use this service to infringe rights, expose private information, threaten people, or distribute unlawful material. Keep identifying details out of designs where their publication could put people at risk."
          }
        />
      </p>
      <h2>
        <UiText id={"ARTIST REMOVAL / TAKEDOWN."} />
      </h2>
      <p>
        <UiText id={"Use"} />{" "}
        <Link className="underlined" href="/contact">
          <UiText id={"the contact page"} />
        </Link>{" "}
        <UiText
          id={
            "with a poster URL and your concern. The project should review credit, permission and removal requests promptly. A real monitored inbox is a launch prerequisite."
          }
        />
      </p>
      <h2>
        <UiText id={"PRINTING AND LIMITATIONS."} />
      </h2>
      <p>
        <UiText
          id={
            "Check exports before printing. RGB colours, screen separation previews and uncalibrated home printers do not guarantee a press result. Files are provided without promises about suitability, availability or print outcomes; any liability wording needs legal review for the deployment jurisdiction."
          }
        />
      </p>
    </article>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return localizeMetadata(baseMetadata, (await params).locale);
}
