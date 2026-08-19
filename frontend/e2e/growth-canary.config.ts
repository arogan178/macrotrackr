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
  reporter: [
    ["list"],
    ["json", { outputFile: "../test-results/growth-canary/report.json" }],
  ],
  globalSetup: "./growth-canary.global-setup.ts",
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
});
