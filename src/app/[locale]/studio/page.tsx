import { UiText } from "@/i18n/client";
import { localizeMetadata } from "@/i18n/metadata";
import { StudioClient } from "@/studio/client";
import { pageMeta } from "@/lib/metadata";
import { PrintInstructions } from "@/components/print-instructions";
import { isLocale } from "@/i18n/config";
const baseMetadata = pageMeta(
  "Studio",
  "Make a poster privately in your browser. Remix eligible originals, edit layers, save locally, and export outlined SVG/PDF or 300-PPI PNG.",
  "/studio",
);
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const language = (await params).locale;
  return (
    <>
      <div className="studio-intro">
        <p className="label">
          <UiText id={"10 YOUR BROWSER IS THE WORKSHOP / NO LOGIN REQUIRED"} />
        </p>
        <h1>
          <UiText id={"THE STUDIO."} />
        </h1>
        <p>
          <UiText
            id={
              "Make it yours. Export it. Source credits stay in project metadata; choose the visible credit line at export."
            }
          />
        </p>
      </div>
      <StudioClient />
      <noscript>
        <p className="notice">
          <UiText id="The editor needs JavaScript to keep your design in this browser. Print files in the Collection work without JavaScript." />
        </p>
      </noscript>
      <div className="content-width">
        <PrintInstructions locale={isLocale(language) ? language : "en"} />
      </div>
    </>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return localizeMetadata(baseMetadata, (await params).locale);
}
