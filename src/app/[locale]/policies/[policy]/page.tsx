import { notFound } from "next/navigation";
import policies from "../../../../../content/copy/policies.en.json";
import { landingCopy } from "@/lib/landing-copy";
import { isLocale } from "@/i18n/config";
import { pageMeta } from "@/lib/metadata";
import { localizeMetadata } from "@/i18n/metadata";
import { Link, UiText } from "@/i18n/client";
const identifiers = [
  "ai-policy",
  ...Object.keys(policies.articles).filter((policy) => policy !== "takedown"),
];
export const dynamicParams = false;
export function generateStaticParams() {
  return identifiers.map((policy) => ({ policy }));
}
export default async function Policy({
  params,
}: {
  params: Promise<{ locale: string; policy: string }>;
}) {
  const { locale: language, policy } = await params;
  const locale = isLocale(language) ? language : "en";
  if (!identifiers.includes(policy)) notFound();
  const copy = landingCopy(locale);
  const article = policies.articles[policy as keyof typeof policies.articles];
  return (
    <article className="prose" lang={policy === "ai-policy" ? locale : "en"}>
      <p className="legal-draft">
        <UiText id="Draft - needs legal review" />
      </p>
      <Link className="button accent" href="/collection">
        <UiText id="Browse collection" /> ↗
      </Link>
      <h1>{policy === "ai-policy" ? copy.aiHeading : article.title}</h1>
      {locale !== "en" && (
        <p className="notice" lang="en">
          DRAFT TRANSLATION / ENGLISH FALLBACK — NEEDS NATIVE REVIEW
        </p>
      )}
      {policy === "ai-policy" ? (
        <>
          <p data-policy-copy>{copy.ai}</p>
          <h2>
            <UiText id="How the AI-use badge works" />
          </h2>
          <p>
            <UiText id="Works declare none, minimal-assisted or generated use, with an explanation. The badge records a declaration; it does not establish ownership or permission. Original AI-assisted test studies are marked generated and placeholder." />
          </p>
        </>
      ) : (
        article.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)
      )}
      {policy === "licensing" && (
        <p>
          <a
            className="underlined"
            href="https://creativecommons.org/licenses/by-sa/4.0/"
            rel="noreferrer"
          >
            Creative Commons BY-SA 4.0 ↗
          </a>
          <br />
          <a
            className="underlined"
            href="https://creativecommons.org/licenses/by-nc-nd/4.0/"
            rel="noreferrer"
          >
            Creative Commons BY-NC-ND 4.0 ↗
          </a>
        </p>
      )}
      <p>
        <Link className="underlined" href="/contact">
          <UiText id="Contact" /> ↗
        </Link>
      </p>
      <Link className="button" href="/policies">
        <UiText id="All policies" /> ↗
      </Link>
    </article>
  );
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; policy: string }>;
}) {
  const { locale, policy } = await params;
  const article = policies.articles[policy as keyof typeof policies.articles];
  return localizeMetadata(
    pageMeta(
      policy === "ai-policy" ? "Generative AI policy" : (article?.title ?? "Policy not found"),
      policy === "ai-policy"
        ? "The supplied Red Lark Workshop Generative AI policy, verbatim, with an explanation of AI-use badges. Draft - needs legal review."
        : (article?.description ?? "Policy information is unavailable."),
      `/policies/${policy}`,
    ),
    locale,
  );
}
