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

// Stand in for the SSR build of src/entry-prerender.tsx, which
// entry-prerender.test.tsx covers against the real route tree.
const RENDERS_PAGE = `export const rendersPublicPages = true;
export async function render(pathname) {
  return "<main><h1>Rendered " + pathname + "</h1></main>";
}`;
const STUCK_LOADING = `export const rendersPublicPages = true;
export async function render() {
  return "<div>Loading</div>";
}`;
const LOCAL_AUTH = `export const rendersPublicPages = false;
export async function render() {
  return "<div>Redirecting to /login</div>";
}`;

function prerenderRoute(
  route: string,
  { render = RENDERS_PAGE, env = {} }: { render?: string; env?: NodeJS.ProcessEnv } = {},
): string {
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
  ]) {
    copyFileSync(
      path.join(FRONTEND_ROOT, "src", "data", dataFile),
      path.join(dataDirectory, dataFile),
    );
  }
  writeFileSync(path.join(distributionDirectory, "index.html"), htmlTemplate);
  writeFileSync(path.join(dataDirectory, "blog-posts.json"), "[]");
  mkdirSync(path.join(fixtureRoot, "dist-ssr"));
  writeFileSync(path.join(fixtureRoot, "dist-ssr", "entry-prerender.js"), render);

  execFileSync(process.execPath, [fixtureScript], {
    cwd: fixtureRoot,
    env: { ...process.env, VITE_APP_URL: "https://macrotrackr.test", ...env },
    stdio: "pipe",
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
  it("writes the rendered page into the root, marked for hydration", () => {
    const html = prerenderRoute("tools/tdee-calculator");

    expect(html).toContain(
      '<div id="root" data-prerendered="/tools/tdee-calculator"><main><h1>Rendered /tools/tdee-calculator</h1></main></div>',
    );
    expect(html).toContain("<noscript>MacroTrackr requires JavaScript to run.</noscript>");
  });

  it("leaves the root empty for the Capacitor build", () => {
    const html = prerenderRoute("", { env: { CAPACITOR: "true" } });

    expect(html).toContain('<div id="root"></div>');
  });

  it("leaves the root empty for a local-auth build", () => {
    const html = prerenderRoute("", { render: LOCAL_AUTH });

    expect(html).toContain('<div id="root"></div>');
  });

  it("fails the build when a route renders no page", () => {
    // A route stuck in a loading state would ship a spinner to crawlers.
    expect(() => prerenderRoute("", { render: STUCK_LOADING })).toThrow(/has no <h1>/);
  });

  it("exempts the Vite entry module from Cloudflare Rocket Loader", () => {
    const html = prerenderRoute("");

    expect(html).toContain(
      '<script data-cfasync="false" type="module" src="/assets/index.js"></script>',
    );
  });
});
