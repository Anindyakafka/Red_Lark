import { notFound } from "next/navigation";
import { PageIntro } from "@/components/page-intro";
import { Collection } from "@/components/archive";
import { artists, posters } from "@/lib/catalog";
import { pageMeta } from "@/lib/metadata";
export const dynamicParams = false;
export function generateStaticParams() {
  return artists.map((a) => ({ slug: a.id }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = artists.find((a) => a.id === slug);
  return a ? pageMeta(a.name, a.bio, `/artist/${a.id}`) : {};
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = artists.find((a) => a.id === slug);
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
            Support {a.name} directly ↗
          </a>
        </p>
      )}
      <Collection posters={posters.filter((p) => p.artist === a.id)} heading="THEIR PRINTS" />
    </>
  );
}
