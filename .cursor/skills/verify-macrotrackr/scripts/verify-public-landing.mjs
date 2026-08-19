#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

function readArgument(name, fallback) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

const baseUrl = readArgument("--base-url", "https://macrotrackr.com");
const outputDirectory = readArgument(
  "--output-dir",
  ".artifacts/verify-macrotrackr/public-landing",
);

if (!baseUrl || !outputDirectory) {
  throw new Error("--base-url and --output-dir require values");
}

await mkdir(outputDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();
const assertions = [];

try {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  const headline = page.getByRole("heading", {
    name: /Know what you ate\. Without the admin\./u,
  });
  await headline.waitFor({ state: "visible" });
  assertions.push("landing headline is visible");

  const hero = page.locator("section").filter({ has: headline }).first();
  const startFree = hero.getByRole("link", {
    name: "Start free",
    exact: true,
  });
  await startFree.waitFor({ state: "visible" });
  const href = await startFree.getAttribute("href");
  if (!href?.startsWith("/register")) {
    throw new Error(`Start free points to ${href ?? "no URL"}`);
  }
  assertions.push("primary CTA points to registration");

  await page.screenshot({
    fullPage: true,
    path: `${outputDirectory}/landing.png`,
  });
  await writeFile(
    `${outputDirectory}/result.json`,
    JSON.stringify(
      {
        assertions,
        checkedAt: new Date().toISOString(),
        outcome: "passed",
        url: page.url(),
      },
      null,
      2,
    ),
  );
} finally {
  await context.close();
  await browser.close();
}
