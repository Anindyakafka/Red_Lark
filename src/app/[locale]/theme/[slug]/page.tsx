import { localizeMetadata } from "@/i18n/metadata";
import { notFound } from "next/navigation";
import { PageIntro } from "@/components/page-intro";
import { Collection } from "@/components/archive";
import { themes, posters, slugify } from "@/lib/catalog";
import { pageMeta } from "@/lib/metadata";
export const dynamicParams = false;
export function generateStaticParams() {
  return themes.map((t) => ({ slug: slugify(t) }));
}
async function baseGenerateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = themes.find((t) => slugify(t) === slug);
  return t
    ? pageMeta(
        `${t} posters`,
        `Free ${t.toLowerCase()} poster studies, their source credits, licences and print downloads.`,
        `/theme/${slug}`,
      )
    : {};
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = themes.find((t) => slugify(t) === slug);
  if (!t) notFound();
  return (
    <>
      <PageIntro
        index="THEME"
        title={`${t.toUpperCase()}.`}
        description="Shared subjects. Individual voices. Check the licence before reusing."
        action="Open Workshop"
        href="/workshop"
      />
      <Collection posters={posters.filter((p) => p.themes.includes(t))} />
    </>
  );
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  return localizeMetadata(await baseGenerateMetadata(props), (await props.params).locale);
}
