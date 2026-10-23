import { localizeMetadata } from "@/i18n/metadata";
import NotFound from "@/components/not-found";
import { pageMeta } from "@/lib/metadata";
const baseMetadata = {
  ...pageMeta(
    "404 — not on this wall",
    "This page is not in the Red Lark Workshop archive. Search the collection or open the poster-making Workshop.",
    "/404",
  ),
  robots: { index: false, follow: true },
};
export default NotFound;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return localizeMetadata(baseMetadata, (await params).locale);
}
