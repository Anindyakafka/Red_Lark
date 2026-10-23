import { Link, UiText } from "@/i18n/client";
import { pageMeta } from "@/lib/metadata";
import { localizeMetadata } from "@/i18n/metadata";
import { PageIntro } from "@/components/page-intro";
const pages = [
  [
    "Generative AI policy",
    "/policies/ai-policy",
    "The supplied policy and how AI-use badges work.",
  ],
  [
    "Licensing & credit",
    "/policies/licensing",
    "Source rights, NoDerivatives and ShareAlike credit.",
  ],
  [
    "Contributor guidelines",
    "/policies/contributor-guidelines",
    "Rights, optional public contact and honest declarations.",
  ],
  [
    "Privacy",
    "/privacy",
    "Browser storage, necessary authentication cookies, private uploads, contact messages and public-field consent.",
  ],
  ["Terms", "/terms", "Use, submissions, printing and limits of this draft."],
];
export default function Policies() {
  return (
    <>
      <PageIntro index="POLICIES" title="POLICIES." description="Draft - needs legal review" />
      <div className="content-width">
        <p className="legal-draft">
          <UiText id="Draft - needs legal review" />
        </p>
        <div className="index-grid">
          {pages.map(([title, href, description]) => (
            <article className="index-card" key={href}>
              <h2>
                <Link href={href}>
                  <UiText id={title} /> ↗
                </Link>
              </h2>
              <p>
                <UiText id={description} />
              </p>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return localizeMetadata(
    pageMeta(
      "Policies",
      "AI-use policy, licensing, credit, contributor guidelines, privacy and terms. Draft - needs legal review.",
      "/policies",
    ),
    (await params).locale,
  );
}
