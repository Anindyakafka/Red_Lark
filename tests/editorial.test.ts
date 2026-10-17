import test from "node:test";
import assert from "node:assert/strict";
import { blogPosts, compilePost, escapeXml, parsePost, rssFeed } from "../src/lib/blog.server";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
test("all localized editorial placeholders compile with review flags and no invented interview", async () => {
  for (const locale of ["en", "hi", "bn", "ml"] as const) {
    const posts = blogPosts(locale);
    assert.equal(posts.length, 2);
    for (const post of posts) {
      assert.equal(post.placeholder, true);
      assert.equal(post.reviewed, locale === "en");
      assert.equal(post.language, locale);
      const Content = await compilePost(post);
      assert.ok(renderToStaticMarkup(createElement(Content)).length > 100);
    }
  }
});
test("RSS has absolute localized links, explicit placeholders and XML escaping", () => {
  for (const locale of ["en", "hi", "bn", "ml"] as const) {
    const xml = rssFeed(locale, "https://example.invalid");
    assert.equal((xml.match(/<item>/g) ?? []).length, 2);
    assert.ok(xml.includes(`https://example.invalid/${locale}/blog/`));
    assert.ok(xml.includes("[EDITORIAL PLACEHOLDER]"));
  }
  assert.equal(escapeXml('A&B < "quote"'), "A&amp;B &lt; &quot;quote&quot;");
});
test("editorial metadata and active external embeds fail before publishing", () => {
  assert.throws(() => parsePost("No frontmatter", "invalid", "en"), /frontmatter/);
  const sample = blogPosts("en")[0];
  const header = `---\ntitle: "Test-only draft"\ndescription: "Test-only draft"\ndate: "2026-10-16"\ntags: []\nplaceholder: true\nreviewed: true\n---\n`;
  assert.throws(
    () => parsePost(header + '<iframe src="https://example.invalid" />', "test", "en"),
    /embeds/,
  );
  assert.throws(
    () => parsePost(header + "![image](https://example.invalid/image.png)", "test", "en"),
    /media/,
  );
  assert.ok(sample.body.trim());
});
