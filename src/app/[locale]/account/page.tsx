import { BackendHold } from "@/components/backend-hold";
import { pageMeta } from "@/lib/metadata";
import { localizeMetadata } from "@/i18n/metadata";
export default function Account() {
  return <BackendHold title="Contributor accounts" />;
}
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return {
    ...localizeMetadata(
      pageMeta(
        "Contributor accounts pending",
        "Contributor accounts are not enabled. Use the public archive and browser-only Studio without signing in.",
        "/account",
      ),
      (await params).locale,
    ),
    robots: { index: false, follow: false },
  };
}
