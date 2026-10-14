import Link from "next/link";
import { Collection } from "@/components/archive";
import { posters } from "@/lib/catalog";
import { pageMeta } from "@/lib/metadata";
export const metadata = pageMeta(
  "Free protest posters",
  "A free archive of protest posters. Find a design, check its licence, print it, or remix an original CC0 study in the private Studio.",
  "/",
);
export default function Home() {
  return (
    <>
      <section className="home-hero">
        <p className="label">[01] AN OPEN PRINT ARCHIVE / NO ACCOUNTS / NO PAYWALL</p>
        <h1>
          PRINT.
          <br className="mobile-break" /> <span className="hero-title-line">MAKE NOISE.</span>
        </h1>
        <div className="hero-bottom">
          <p>Free posters for public walls. Find one. Make one. Put it out there.</p>
          <div className="hero-ctas">
            <a className="button accent" href="#collection">
              [BROWSE COLLECTION] ↓
            </a>
            <Link className="button" href="/studio" prefetch={false}>
              [OPEN STUDIO] ↗
            </Link>
          </div>
        </div>
      </section>
      <Collection posters={posters} />
    </>
  );
}
