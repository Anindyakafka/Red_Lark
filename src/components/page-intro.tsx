import { UiText } from "@/i18n/client";
import { Link } from "@/i18n/client";
export function PageIntro({
  index,
  title,
  description,
  action = "Browse collection",
  href = "/collection",
}: {
  index: string;
  title: string;
  description: string;
  action?: string;
  href?: string;
}) {
  return (
    <section className="page-intro">
      <p className="label">
        [{index}
        <UiText id={"] RED LARK WORKSHOP / OPEN ARCHIVE"} />
      </p>
      <div className="intro-row">
        <div>
          <h1>
            <UiText id={title} />
          </h1>
          <p className="intro-description">
            <UiText id={description} />
          </p>
        </div>
        <Link className="button accent" href={href} prefetch={false}>
          [<UiText id={action} />] ↗
        </Link>
      </div>
    </section>
  );
}
