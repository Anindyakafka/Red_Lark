import NextLink from "next/link";
import { pageMeta } from "@/lib/metadata";
import { localizeMetadata } from "@/i18n/metadata";
import { PageIntro } from "@/components/page-intro";
import en from "../../../../content/copy/landing.en.json";
export default async function Policies({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <>
      <PageIntro index="POLICY" title="POLICIES." description="Draft - needs legal review" />
      <div className="prose">
        <h2>{en.aiHeading}</h2>
        <p>{en.ai}</p>
        <p>
          Works carry an AI-use disclosure separately from their licence. A disclosure does not
          establish permission to use or remix a source.
        </p>
        <h2>Licensing & credit</h2>
        <p>
          Read each work’s licence. NoDerivatives works can be downloaded and cannot be remixed in
          the Studio. Keep required credits and ShareAlike terms.
        </p>
        <p>
          <NextLink href={`/${locale}/terms/`}>Terms & licensing ↗</NextLink> ·{" "}
          <NextLink href={`/${locale}/privacy/`}>Privacy ↗</NextLink> ·{" "}
          <NextLink href={`/${locale}/contact/`}>Takedown / contact ↗</NextLink>
        </p>
        <h2>Contributor guidelines</h2>
        <p>
          Share only work you have permission to publish. Supply a licence, artist credit, source
          and meaningful alt text. Account-based uploads and admin review are held while the backend
          is being planned. Current proposals use your own email app.
        </p>
      </div>
    </>
  );
}
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return localizeMetadata(
    pageMeta(
      "Policies",
      "AI-use policy, licensing, credit, contributor guidelines, privacy, terms and takedown information. Draft - needs legal review.",
      "/policies",
    ),
    (await params).locale,
  );
}
