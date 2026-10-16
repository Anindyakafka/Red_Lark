import test from "node:test";
import assert from "node:assert/strict";
import { resolveSiteOrigin } from "../src/lib/site-origin";

test("local builds default to localhost, including a blank SITE_URL", () => {
  assert.equal(resolveSiteOrigin({}), "http://localhost:3000");
  assert.equal(resolveSiteOrigin({ SITE_URL: " " }), "http://localhost:3000");
});

test("Netlify production metadata uses its configured primary domain", () => {
  assert.equal(
    resolveSiteOrigin({
      CONTEXT: "production",
      URL: "https://mirafra.example/",
      DEPLOY_PRIME_URL: "https://mirafra.netlify.app",
    }),
    "https://mirafra.example",
  );
});

test("Netlify preview and branch deployments use their own URLs", () => {
  for (const CONTEXT of ["deploy-preview", "branch-deploy"])
    assert.equal(
      resolveSiteOrigin({
        CONTEXT,
        URL: "https://mirafra.example",
        DEPLOY_PRIME_URL: "https://preview--mirafra.netlify.app",
      }),
      "https://preview--mirafra.netlify.app",
    );
});

test("explicit SITE_URL overrides host defaults and rejects invalid origins", () => {
  assert.equal(
    resolveSiteOrigin({ SITE_URL: " https://mirafra.example/ ", URL: "https://other.example" }),
    "https://mirafra.example",
  );
  for (const SITE_URL of [
    "not-a-url",
    "ftp://mirafra.example",
    "https://user:password@mirafra.example",
    "https://mirafra.example/path",
    "https://mirafra.example?query=value",
    "https://mirafra.example/#hash",
  ])
    assert.throws(() => resolveSiteOrigin({ SITE_URL }));
});
