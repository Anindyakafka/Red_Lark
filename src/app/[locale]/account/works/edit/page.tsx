import { WorkEditor } from "@/components/account-pages";
import { PageIntro } from "@/components/page-intro";
import { Link, UiText } from "@/i18n/client";
import { pageMeta } from "@/lib/metadata";
import { localizeMetadata } from "@/i18n/metadata";
export default function Page() {
  return (
    <>
      <PageIntro
        index="ACCOUNT"
        title="Edit your contribution"
        description="Browsing, downloading, the Studio and guest submissions need no account. An optional account lets you manage your contributions."
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
      <WorkEditor />
    </>
  );
}
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return {
    ...localizeMetadata(
      pageMeta(
        "Edit your contribution",
        "Edit your contribution. Private contributor service; sign in to continue.",
        "/account/works/edit",
      ),
      (await params).locale,
    ),
    robots: { index: false, follow: false },
  };
}
