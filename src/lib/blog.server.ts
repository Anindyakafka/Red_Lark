import fs from "node:fs";
import path from "node:path";
import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import { locales, type Locale } from "@/i18n/config";
export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  placeholder: boolean;
  reviewed: boolean;
  language: Locale;
  fallback: boolean;
  body: string;
}
export function parsePost(
  source: string,
  slug: string,
  language: Locale,
  fallback = false,
): BlogPost {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) throw new Error(`${slug}: missing JSON-valued frontmatter`);
  const fields: Record<string, unknown> = {};
  for (const line of match[1].split(/\r?\n/).filter((line) => line.trim())) {
    const field = line.match(/^([a-z]+):\s*(.+)$/);
    if (!field || Object.hasOwn(fields, field[1]))
      throw new Error(`${slug}: invalid or duplicate frontmatter field`);
    fields[field[1]] = JSON.parse(field[2]);
  }
  for (const key of ["title", "description", "date"])
    if (typeof fields[key] !== "string" || !String(fields[key]).trim())
      throw new Error(`${slug}: missing ${key}`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(String(fields.date)) ||
    Number.isNaN(Date.parse(String(fields.date)))
  )
    throw new Error(`${slug}: invalid date`);
  if (
    !Array.isArray(fields.tags) ||
    !fields.tags.every((tag) => typeof tag === "string" && tag.trim())
  )
    throw new Error(`${slug}: invalid tags`);
  if (typeof fields.placeholder !== "boolean" || typeof fields.reviewed !== "boolean")
    throw new Error(`${slug}: explicit review/placeholder flags required`);
  const body = source.slice(match[0].length);
  // Only repository-reviewed MDX is compiled at build time. Never evaluate
  // contributor uploads, remote content or contact messages as code.
  if (
    /<(?:script|iframe|object|embed|video|audio|link)\b|!\[[^\]]*\]\((?:https?:|\/\/)|<img[^>]+src=["'](?:https?:|\/\/)/i.test(
      body,
    )
  )
    throw new Error(`${slug}: external media or active embeds are not allowed`);
  return {
    slug,
    title: fields.title as string,
    description: fields.description as string,
    date: fields.date as string,
    tags: fields.tags as string[],
    placeholder: fields.placeholder,
    reviewed: fields.reviewed,
    language,
    fallback,
    body,
  };
}
export function blogPosts(locale: Locale): BlogPost[] {
  const directory = path.join(process.cwd(), "content/blog");
  return fs
    .readdirSync(path.join(directory, "en"))
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => {
      const available = fs.existsSync(path.join(directory, locale, file));
      const language = available ? locale : "en";
      return parsePost(
        fs.readFileSync(path.join(directory, language, file), "utf8"),
        file.slice(0, -4),
        language,
        !available,
      );
    })
    .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}
export async function compilePost(post: BlogPost) {
  return (await evaluate(post.body, { ...runtime, baseUrl: import.meta.url })).default;
}
export async function validateBlog() {
  for (const locale of locales) for (const post of blogPosts(locale)) await compilePost(post);
}
export function escapeXml(text: string) {
  return text.replace(
    /[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[char]!,
  );
}
export function rssFeed(locale: Locale, origin: string) {
  const url = `${origin}/${locale}/blog/`;
  const items = blogPosts(locale)
    .map((post) => {
      const link = `${url}${post.slug}/`;
      return `<item><title>${escapeXml(post.title)}</title><link>${escapeXml(link)}</link><guid isPermaLink="true">${escapeXml(link)}</guid><pubDate>${new Date(`${post.date}T00:00:00Z`).toUTCString()}</pubDate><description>${escapeXml(`${post.placeholder ? "[EDITORIAL PLACEHOLDER] " : ""}${!post.reviewed ? "[UNREVIEWED TRANSLATION] " : ""}${post.description}`)}</description>${post.tags.map((tag) => `<category>${escapeXml(tag)}</category>`).join("")}</item>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>RED LARK WORKSHOP / ${locale}</title><link>${escapeXml(url)}</link><description>Workshop notes on political graphics and printing. Placeholder posts are marked.</description><language>${locale}</language>${items}</channel></rss>`;
}
