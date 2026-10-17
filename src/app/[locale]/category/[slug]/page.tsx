import { notFound } from "next/navigation";
import categories from "../../../../../content/categories.json";
import { PageIntro } from "@/components/page-intro";
import { Collection } from "@/components/archive";
import { posters } from "@/lib/catalog";
import { pageMeta } from "@/lib/metadata";
import { localizeMetadata } from "@/i18n/metadata";
export const dynamicParams = false;
export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}
export default async function Category({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = categories.find((c) => c.slug === slug);
  if (!c) notFound();
  return (
    <>
      <PageIntro
        index="CATEGORY"
        title={c.label}
        description={`Free political graphics filed under ${c.label}. Original placeholders are marked.`}
      />
      <Collection posters={posters.filter((p) => p.categories?.includes(c.slug))} />
    </>
  );
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const c = categories.find((c) => c.slug === slug);
  return localizeMetadata(
    pageMeta(
      c?.label ?? "Category not found",
      `Free political graphics in ${c?.label ?? "this category"}. Browse print files and check permissions before use.`,
      `/category/${slug}`,
    ),
    locale,
  );
}
