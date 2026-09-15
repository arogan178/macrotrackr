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

import { afterAll, describe, expect, it } from "vitest";

import pageMetadata from "@/data/page-metadata.json";

const metadata: Record<string, { title: string; description: string; h1?: string }> =
  pageMetadata;

/**
 * The prerenderer and `usePageMetadata` used to hold independent copies of
 * every title and description, and drifted apart on nine routes. Google indexes
 * the rendered DOM, so the static HTML silently lost. This asserts the one
 * shared source actually reaches the pre-rendered output.
 */
const FRONTEND_ROOT = process.cwd();
const temporaryDirectories: string[] = [];

interface Rendered { title: string; description: string; h1: string }

function prerenderAll(): Map<string, Rendered> {
  const fixtureRoot = mkdtempSync(path.join(tmpdir(), "macrotrackr-meta-"));
  temporaryDirectories.push(fixtureRoot);

  const scriptsDirectory = path.join(fixtureRoot, "scripts");
  const distributionDirectory = path.join(fixtureRoot, "dist");
  const dataDirectory = path.join(fixtureRoot, "src", "data");
  mkdirSync(scriptsDirectory, { recursive: true });
  mkdirSync(distributionDirectory, { recursive: true });
  mkdirSync(dataDirectory, { recursive: true });

  copyFileSync(
    path.join(FRONTEND_ROOT, "scripts", "prerender.mjs"),
    path.join(scriptsDirectory, "prerender.mjs"),
  );
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
  writeFileSync(path.join(dataDirectory, "blog-posts.json"), "[]");
  writeFileSync(
    path.join(distributionDirectory, "index.html"),
    `<!doctype html><html lang="en"><head>
<meta name="description" content="default" />
<title>MacroTrackr</title>
</head><body><noscript>js required</noscript><div id="root"></div></body></html>`,
  );

  execFileSync(process.execPath, [path.join(scriptsDirectory, "prerender.mjs")], {
    cwd: fixtureRoot,
    env: { ...process.env, VITE_APP_URL: "https://macrotrackr.test" },
  });

  const rendered = new Map<string, Rendered>();
  for (const route of Object.keys(pageMetadata)) {
    const file = path.join(
      distributionDirectory,
      route === "/" ? "" : route.slice(1),
      "index.html",
    );
    const html = readFileSync(file, "utf8");
    rendered.set(route, {
      title: /<title>(.*?)<\/title>/.exec(html)?.[1] ?? "",
      description:
        /<meta name="description" content="(.*?)"/.exec(html)?.[1] ?? "",
      h1: /<h1>(.*?)<\/h1>/.exec(html)?.[1] ?? "",
    });
  }

  return rendered;
}

function decodeEntities(value: string): string {
  return value
    .replaceAll("&quot;", '"')
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
}

afterAll(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("page metadata", () => {
  const rendered = prerenderAll();

  it.each(Object.entries(pageMetadata))(
    "pre-renders %s with the shared title and description",
    (route, expected) => {
      const actual = rendered.get(route);

      expect(decodeEntities(actual?.title ?? "")).toBe(expected.title);
      expect(decodeEntities(actual?.description ?? "")).toBe(
        expected.description,
      );

      // The crawler copy inside <noscript> used to carry a different heading
      // from the one React renders, on every comparison page.
      if ("h1" in expected) {
        expect(decodeEntities(actual?.h1 ?? "")).toBe(expected.h1);
      }
    },
  );

  it("keeps h1 copy in step with the catalogs React renders from", async () => {
    const [{ COMPARISONS }, { MIGRATION_GUIDES }, { CALCULATOR_TOOLS }] =
      await Promise.all([
        import("@/features/landing/comparisons/comparisonsCatalog"),
        import("@/features/landing/migrations/migrationGuidesCatalog"),
        import("@/features/landing/tools/toolsCatalog"),
      ]);

    for (const comparison of COMPARISONS) {
      expect(metadata[`/compare/${comparison.slug}`]?.h1).toBe(comparison.title);
    }
    for (const guide of MIGRATION_GUIDES) {
      expect(metadata[`/migrate/${guide.slug}`]?.h1).toBe(guide.title);
    }
    for (const tool of CALCULATOR_TOOLS) {
      expect(metadata[tool.path]?.h1).toBe(tool.title);
    }
  });

  it("emits no JSON-LD, which the React pages own", () => {
    // Both layers used to emit it and neither removed the other's tags, so
    // articles shipped two conflicting BlogPosting blocks.
    const prerenderSource = readFileSync(
      path.join(FRONTEND_ROOT, "scripts", "prerender.mjs"),
      "utf8",
    );

    expect(prerenderSource).not.toContain("ld+json");
  });
});
