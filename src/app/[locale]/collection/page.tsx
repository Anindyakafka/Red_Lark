import { localizeMetadata } from "@/i18n/metadata";
import { Collection } from "@/components/archive";
import { Link, UiText } from "@/i18n/client";
import { posters } from "@/lib/catalog";
import { pageMeta } from "@/lib/metadata";
const baseMetadata = pageMeta(
  "Collection",
  "Search free print posters by category, language, artist, colour, artwork format and licence. Original CC0 placeholder collection.",
  "/collection",
);
export default function Page() {
  return (
    <>
      <section className="archive-intro">
        <div>
          <h1>
            <UiText id="THE COLLECTION." />
          </h1>
          <p>
            <UiText id="Find a poster. Read the small print. Take it to a wall." />
          </p>
        </div>
        <Link className="button accent" href="/studio">
          <UiText id="Open Studio" /> ↗
        </Link>
      </section>
      <Collection posters={posters} />
    </>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return localizeMetadata(baseMetadata, (await params).locale);
}
