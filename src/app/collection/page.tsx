import { Collection } from "@/components/archive";
import { PageIntro } from "@/components/page-intro";
import { posters } from "@/lib/catalog";
import { pageMeta } from "@/lib/metadata";
export const metadata = pageMeta(
  "Collection",
  "Search free print posters by theme, movement, language, artist, colour, format and licence. Original CC0 placeholder collection.",
  "/collection",
);
export default function Page() {
  return (
    <>
      <PageIntro
        index="02"
        title="THE COLLECTION."
        description="Find a poster. Read the small print. Take it to a wall."
        action="Open Studio"
        href="/studio"
      />
      <Collection posters={posters} />
    </>
  );
}
