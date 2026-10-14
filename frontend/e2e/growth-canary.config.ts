import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.FRONTEND_URL ?? "https://macrotrackr.com";

export default defineConfig({
  testDir: ".",
  testMatch: /growth-canary\.test\.ts/,
  outputDir: "../test-results/growth-canary",
  fullyParallel: false,
  forbidOnly: true,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  // The PostHog check waits on ingestion, which can lag several minutes.
  timeout: 900_000,
  reporter: [
    ["list"],
    ["json", { outputFile: "../test-results/growth-canary/report.json" }],
  ],
  globalSetup: "./growth-canary.global-setup.ts",
  use: {
    ...devices["Desktop Chrome"],
    // posthog-js drops every event when navigator.webdriver is set, so the
    // browser half of the funnel never arrived from the canary.
    launchOptions: { args: ["--disable-blink-features=AutomationControlled"] },
    baseURL,
    screenshot: "only-on-failure",
    trace: "off",
    video: "off",
  },
});
