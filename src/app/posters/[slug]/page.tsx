import { notFound } from "next/navigation";
import { artworks } from "@/content/catalog";
import { ArtworkDetail } from "@/features/catalog/artwork-detail";
export function generateStaticParams() { return artworks.filter(a => a.kind === "poster").map(a => ({ slug: a.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; return { title: artworks.find(a => a.slug === slug && a.kind === "poster")?.title ?? "Not found" }; }
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const art = artworks.find(a => a.slug === slug && a.kind === "poster");
  if (!art) notFound();
  return <ArtworkDetail art={art} />;
}
