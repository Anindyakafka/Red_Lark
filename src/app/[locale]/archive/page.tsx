import { HistoricalArchive } from "@/components/historical-archive";
import { PageIntro } from "@/components/page-intro";
import { localizeMetadata } from "@/i18n/metadata";
import { posters } from "@/lib/catalog";
import { pageMeta } from "@/lib/metadata";

const metadata = pageMeta(
  "Archive",
  "A historical record of approved Red Lark Workshop contributions, including usable and archive-only works.",
  "/archive",
);
export default function ArchivePage() {
  return (
    <>
      <PageIntro
        index="ARCHIVE"
        title="THE ARCHIVE."
        description="A chronological record of approved work. Archive-only items are retained for context and may not be reusable."
        action="Browse collection"
        href="/collection"
      />
      <HistoricalArchive posters={posters} />
    </>
  );
}
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return localizeMetadata(metadata, (await params).locale);
}
