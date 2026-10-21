import NextLink from "next/link";
import english from "../../content/copy/landing.en.json";
import { type Locale } from "@/i18n/config";
export type LandingCopy = typeof english;
export function LandingBlocks({ copy, locale }: { copy: LandingCopy; locale: Locale }) {
  const policy = () => (
    <NextLink
      prefetch={false}
      className="policy-link"
      href={`/${locale}/policies/`}
      data-copy="policyLink"
    >
      {copy.policyLink}
    </NextLink>
  );
  return (
    <div className="landing-narrative">
      <section className="landing-about" id="about">
        <div>
          <p className="label">01 / ABOUT</p>
          <h2 data-copy="aboutHeading">{copy.aboutHeading}</h2>
        </div>
        <div>
          <p data-copy="about">{copy.about}</p>
          {policy()}
        </div>
      </section>
      <section className="landing-objectives">
        <p className="label">02 / OBJECTIVES</p>
        <h2 data-copy="objectivesHeading">{copy.objectivesHeading}</h2>
        <ol>
          {copy.objectives.map((text, i) => (
            <li
              key={text}
              data-copy="objective"
              style={{ "--objective": i } as React.CSSProperties}
            >
              {text}
            </li>
          ))}
        </ol>
      </section>
      <section className="landing-ai">
        <p className="policy-stamp">POLICY</p>
        <h2 data-copy="aiHeading">{copy.aiHeading}</h2>
        <details open>
          <summary>Read policy / close panel</summary>
          <p data-copy="ai">{copy.ai}</p>
        </details>
        {policy()}
      </section>
    </div>
  );
}
