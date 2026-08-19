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

function prerenderHomepage(): string {
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
  writeFileSync(path.join(distributionDirectory, "index.html"), htmlTemplate);
  writeFileSync(path.join(dataDirectory, "blog-posts.json"), "[]");

  execFileSync(process.execPath, [fixtureScript], {
    cwd: fixtureRoot,
    env: { ...process.env, VITE_APP_URL: "https://macrotrackr.test" },
  });

  return readFileSync(path.join(distributionDirectory, "index.html"), "utf8");
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("pre-rendered HTML", () => {
  it("keeps crawler copy inside noscript and leaves the React root empty", () => {
    const html = prerenderHomepage();
    const noscript = html.match(/<noscript>([\S\s]*?)<\/noscript>/)?.[1];

    expect(html).toContain('<div id="root"></div>');
    expect(noscript).toContain(
      "MacroTrackr — Fast, Open Source Macro Tracking",
    );
  });

  it("exempts the Vite entry module from Cloudflare Rocket Loader", () => {
    const html = prerenderHomepage();

    expect(html).toContain(
      '<script data-cfasync="false" type="module" src="/assets/index.js"></script>',
    );
  });
});
