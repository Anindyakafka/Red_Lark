import test from "node:test";
import assert from "node:assert/strict";
import { resolveSiteOrigin } from "../src/lib/site-origin";

test("all builds default to the canonical custom domain, including a blank SITE_URL", () => {
  assert.equal(resolveSiteOrigin({}), "https://redlarkworkshop.com");
  assert.equal(resolveSiteOrigin({ SITE_URL: " " }), "https://redlarkworkshop.com");
});

test("production rejects a localhost canonical origin", () => {
  assert.throws(() =>
    resolveSiteOrigin({ CONTEXT: "production", SITE_URL: "http://localhost:3000" }),
  );
});

test("Netlify production metadata uses its configured primary domain", () => {
  assert.equal(
    resolveSiteOrigin({
      CONTEXT: "production",
      SITE_URL: "https://redlark.example/",
      DEPLOY_PRIME_URL: "https://redlark.netlify.app",
    }),
    "https://redlark.example",
  );
});

test("preview URLs never become canonical URLs", () => {
  for (const CONTEXT of ["deploy-preview", "branch-deploy"])
    assert.equal(
      resolveSiteOrigin({
        CONTEXT,
        URL: "https://redlark.example",
        DEPLOY_PRIME_URL: "https://preview--redlark.netlify.app",
      }),
      "https://redlarkworkshop.com",
    );
});

test("explicit SITE_URL overrides host defaults and rejects invalid origins", () => {
  assert.equal(
    resolveSiteOrigin({ SITE_URL: " https://redlark.example/ ", URL: "https://other.example" }),
    "https://redlark.example",
  );
  for (const SITE_URL of [
    "not-a-url",
    "https://redlark.netlify.app",
    "ftp://redlark.example",
    "https://user:password@redlark.example",
    "https://redlark.example/path",
    "https://redlark.example?query=value",
    "https://redlark.example/#hash",
  ])
    assert.throws(() => resolveSiteOrigin({ SITE_URL }));
});
