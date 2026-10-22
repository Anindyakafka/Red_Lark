import ts from "typescript";
import type { Page } from "@playwright/test";
import type { Poster } from "../../src/lib/types";

/** Browser-only test fixture: do not mutate/relicense published content or add a production test hook. */
export async function installShareAlikeFixture(page: Page) {
  let replacements = 0;
  await page.route("**/_next/static/chunks/*.js", async (route) => {
    const response = await route.fetch();
    const source = await response.text();
    if (!source.includes("a-future-we-share") || !source.includes("JSON.parse"))
      return route.fulfill({ response });
    const ast = ts.createSourceFile(
      "fixture.js",
      source,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.JS,
    );
    let replacement: { start: number; end: number; text: string } | undefined;
    function walk(node: ts.Node) {
      if (ts.isCallExpression(node) && node.expression.getText(ast) === "JSON.parse") {
        const arg = node.arguments[0];
        if (arg && ts.isStringLiteral(arg) && arg.text.startsWith('{"posters":')) {
          const catalog = JSON.parse(arg.text) as { posters: Poster[] };
          const poster = catalog.posters.find((p) => p.slug === "a-future-we-share");
          if (poster) {
            poster.license = "CC-BY-SA-4.0";
            poster.licenseUrl = "https://creativecommons.org/licenses/by-sa/4.0/";
            for (const layer of poster.studioLayers?.layers ?? [])
              if (layer.credit) layer.credit.license = poster.license;
            replacement = {
              start: arg.getStart(ast),
              end: arg.end,
              text: JSON.stringify(JSON.stringify(catalog)),
            };
          }
        }
      }
      ts.forEachChild(node, walk);
    }
    walk(ast);
    if (!replacement) return route.fulfill({ response });
    replacements++;
    return route.fulfill({
      response,
      body: source.slice(0, replacement.start) + replacement.text + source.slice(replacement.end),
    });
  });
  return () => replacements;
}
