import Link from "next/link";
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
      <p className="label">[{index}] RED LARK WORKSHOP / OPEN ARCHIVE</p>
      <div className="intro-row">
        <div>
          <h1>{title}</h1>
          <p className="intro-description">{description}</p>
        </div>
        <Link className="button accent" href={href} prefetch={false}>
          [{action.toUpperCase()}] ↗
        </Link>
      </div>
    </section>
  );
}
