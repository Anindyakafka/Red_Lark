import { AccountPanel } from "@/components/account-client";
import { PageIntro } from "@/components/page-intro";
import { pageMeta } from "@/lib/metadata";
import { localizeMetadata } from "@/i18n/metadata";
export default function Account() {
  return (
    <>
      <PageIntro
        index="ACCOUNT"
        title="Contributor account"
        description="Manage your contributions, private profile and account security."
        action="Browse collection"
        href="/collection"
      />
      <AccountPanel />
    </>
  );
}
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return {
    ...localizeMetadata(
      pageMeta(
        "Contributor account",
        "Manage your contributions, private profile, uploads and account security. The archive and Studio are open without an account.",
        "/account",
      ),
      (await params).locale,
    ),
    robots: { index: false, follow: false },
  };
}
