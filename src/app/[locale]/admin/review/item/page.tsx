import { AdminPanel } from "@/components/account-client";
import { PageIntro } from "@/components/page-intro";
import { pageMeta } from "@/lib/metadata";
import { localizeMetadata } from "@/i18n/metadata";
export default function Page() {
  return (
    <>
      <PageIntro
        index="ADMIN"
        title="Review or edit artwork"
        description="Review pending work or update the title, alt text, type, categories and tags of an approved artwork."
        action="Account security"
        href="/account/settings"
      />
      <AdminPanel view="review" />
    </>
  );
}
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return {
    ...localizeMetadata(
      pageMeta(
        "Review or edit artwork",
        "Review pending work or update an approved artwork's editorial metadata.",
        "/admin/review/item",
      ),
      (await params).locale,
    ),
    robots: { index: false, follow: false },
  };
}
