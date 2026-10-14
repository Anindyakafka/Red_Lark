import fs from "node:fs/promises";
import lighthouse from "lighthouse";
const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
export async function measurePage({ name, url, dir, port }) {
  const runs = [];
  const results = [];
  for (let run = 1; run <= 3; run++) {
    const result = await lighthouse(url, {
      port,
      output: ["json", "html"],
      logLevel: "error",
      onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
      formFactor: "mobile",
      screenEmulation: {
        mobile: true,
        width: 390,
        height: 844,
        deviceScaleFactor: 1,
        disabled: false,
      },
    });
    if (!result) throw new Error("Lighthouse returned no result");
    results.push(result);
    await fs.writeFile(`${dir}/lighthouse-${name}-run-${run}.json`, result.report[0]);
    await fs.writeFile(`${dir}/lighthouse-${name}-run-${run}.html`, result.report[1]);
    const sample = {
      run,
      scores: Object.fromEntries(
        Object.entries(result.lhr.categories).map(([k, v]) => [k, Math.round(v.score * 100)]),
      ),
      cls: result.lhr.audits["cumulative-layout-shift"].numericValue,
      lcp: result.lhr.audits["largest-contentful-paint"].numericValue,
      tbt: result.lhr.audits["total-blocking-time"].numericValue,
    };
    runs.push(sample);
    console.log(`${name} cold-cache run ${run}: ${JSON.stringify(sample)}`);
  }
  const ranked = [...results].sort(
    (a, b) => a.lhr.categories.performance.score - b.lhr.categories.performance.score,
  );
  await fs.writeFile(`${dir}/lighthouse-${name}.json`, ranked[1].report[0]);
  await fs.writeFile(`${dir}/lighthouse-${name}.html`, ranked[1].report[1]);
  return {
    page: name,
    method: "Median of three consecutive cold-cache mobile Lighthouse runs; all raw runs retained",
    scores: Object.fromEntries(
      Object.keys(runs[0].scores).map((key) => [key, median(runs.map((r) => r.scores[key]))]),
    ),
    cls: Math.max(...runs.map((r) => r.cls)),
    lcp: median(runs.map((r) => r.lcp)),
    tbt: median(runs.map((r) => r.tbt)),
    runs,
  };
}
