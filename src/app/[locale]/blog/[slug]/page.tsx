import { notFound } from "next/navigation";
import { blogPosts, compilePost } from "@/lib/blog.server";
import { isLocale } from "@/i18n/config";
import { localizeMetadata } from "@/i18n/metadata";
import { pageMeta } from "@/lib/metadata";
import { Link, UiText } from "@/i18n/client";
export const dynamicParams = false;
export function generateStaticParams() {
  return blogPosts("en").map((post) => ({ slug: post.slug }));
}
export default async function BlogArticle({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: language, slug } = await params;
  const locale = isLocale(language) ? language : "en";
  const post = blogPosts(locale).find((post) => post.slug === slug);
  if (!post) notFound();
  const Content = await compilePost(post);
  return (
    <article className="prose blog-article" lang={post.language}>
      <p className="legal-draft">
        <UiText id="EDITORIAL PLACEHOLDER" />
      </p>
      <Link className="button accent" href="/collection">
        <UiText id="Browse collection" /> ↗
      </Link>
      <h1>{post.title}</h1>
      {(!post.reviewed || post.fallback) && (
        <p className="notice" lang="en">
          DRAFT TRANSLATION / ENGLISH FALLBACK — NEEDS NATIVE REVIEW
        </p>
      )}
      <p className="small">
        <time dateTime={post.date}>{post.date}</time> / {post.tags.join(" / ")}
      </p>
      <Content components={{ h1: "h2", h2: "h3", h3: "h4" }} />
      <Link className="button" href="/blog">
        <UiText id="Back to workshop notes" /> ↗
      </Link>
    </article>
  );
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const post = blogPosts(isLocale(locale) ? locale : "en").find((post) => post.slug === slug);
  if (!post) return {};
  const metadata = localizeMetadata(
    pageMeta(post.title, post.description, `/blog/${slug}`),
    locale,
  );
  return {
    ...metadata,
    openGraph: { ...metadata.openGraph, type: "article", publishedTime: `${post.date}T00:00:00Z` },
  };
}
