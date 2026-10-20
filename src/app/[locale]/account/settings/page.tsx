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
        title="Account settings"
        description="Browsing, downloading and the Studio need no account. Uploading requires a verified contributor account."
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
      <AccountPanel view="settings" />
    </>
  );
}
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return {
    ...localizeMetadata(
      pageMeta(
        "Account settings",
        "Account settings. Private contributor service; sign in to continue.",
        "/account/settings",
      ),
      (await params).locale,
    ),
    robots: { index: false, follow: false },
  };
}
