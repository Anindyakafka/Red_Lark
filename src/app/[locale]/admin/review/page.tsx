import { AdminPanel } from "@/components/account-client";
import { PageIntro } from "@/components/page-intro";
import { pageMeta } from "@/lib/metadata";
import { localizeMetadata } from "@/i18n/metadata";
export default function Page() {
  return (
    <>
      <PageIntro
        index="ADMIN"
        title="Review queue"
        description="Review contributions before publication."
        action="Account security"
        href="/account/settings"
      />
      <AdminPanel />
    </>
  );
}
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return {
    ...localizeMetadata(
      pageMeta("Review queue", "Review contributions before publication.", "/admin/review"),
      (await params).locale,
    ),
    robots: { index: false, follow: false },
  };
}
