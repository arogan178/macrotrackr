import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

const FRONTEND_ROOT = process.cwd();
const PRERENDER_SCRIPT = path.join(
  FRONTEND_ROOT,
  "scripts",
  "prerender.mjs",
);
const temporaryDirectories: string[] = [];

const htmlTemplate = `<!doctype html>
<html lang="en">
  <head>
    <meta name="description" content="Default description" />
    <meta property="og:title" content="Default title" />
    <meta property="og:description" content="Default description" />
    <meta name="twitter:title" content="Default title" />
    <meta name="twitter:description" content="Default description" />
    <title>MacroTrackr</title>
  </head>
  <body>
    <noscript>MacroTrackr requires JavaScript to run.</noscript>
    <div id="root"></div>
    <script type="module" src="/assets/index.js"></script>
  </body>
</html>`;

function prerenderRoute(route: string): string {
  const fixtureRoot = mkdtempSync(path.join(tmpdir(), "macrotrackr-prerender-"));
  temporaryDirectories.push(fixtureRoot);

  const scriptsDirectory = path.join(fixtureRoot, "scripts");
  const distributionDirectory = path.join(fixtureRoot, "dist");
  const dataDirectory = path.join(fixtureRoot, "src", "data");
  mkdirSync(scriptsDirectory, { recursive: true });
  mkdirSync(distributionDirectory, { recursive: true });
  mkdirSync(dataDirectory, { recursive: true });

  const fixtureScript = path.join(scriptsDirectory, "prerender.mjs");
  copyFileSync(PRERENDER_SCRIPT, fixtureScript);
  for (const dataFile of [
    "page-metadata.json",
    "comparisons.json",
    "migrations.json",
    "calculator-content.json",
    "open-source.json",
  ]) {
    copyFileSync(
      path.join(FRONTEND_ROOT, "src", "data", dataFile),
      path.join(dataDirectory, dataFile),
    );
  }
  writeFileSync(path.join(distributionDirectory, "index.html"), htmlTemplate);
  writeFileSync(path.join(dataDirectory, "blog-posts.json"), "[]");

  execFileSync(process.execPath, [fixtureScript], {
    cwd: fixtureRoot,
    env: { ...process.env, VITE_APP_URL: "https://macrotrackr.test" },
  });

  return readFileSync(
    path.join(distributionDirectory, route, "index.html"),
    "utf8",
  );
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("pre-rendered HTML", () => {
  it("keeps crawler copy inside noscript and leaves the React root empty", () => {
    const html = prerenderRoute("");
    const noscript = html.match(/<noscript>([\S\s]*?)<\/noscript>/)?.[1];

    expect(html).toContain('<div id="root"></div>');
    expect(noscript).toContain(
      "MacroTrackr — Fast, Open Source Macro Tracking",
    );
  });

  it("gives crawlers the comparison table, not just a headline", () => {
    // Retrieval crawlers for AI answers do not run JavaScript. This copy used
    // to be a tagline and three FAQs while the rendered page carried a nine-row
    // feature matrix, so they saw about a quarter of the page.
    const html = prerenderRoute("compare/myfitnesspal");
    const noscript = html.match(/<noscript>([\S\s]*?)<\/noscript>/)?.[1] ?? "";

    expect(noscript).toContain("Barcode Scanner");
    expect(noscript).toContain("Where MacroTrackr differs");
    expect(noscript).toContain("How to import your MyFitnessPal history");
  });

  it("gives crawlers the calculator method and questions", () => {
    const html = prerenderRoute("tools/tdee-calculator");
    const noscript = html.match(/<noscript>([\S\s]*?)<\/noscript>/)?.[1] ?? "";

    expect(noscript).toContain("Mifflin-St Jeor");
    expect(noscript).toContain("How this is calculated");
    expect(noscript).toContain("not medical advice");
  });

  it("gives crawlers the migration steps", () => {
    const html = prerenderRoute("migrate/myfitnesspal");
    const noscript = html.match(/<noscript>([\S\s]*?)<\/noscript>/)?.[1] ?? "";

    expect(noscript).toContain("Export from MyFitnessPal");
    expect(noscript).toContain("Before you export");
  });

  it("exempts the Vite entry module from Cloudflare Rocket Loader", () => {
    const html = prerenderRoute("");

    expect(html).toContain(
      '<script data-cfasync="false" type="module" src="/assets/index.js"></script>',
    );
  });
});
