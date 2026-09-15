#!/usr/bin/env bun
import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";

// Static list of canonical routes to include in the sitemap.
// Edit this list as you add or remove public marketing pages.
// Files whose last change actually dates each page, for an honest lastmod.
const SRC = "src/features/landing/pages";
const ROUTE_SOURCES = {
  "/": [`${SRC}/LandingPage.tsx`],
  "/blog": [`${SRC}/BlogIndexPage.tsx`, "src/data/blog-posts.json"],
  "/tools": [`${SRC}/ToolsHubPage.tsx`, "src/features/landing/tools/toolsCatalog.ts"],
  "/tools/tdee-calculator": [`${SRC}/TdeeCalculatorPage.tsx`],
  "/tools/bmr-calculator": [`${SRC}/BmrCalculatorPage.tsx`],
  "/tools/macro-calculator": [`${SRC}/MacroCalculatorPage.tsx`],
  "/tools/weight-loss-calculator": [`${SRC}/WeightLossCalculatorPage.tsx`],
  "/tools/protein-calculator": [`${SRC}/ProteinCalculatorPage.tsx`],
  "/compare": [`${SRC}/ComparisonIndexPage.tsx`],
  "/compare/myfitnesspal": ["src/features/landing/comparisons/comparisonsCatalog.ts"],
  "/compare/macrofactor": ["src/features/landing/comparisons/comparisonsCatalog.ts"],
  "/compare/cronometer": ["src/features/landing/comparisons/comparisonsCatalog.ts"],
  "/compare/lose-it": ["src/features/landing/comparisons/comparisonsCatalog.ts"],
  "/pricing": ["src/features/billing/pages/PricingPage.tsx"],
  "/privacy": [`${SRC}/PrivacyPolicyPage.tsx`],
  "/terms": [`${SRC}/TermsAndConditionsPage.tsx`],
  "/delete-account": [`${SRC}/DeleteAccountPage.tsx`],
};

const routes = [
  { path: "/", changefreq: "weekly", priority: 0.8 },
  { path: "/blog", changefreq: "weekly", priority: 0.7 },
  { path: "/tools", changefreq: "monthly", priority: 0.7 },
  { path: "/tools/tdee-calculator", changefreq: "monthly", priority: 0.6 },
  { path: "/tools/bmr-calculator", changefreq: "monthly", priority: 0.6 },
  { path: "/tools/macro-calculator", changefreq: "monthly", priority: 0.6 },
  { path: "/tools/weight-loss-calculator", changefreq: "monthly", priority: 0.6 },
  { path: "/tools/protein-calculator", changefreq: "monthly", priority: 0.6 },
  { path: "/compare", changefreq: "weekly", priority: 0.8 },
  { path: "/compare/myfitnesspal", changefreq: "weekly", priority: 0.8 },
  { path: "/compare/macrofactor", changefreq: "weekly", priority: 0.7 },
  { path: "/compare/cronometer", changefreq: "weekly", priority: 0.7 },
  { path: "/compare/lose-it", changefreq: "weekly", priority: 0.7 },
  {
    path: "/migrate",
    changefreq: "monthly",
    priority: 0.8,
    lastmod: "2026-08-19",
  },
  {
    path: "/migrate/myfitnesspal",
    changefreq: "monthly",
    priority: 0.8,
    lastmod: "2026-08-19",
  },
  {
    path: "/migrate/cronometer",
    changefreq: "monthly",
    priority: 0.7,
    lastmod: "2026-08-19",
  },
  {
    path: "/migrate/macrofactor",
    changefreq: "monthly",
    priority: 0.7,
    lastmod: "2026-08-19",
  },
  {
    path: "/migrate/lose-it",
    changefreq: "monthly",
    priority: 0.7,
    lastmod: "2026-08-19",
  },
  { path: "/pricing", changefreq: "monthly", priority: 0.6 },
  { path: "/privacy", changefreq: "yearly", priority: 0.2 },
  { path: "/terms", changefreq: "yearly", priority: 0.2 },
  { path: "/delete-account", changefreq: "yearly", priority: 0.2 },
];

function buildSitemap(hostname) {
  const blogPostsPath = path.resolve(
    new URL("../src/data/blog-posts.json", import.meta.url).pathname,
  );
  let blogPosts = [];
  try {
    const rawData = fs.readFileSync(blogPostsPath, "utf8");
    blogPosts = JSON.parse(rawData);
  } catch (err) {
    console.error("Warning: Could not read blog-posts.json:", err.message);
  }

  // Release notes are excluded from the default feed on /blog, so submitting
  // them here was offering crawlers 8 orphaned pages, half of them under 100
  // words, that the site itself does not link to.
  const indexablePosts = blogPosts.filter((post) => post.category !== "Releases");

  // Static pages used to share the newest post date, which claimed /privacy
  // changed four months after it actually did. Google discounts lastmod
  // site-wide once it catches dates that do not hold up, which would also cost
  // the blog its accurate per-post dates.
  const today = new Date().toISOString().slice(0, 10);
  const lastCommitDate = (routePath) => {
    const source = ROUTE_SOURCES[routePath];
    if (!source) return undefined;
    try {
      const out = execFileSync(
        "git",
        ["log", "-1", "--format=%cs", "--", ...source],
        { cwd: path.resolve(new URL("..", import.meta.url).pathname), encoding: "utf8" },
      ).trim();
      return out || undefined;
    } catch {
      return undefined;
    }
  };

  const allRoutes = [
    ...routes.map((route) => ({
      ...route,
      lastmod: route.lastmod ?? lastCommitDate(route.path) ?? today,
    })),
    ...indexablePosts.map((post) => ({
      path: `/blog/${post.slug}`,
      changefreq: "weekly",
      priority: 0.6,
      lastmod: post.date || today,
    })),
  ];

  const urls = allRoutes
    .map((r) => {
      return `  <url>\n    <loc>${hostname}${r.path}</loc>\n    <lastmod>${r.lastmod}</lastmod>\n    <changefreq>${r.changefreq}</changefreq>\n    <priority>${r.priority}</priority>\n  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function writeSitemap(outputPath, content) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, content, "utf8");
  console.log(`Wrote sitemap: ${outputPath}`);
}

function main() {
  const hostname = (
    process.env.SITEMAP_HOSTNAME ||
    process.env.VITE_APP_URL ||
    "https://macrotrackr.com"
  ).replace(/\/$/, "");

  const xml = buildSitemap(hostname);

  // Write to frontend/public (so dev servers and static hosting serve it)
  const publicPath = path.join(
    path.dirname(import.meta.url.replace("file://", "")),
    "..",
    "public",
    "sitemap.xml",
  );
  // import.meta.url is a file:// URL in Bun/ESM; normalize to file path
  const publicOutput = path.resolve(
    new URL("../public/sitemap.xml", import.meta.url).pathname,
  );
  writeSitemap(publicOutput, xml);

  // If a `dist/` folder exists (after build) also write there.
  const distDir = path.resolve(process.cwd(), "dist");
  if (fs.existsSync(distDir)) {
    try {
      writeSitemap(path.join(distDir, "sitemap.xml"), xml);
    } catch (err) {
      // ignore if dist is writable but fails for some reason
    }
  }
}

main();
