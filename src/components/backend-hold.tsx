import { PageIntro } from "./page-intro";
import { UiText } from "@/i18n/client";
export function BackendHold({ title }: { title: string }) {
  return (
    <>
      <PageIntro
        index="SERVICE PENDING"
        title={title}
        description="Contributor accounts and the review service are not enabled yet. Browsing, downloading and the Studio are free without an account."
      />
      <section className="prose">
        <p role="status">
          <UiText id="[NOT AVAILABLE YET] No account is created, and no credentials or artwork are collected here." />
        </p>
        <p>
          <UiText id="The team has paused backend setup. Please use Contact to discuss a contribution through your own email app." />
        </p>
      </section>
    </>
  );
}
