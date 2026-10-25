import { UiText } from "@/i18n/client";
import { Link } from "@/i18n/client";
import { canRemix } from "@/lib/licenses";
import type { Poster } from "@/lib/types";
export function LicenseGate({ poster }: { poster: Poster }) {
  return canRemix(poster) ? (
    <Link className="button accent" href={`/workshop/?remix=${poster.slug}`} prefetch={false}>
      <UiText id="OPEN IN WORKSHOP" />
    </Link>
  ) : (
    <div className="notice">
      <strong>
        {poster.allowsDerivatives
          ? "No editable source layers available."
          : "This licence forbids derivatives."}
      </strong>
      <p>
        {poster.allowsDerivatives
          ? "Download the finished artwork, or start with our CC0 elements."
          : "This poster can be downloaded under its licence, but cannot be remixed here."}
      </p>
      <Link href={poster.artistUrl}>
        <UiText id={"Contact / support the artist ↗"} />
      </Link>
    </div>
  );
}
