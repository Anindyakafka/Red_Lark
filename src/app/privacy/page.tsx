import Link from "next/link";
import { pageMeta } from "@/lib/metadata";
export const metadata = pageMeta(
  "Privacy draft",
  "Plain-language draft explaining local Studio storage, image metadata removal, share links, email handoffs and optional cookieless analytics.",
  "/privacy",
);
export default function Page() {
  const analytics =
    !!process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN && !!process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT;
  return (
    <article className="prose">
      <p className="legal-draft">DRAFT, NEEDS LEGAL REVIEW</p>
      <h1>HOW WE HANDLE DATA.</h1>
      <Link className="button accent" href="/studio" prefetch={false}>
        [OPEN PRIVATE STUDIO] ↗
      </Link>
      <p>Last revised: 14 October 2026. This describes the current build, not a future service.</p>
      <h2>NO ACCOUNTS. NO DESIGN SERVER.</h2>
      <p>
        The Studio works in your browser. Designs and uploaded images are not sent to a Mirafra
        server. We do not ask for your location, fingerprint your device, or assign a tracking
        identifier.
      </p>
      <h2>LOCAL STORAGE.</h2>
      <p>
        The Studio autosaves your current draft in localStorage on this browser. Collection
        bookmarks also stay locally. These are necessary for the features you choose, not
        advertising or tracking. Clear a draft with “Start fresh” and clear bookmarks from the
        collection; clearing browser data also removes them. Other users of the same browser profile
        may access them.
      </p>
      <h2>UPLOADED IMAGES.</h2>
      <p>
        Images are decoded and re-encoded as PNG locally before use. Original EXIF and GPS metadata
        are discarded. We do not retain original file bytes. The visible contents of an image can
        still identify people or places. Shared URL designs exclude image uploads, and the Studio
        tells you when a design cannot be shared by link.
      </p>
      <h2>SHARE LINKS.</h2>
      <p>
        When you choose “Share link”, the composition is encoded in the URL fragment. The fragment
        is not included in the HTTP request, but anyone receiving the full link can read the design.
        Do not put private content in a link. Your browser’s history, extensions and anyone you
        share with may retain it.
      </p>
      <h2>FORMS.</h2>
      <p>
        Contact and submission forms validate locally and prepare an email handoff to your own mail
        app. The site does not send email, upload attachments, or store form messages. Your email
        provider handles delivery if you choose to send. Do not supply unnecessary personal details.
        When no contact address is configured, delivery is unavailable and the form says so.
      </p>
      <h2>ANALYTICS AND COOKIES.</h2>
      <p>
        {analytics
          ? "This build is configured for a same-origin proxy to cookieless, self-hosted Plausible analytics. It respects Do Not Track and sends only page views, poster-download and Studio-export events; no design content, query strings, URL fragments or persistent identifiers."
          : "Analytics is disabled in this build. No third-party trackers, remote fonts, embeds, advertising cookies or analytics scripts load."}
      </p>
      <p>
        There is no cookie banner because this build uses no non-essential cookies or storage. If a
        later change adds non-essential tracking, consent must be assessed before it loads.
        Analytics proxies and ordinary hosting may receive IP addresses as part of network delivery;
        the hosting operator must document its logging and retention before publishing.
      </p>
      <h2>CONTACT / REMOVAL.</h2>
      <p>
        <Link className="underlined" href="/contact">
          Contact the project
        </Link>{" "}
        for questions or an artwork removal request. The real inbox and production hosting details
        require human configuration.
      </p>
    </article>
  );
}
