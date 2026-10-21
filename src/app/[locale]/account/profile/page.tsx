import { AccountPanel } from "@/components/account-client";
import { PageIntro } from "@/components/page-intro";
import { Link, UiText } from "@/i18n/client";
import { pageMeta } from "@/lib/metadata";
import { localizeMetadata } from "@/i18n/metadata";
export default function Page() {
  return (
    <>
      <PageIntro
        index="ACCOUNT"
        title="Artist profile"
        description="Browsing, downloading, the Studio and contributions need no account. Accounts are reserved for invited staff."
        action="My contributions"
        href="/account"
      />
      <nav className="content-width button-row" aria-label="Contributor navigation">
        <Link href="/account">
          <UiText id="Dashboard" />
        </Link>
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
      <AccountPanel view="profile" />
    </>
  );
}
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return {
    ...localizeMetadata(
      pageMeta(
        "Artist profile",
        "Artist profile. Private contributor service; sign in to continue.",
        "/account/profile",
      ),
      (await params).locale,
    ),
    robots: { index: false, follow: false },
  };
}
