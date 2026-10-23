import { UiText } from "@/i18n/client";
import { localizeMetadata } from "@/i18n/metadata";
import { notFound } from "next/navigation";
import { PageIntro } from "@/components/page-intro";
import { Collection } from "@/components/archive";
import { publicArtists, publicPosters } from "@/lib/catalog";
import { pageMeta } from "@/lib/metadata";
import { ArtistContact } from "@/components/artist-contact";
import { artistMetadataTitle } from "@/lib/artist-metadata";
export const dynamicParams = false;
export function generateStaticParams() {
  return publicArtists.map((a) => ({ slug: a.id }));
}
async function baseGenerateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = publicArtists.find((a) => a.id === slug);
  return a ? pageMeta(artistMetadataTitle(a, publicArtists), a.bio, `/artist/${a.id}`) : {};
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = publicArtists.find((a) => a.id === slug);
  if (!a) notFound();
  return (
    <>
      <PageIntro
        index="ARTIST"
        title={a.name.toUpperCase()}
        description={a.bio}
        action="Support artists"
        href="/about"
      />
      {a.links.length > 0 && (
        <nav className="content-width" aria-label="Artist links">
          {a.links.map((link) => (
            <a className="button" href={link.url} rel="noreferrer" key={link.url}>
              {link.label} ↗
            </a>
          ))}
        </nav>
      )}
      {a.supportUrl && (
        <p className="content-width">
          <a href={a.supportUrl} rel="noreferrer">
            <UiText id={"Support"} />
            {a.name}
            <UiText id={"directly ↗"} />
          </a>
        </p>
      )}
      <div className="content-width">
        <ArtistContact artist={a} />
      </div>
      <Collection
        posters={publicPosters.filter((p) => p.artist === a.id)}
        heading="More by the artist"
      />
    </>
  );
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  return localizeMetadata(await baseGenerateMetadata(props), (await props.params).locale);
}
