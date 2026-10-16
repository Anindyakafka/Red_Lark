import { UiText } from "@/i18n/client";
import { localizeMetadata } from "@/i18n/metadata";
import { StudioClient } from "@/studio/client";
import { pageMeta } from "@/lib/metadata";
const baseMetadata = pageMeta(
  "Studio",
  "Make a poster privately in your browser. Remix eligible originals, edit layers, save locally, and export outlined SVG/PDF or 300-PPI PNG.",
  "/studio",
);
export default function Page() {
  return (
    <>
      <div className="studio-intro">
        <p className="label">
          <UiText id={"[10] YOUR BROWSER IS THE WORKSHOP / NO ACCOUNTS"} />
        </p>
        <h1>
          <UiText id={"THE STUDIO."} />
        </h1>
        <p>
          <UiText id={"Make it yours. Export it. Keep the credit."} />
        </p>
      </div>
      <StudioClient />
    </>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return localizeMetadata(baseMetadata, (await params).locale);
}
