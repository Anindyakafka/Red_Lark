import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/browser",
  timeout: 60000,
  fullyParallel: true,
  workers: 2,
  retries: 0,
  reporter: [["list"], ["json", { outputFile: "test-results/results.json" }]],
  use: {
    baseURL: "http://localhost:3000",
    viewport: { width: 1440, height: 1000 },
    colorScheme: "light",
    trace: "retain-on-failure",
    launchOptions: {
      executablePath:
        process.env.BROWSER_PATH ??
        (process.platform === "win32"
          ? "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
          : undefined),
    },
  },
  webServer: {
    command: "node scripts/serve.mjs",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    env: { QA_FIXTURES: "1" },
    timeout: 30000,
  },
});
