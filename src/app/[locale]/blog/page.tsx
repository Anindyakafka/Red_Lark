import { PageIntro } from "@/components/page-intro";
import { UiText } from "@/i18n/client";
import { Link } from "@/i18n/client";
import { blogPosts } from "@/lib/blog.server";
import { isLocale } from "@/i18n/config";
import { pageMeta } from "@/lib/metadata";
import { localizeMetadata } from "@/i18n/metadata";
export default async function Blog({ params }: { params: Promise<{ locale: string }> }) {
  const language = (await params).locale;
  const posts = blogPosts(isLocale(language) ? language : "en");
  return (
    <>
      <PageIntro
        index="BLOG"
        title="Notes from the workshop"
        description="Printing, distribution and conversations with artists. All current posts are editorial placeholders."
      />
      <div className="content-width">
        <p className="notice">
          <UiText id="[EDITORIAL PLACEHOLDERS] These are draft guides and interview questions, not reports or attributed artist interviews." />
        </p>
        <div className="index-grid">
          {posts.map((post) => (
            <article className="index-card" key={post.slug} lang={post.language}>
              <p className="label">
                [PLACEHOLDER] / {post.date}
                {!post.reviewed ? " / DRAFT TRANSLATION" : ""}
              </p>
              <h2>
                <Link href={`/blog/${post.slug}/`}>{post.title} ↗</Link>
              </h2>
              <p>{post.description}</p>
              <p className="small">{post.tags.join(" / ")}</p>
            </article>
          ))}
        </div>
        <Link className="button" href="/feed.xml">
          <UiText id="RSS feed" /> ↗
        </Link>
      </div>
    </>
  );
}
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return localizeMetadata(
    pageMeta(
      "Workshop blog",
      "Notes on printing, distribution and political graphics. Editorial placeholders are clearly marked.",
      "/blog",
    ),
    (await params).locale,
  );
}
