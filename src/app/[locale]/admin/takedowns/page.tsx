import { AdminPanel } from "@/components/account-client";
import { PageIntro } from "@/components/page-intro";
import { Link, UiText } from "@/i18n/client";
import { pageMeta } from "@/lib/metadata";
import { localizeMetadata } from "@/i18n/metadata";
export default function Page() {
  return (
    <>
      <PageIntro
        index="ADMIN"
        title="Takedowns"
        description="Browsing, downloading, the Studio and contributions need no account. Accounts are reserved for invited staff."
        action="Account security"
        href="/account/settings"
      />
      <nav className="content-width button-row" aria-label="Administration">
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
      <AdminPanel view="takedowns" />
    </>
  );
}
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return {
    ...localizeMetadata(
      pageMeta(
        "Takedowns",
        "Takedowns. Private contributor service; sign in to continue.",
        "/admin/takedowns",
      ),
      (await params).locale,
    ),
    robots: { index: false, follow: false },
  };
}
