import { HandoffForm } from "@/components/handoff-form";
import { PageIntro } from "@/components/page-intro";
import { localizeMetadata } from "@/i18n/metadata";
import { pageMeta } from "@/lib/metadata";
export default function Page() {
  return (
    <>
      <PageIntro
        index="RIGHTS"
        title="Request a takedown"
        description="Give the artwork link and explain the rights or safety concern. Avoid unnecessary identifying documents."
        action="Contact the team"
        href="/contact"
      />
      <div className="content-width">
        <HandoffForm kind="takedown" />
      </div>
    </>
  );
}
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return localizeMetadata(
    pageMeta(
      "Takedown request",
      "Request removal or correction of a work for a rights or safety concern.",
      "/takedown",
    ),
    (await params).locale,
  );
}
