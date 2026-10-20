import { AccountPanel } from "@/components/account-client";
import { PageIntro } from "@/components/page-intro";
import { pageMeta } from "@/lib/metadata";
import { localizeMetadata } from "@/i18n/metadata";
import { Link, UiText } from "@/i18n/client";
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
      <nav className="content-width button-row" aria-label="Contributor navigation">
        <Link href="/account/profile">
          <UiText id="Artist profile" />
        </Link>
        <Link href="/account/works/new">
          <UiText id="Upload" />
        </Link>
        <Link href="/account/settings">
          <UiText id="Account security" />
        </Link>
      </nav>
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
