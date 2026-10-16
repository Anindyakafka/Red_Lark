import type { Artist } from "@/lib/types";
import { ContactAddress } from "./contact-address";
import { PublicUpi } from "./public-upi";
import { UiText } from "@/i18n/client";
export function ArtistContact({ artist }: { artist: Artist }) {
  return (
    <>
      {artist.publicContact?.consented === true && (
        <section data-public-contact>
          <h2>
            <UiText id="Contact" />
          </h2>
          <ContactAddress email={artist.publicContact.value} />
        </section>
      )}
      {artist.publicUpi?.consented === true && (
        <section data-public-upi>
          <h2>
            <UiText id="Contribute" />
          </h2>
          <PublicUpi value={artist.publicUpi.value} name={artist.name} />
        </section>
      )}
    </>
  );
}
