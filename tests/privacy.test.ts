import test from "node:test";
import assert from "node:assert/strict";
import { deflateSync, strToU8 } from "fflate";
import { track, analyticsPath } from "../src/lib/analytics";

test("private account/admin/auth paths are never analytics payloads and upload counts omit revision IDs", () => {
  for (const locale of ["en", "hi", "bn", "ml"]) {
    for (const route of [
      "account/works/private-id/",
      "account/profile/",
      "admin/review/private-id/",
      "login/",
      "signup/",
      "verify/",
      "reset-password/",
    ])
      assert.equal(analyticsPath(`/${locale}/${route}`, "pageview"), null);
    assert.equal(
      analyticsPath(`/${locale}/account/works/private-id/`, "upload-submitted"),
      `/${locale}/submit/`,
    );
    assert.equal(analyticsPath(`/${locale}/collection/`, "pageview"), `/${locale}/collection/`);
  }
  assert.equal(analyticsPath("/admin/messages/", "pageview"), null);
});
import { decodeScene } from "../src/studio/share";
import { freshScene } from "../src/studio/model";
import { creditLines } from "../src/lib/licenses";
test("share-state decompression is bounded before parsing", () => {
  const compressed = deflateSync(strToU8("x".repeat(300000)));
  const state =
    "v2." +
    btoa(String.fromCharCode(...compressed))
      .replaceAll("+", "-")
      .replaceAll("/", "_")
      .replace(/=+$/, "");
  assert.throws(() => decodeScene(state), /size/);
});
test("user additions are not automatically dedicated to CC0", () => {
  assert.ok(creditLines(freshScene()).some((s) => s.includes("USER ADDITIONS: RIGHTS RETAINED")));
});
test("analytics respects DNT, blocks off-origin endpoints and omits design data", async () => {
  const keys = ["window", "navigator", "location", "fetch"];
  const previous = new Map(
    keys.map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]),
  );
  const env = {
    domain: process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN,
    endpoint: process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT,
  };
  const calls: { input: unknown; init?: RequestInit }[] = [];
  try {
    Object.defineProperty(globalThis, "window", { value: {}, configurable: true });
    Object.defineProperty(globalThis, "location", {
      value: {
        origin: "https://redlark.test",
        pathname: "/studio/",
        search: "?private=secret",
        hash: "#design=secret",
      },
      configurable: true,
    });
    Object.defineProperty(globalThis, "navigator", {
      value: { doNotTrack: "1" },
      configurable: true,
    });
    Object.defineProperty(globalThis, "fetch", {
      value: async (input: unknown, init?: RequestInit) => {
        calls.push({ input, init });
        return new Response();
      },
      configurable: true,
    });
    process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN = "redlark.test";
    process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT = "/analytics/event";
    track("pageview");
    assert.equal(calls.length, 0);
    Object.defineProperty(globalThis, "navigator", {
      value: { doNotTrack: "0" },
      configurable: true,
    });
    for (const name of ["pageview", "poster-download", "studio-export"] as const) track(name);
    assert.equal(calls.length, 3);
    for (const call of calls) {
      assert.equal(call.input, "/analytics/event");
      assert.equal(call.init?.credentials, "omit");
      const body = String(call.init?.body);
      assert.ok(!body.includes("secret"));
      assert.ok(!body.includes("design="));
      assert.deepEqual(Object.keys(JSON.parse(body)).sort(), ["domain", "name", "referrer", "url"]);
    }
    process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT = "https://tracker.invalid/api";
    track("pageview");
    assert.equal(calls.length, 3);
    for (const endpoint of [
      "//tracker.invalid/api",
      "/\\tracker.invalid/api",
      "/analytics/event?identifier=blocked",
      "/analytics/event#blocked",
    ]) {
      process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT = endpoint;
      track("pageview");
      assert.equal(calls.length, 3);
    }
    delete process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN;
    track("pageview");
    assert.equal(calls.length, 3);
  } finally {
    for (const key of keys) {
      const descriptor = previous.get(key);
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
    if (env.domain === undefined) delete process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN;
    else process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN = env.domain;
    if (env.endpoint === undefined) delete process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT;
    else process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT = env.endpoint;
  }
});
