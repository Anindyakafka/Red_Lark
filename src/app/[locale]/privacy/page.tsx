import { UiText } from "@/i18n/client";
import { localizeMetadata } from "@/i18n/metadata";
import { Link } from "@/i18n/client";
import { pageMeta } from "@/lib/metadata";
import { analyticsConfiguration } from "@/lib/analytics";
const baseMetadata = pageMeta(
  "Privacy draft",
  "Plain-language draft covering browser-local Workshop designs, optional contributor and staff accounts, private uploads, contact mail, necessary cookies and optional cookieless analytics.",
  "/privacy",
);
export default function Page() {
  const analytics = !!analyticsConfiguration();
  return (
    <article className="prose">
      <p className="legal-draft">
        <UiText id={"Draft - needs legal review"} />
      </p>
      <h1>
        <UiText id={"HOW WE HANDLE DATA."} />
      </h1>
      <Link className="button accent" href="/workshop" prefetch={false}>
        <UiText id={"OPEN PRIVATE STUDIO ↗"} />
      </Link>
      <p>
        <UiText
          id={
            "Last revised: 19 October 2026. Backend functions require deployment configuration; unavailable services show an error rather than pretending to submit."
          }
        />
      </p>
      <h2>
        <UiText id={"OPEN ARCHIVE. PRIVATE STUDIO."} />
      </h2>
      <p>
        <UiText
          id={
            "Workshop designs and images imported into the Workshop stay in your browser. The separate contribution Upload flow sends an image privately to Cloudflare R2 for sanitization and review; Supabase stores account and contribution metadata, not artwork files. Original quarantine uploads expire after processing or cleanup; sanitized files remain private until approval. We do not request geolocation, fingerprint devices or assign tracking identifiers. Application rate limits store only salted, daily-rotating hashes, removed after expiry; infrastructure-provider logging needs owner review."
          }
        />
      </p>
      <h2>
        <UiText id={"LOCAL STORAGE."} />
      </h2>
      <p>
        <UiText id="Guest contributions do not create an account. We store the artwork, review details and any optional contact or UPI fields you choose to provide. Each field is published only with its own explicit consent. A private status link contains a random secret in its URL fragment; only a hash is stored in the database. Anyone holding the link can read that submission's status and feedback. Links expire after 90 days; scheduled cleanup removes expired receipt/contact records and abandoned draft files. Submitted artwork remains subject to review and the takedown policy. Save the link yourself: we do not email it or save it in localStorage." />
      </p>
      <p>
        <UiText id="Browsing, downloading, the Workshop and guest submissions need no account. An optional account lets you manage your contributions. Supabase handles email/password and magic-link authentication. Necessary HttpOnly, Secure, SameSite=Lax cookies keep sessions and protect forms; they are not tracking cookies. Server-stored authentication tokens are encrypted. Administration requires TOTP and recent verification." />
      </p>
      <p>
        <UiText
          id={
            "The Workshop autosaves your current draft in localStorage on this browser. Collection bookmarks also stay locally. These are necessary for the features you choose, not advertising or tracking. Clear a draft with “Start fresh” and clear bookmarks from the collection; clearing browser data also removes them. Other users of the same browser profile may access them."
          }
        />
      </p>
      <h2>
        <UiText id={"UPLOADED IMAGES."} />
      </h2>
      <p>
        <UiText
          id={
            "Images are decoded and re-encoded as PNG locally before use. Original EXIF and GPS metadata are discarded. We do not retain original file bytes. The visible contents of an image can still identify people or places. Shared URL designs exclude image uploads, and the Workshop tells you when a design cannot be shared by link."
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
            "Contact and takedown messages are validated and stored privately in Supabase Postgres. Resend sends the team notification and, if you provide an optional reply address, an acknowledgement. Failed delivery remains in a retry queue. An accepted email request is not proof of inbox delivery. Do not supply unnecessary personal details."
          }
        />
      </p>
      <h2>
        <UiText id={"ANALYTICS AND COOKIES."} />
      </h2>
      <p>
        {analytics
          ? "This build is configured for a same-origin proxy to cookieless, self-hosted Plausible analytics. It respects Do Not Track and sends only page views, poster-download and Workshop-export events; no design content, query strings, URL fragments or persistent identifiers."
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
        <UiText id="Artist public contact email and UPI ID are optional and require separate consent for each field. Public details can be copied by visitors. Ask the team to change or remove them; website removal cannot recall other people’s copies or automatically erase repository history. Opening a UPI link uses your chosen payment app; this website does not process a payment." />
      </p>
      <p>
        <UiText id="Account data can be exported and the account deleted from the dashboard. At deletion you choose removal or anonymisation of published works; downloaded copies and embedded credits cannot be recalled. Contact and UPI fields are optional, private by default, and public only with explicit per-field and per-work consent. Message retention, provider logs, data residency and legal obligations need owner review before launch." />
      </p>
      <p>
        <Link className="underlined" href="/contact">
          <UiText id={"Contact the project"} />
        </Link>{" "}
        <UiText
          id={
            "for questions or an artwork removal request. The team supplied its contact inbox; production hosting logs, retention and legal review still need human confirmation."
          }
        />
      </p>
    </article>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return localizeMetadata(baseMetadata, (await params).locale);
}
