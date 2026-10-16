import { UiText } from "@/i18n/client";
import { localizeMetadata } from "@/i18n/metadata";
import { Link } from "@/i18n/client";
import { Collection } from "@/components/archive";
import { posters } from "@/lib/catalog";
import { pageMeta } from "@/lib/metadata";
const baseMetadata = pageMeta(
  "Free protest posters",
  "A free archive of protest posters. Find a design, check its licence, print it, or remix an original CC0 study in the private Studio.",
  "/",
);
export default function Home() {
  return (
    <>
      <section className="home-hero">
        <p className="label">
          <UiText id={"[01] AN OPEN PRINT ARCHIVE / NO ACCOUNTS / NO PAYWALL"} />
        </p>
        <h1>
          <UiText id={"PRINT."} />
          <br className="mobile-break" />{" "}
          <span className="hero-title-line">
            <UiText id={"MAKE NOISE."} />
          </span>
        </h1>
        <div className="hero-bottom">
          <p>
            <UiText id={"Free posters for public walls. Find one. Make one. Put it out there."} />
          </p>
          <div className="hero-ctas">
            <a className="button accent" href="#collection">
              <UiText id={"[BROWSE COLLECTION] ↓"} />
            </a>
            <Link className="button" href="/studio" prefetch={false}>
              <UiText id={"[OPEN STUDIO] ↗"} />
            </Link>
          </div>
        </div>
      </section>
      <Collection posters={posters} />
    </>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return localizeMetadata(baseMetadata, (await params).locale);
}
