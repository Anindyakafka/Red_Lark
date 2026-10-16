import { UiText } from "@/i18n/client";
import { localizeMetadata } from "@/i18n/metadata";
import { Link } from "@/i18n/client";
import { pageMeta } from "@/lib/metadata";
const baseMetadata = pageMeta(
  "Privacy draft",
  "Plain-language draft explaining local Studio storage, image metadata removal, share links, email handoffs and optional cookieless analytics.",
  "/privacy",
);
export default function Page() {
  const analytics =
    !!process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN && !!process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT;
  return (
    <article className="prose">
      <p className="legal-draft">
        <UiText id={"DRAFT, NEEDS LEGAL REVIEW"} />
      </p>
      <h1>
        <UiText id={"HOW WE HANDLE DATA."} />
      </h1>
      <Link className="button accent" href="/studio" prefetch={false}>
        <UiText id={"[OPEN PRIVATE STUDIO] ↗"} />
      </Link>
      <p>
        <UiText
          id={
            "Last revised: 14 October 2026. This describes the current build, not a future service."
          }
        />
      </p>
      <h2>
        <UiText id={"NO ACCOUNTS. NO DESIGN SERVER."} />
      </h2>
      <p>
        <UiText
          id={
            "The Studio works in your browser. Designs and uploaded images are not sent to a Red Lark Workshop server. We do not ask for your location, fingerprint your device, or assign a tracking identifier."
          }
        />
      </p>
      <h2>
        <UiText id={"LOCAL STORAGE."} />
      </h2>
      <p>
        <UiText
          id={
            "The Studio autosaves your current draft in localStorage on this browser. Collection bookmarks also stay locally. These are necessary for the features you choose, not advertising or tracking. Clear a draft with “Start fresh” and clear bookmarks from the collection; clearing browser data also removes them. Other users of the same browser profile may access them."
          }
        />
      </p>
      <h2>
        <UiText id={"UPLOADED IMAGES."} />
      </h2>
      <p>
        <UiText
          id={
            "Images are decoded and re-encoded as PNG locally before use. Original EXIF and GPS metadata are discarded. We do not retain original file bytes. The visible contents of an image can still identify people or places. Shared URL designs exclude image uploads, and the Studio tells you when a design cannot be shared by link."
          }
        />
      </p>
      <h2>
        <UiText id={"SHARE LINKS."} />
      </h2>
      <p>
        <UiText
          id={
            "When you choose “Share link”, the composition is encoded in the URL fragment. The fragment is not included in the HTTP request, but anyone receiving the full link can read the design. Do not put private content in a link. Your browser’s history, extensions and anyone you share with may retain it."
          }
        />
      </p>
      <h2>
        <UiText id={"FORMS."} />
      </h2>
      <p>
        <UiText
          id={
            "Contact and submission forms validate locally and prepare an email handoff to your own mail app. The site does not send email, upload attachments, or store form messages. Your email provider handles delivery if you choose to send. Do not supply unnecessary personal details. When no contact address is configured, delivery is unavailable and the form says so."
          }
        />
      </p>
      <h2>
        <UiText id={"ANALYTICS AND COOKIES."} />
      </h2>
      <p>
        {analytics
          ? "This build is configured for a same-origin proxy to cookieless, self-hosted Plausible analytics. It respects Do Not Track and sends only page views, poster-download and Studio-export events; no design content, query strings, URL fragments or persistent identifiers."
          : "Analytics is disabled in this build. No third-party trackers, remote fonts, embeds, advertising cookies or analytics scripts load."}
      </p>
      <p>
        <UiText
          id={
            "There is no cookie banner because this build uses no non-essential cookies or storage. If a later change adds non-essential tracking, consent must be assessed before it loads. Analytics proxies and ordinary hosting may receive IP addresses as part of network delivery; the hosting operator must document its logging and retention before publishing."
          }
        />
      </p>
      <h2>
        <UiText id={"CONTACT / REMOVAL."} />
      </h2>
      <p>
        <Link className="underlined" href="/contact">
          <UiText id={"Contact the project"} />
        </Link>{" "}
        <UiText
          id={
            "for questions or an artwork removal request. The real inbox and production hosting details require human configuration."
          }
        />
      </p>
    </article>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return localizeMetadata(baseMetadata, (await params).locale);
}
