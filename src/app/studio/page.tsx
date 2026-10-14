import { StudioClient } from "@/studio/client";
import { pageMeta } from "@/lib/metadata";
export const metadata = pageMeta(
  "Studio",
  "Make a poster privately in your browser. Remix eligible originals, edit layers, save locally, and export outlined SVG/PDF or 300-PPI PNG.",
  "/studio",
);
export default function Page() {
  return (
    <>
      <div className="studio-intro">
        <p className="label">[10] YOUR BROWSER IS THE WORKSHOP / NO ACCOUNTS</p>
        <h1>THE STUDIO.</h1>
        <p>Make it yours. Export it. Keep the credit.</p>
      </div>
      <StudioClient />
    </>
  );
}
