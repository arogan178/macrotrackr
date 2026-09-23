#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, "../dist");
const srcDir = path.resolve(__dirname, "../src");

const APP_NAME = "MacroTrackr";
const APP_URL = (process.env.VITE_APP_URL || "https://macrotrackr.com").replace(/\/$/, "");

if (!fs.existsSync(distDir)) {
  console.log("No dist directory found; skipping pre-rendering.");
  process.exit(0);
}

const templatePath = path.join(distDir, "index.html");
if (!fs.existsSync(templatePath)) {
  console.error("No dist/index.html template found.");
  process.exit(1);
}

// Local auth redirects every public page to /login, and Capacitor serves from
// the APK, so neither has a signed-out page worth rendering.
const ssrEntry = path.resolve(__dirname, "../dist-ssr/entry-prerender.js");
const renderRoute =
  process.env.CAPACITOR !== "true" &&
  process.env.VITE_AUTH_MODE !== "local" &&
  fs.existsSync(ssrEntry)
    ? (await import(ssrEntry)).render
    : null;

const baseTemplate = fs
  .readFileSync(templatePath, "utf8")
  .replace(
    /<script(?![^>]*\bdata-cfasync=)([^>]*\btype=["']module["'])/i,
    '<script data-cfasync="false"$1'
  );

// Route lists come from the same files the React catalogs import.
const readData = (file) =>
  JSON.parse(fs.readFileSync(path.join(srcDir, "data", file), "utf8"));
const comparisons = readData("comparisons.json");
const migrations = readData("migrations.json");
const toolSlugs = [
  "tdee-calculator",
  "bmr-calculator",
  "macro-calculator",
  "weight-loss-calculator",
  "protein-calculator",
];

// Title and description for every route come from the same file the React
// pages read, so the static HTML and the rendered DOM cannot disagree.
const pageMeta = readData("page-metadata.json");
const metaFor = (route) => {
  const meta = pageMeta[route];
  if (!meta) throw new Error(`No metadata for "${route}" in src/data/page-metadata.json`);
  return meta;
};

// Load blog posts
let blogPosts = [];
try {
  blogPosts = readData("blog-posts.json");
} catch (e) {
  console.warn("Could not read blog-posts.json:", e.message);
}

const staticPage = (route, type = "website") => ({
  route,
  ...metaFor(`/${route}`),
  canonical: route ? `${APP_URL}/${route}` : APP_URL,
  type,
});

// Build all pages to pre-render
const pages = [
  staticPage(""),
  staticPage("pricing"),
  staticPage("privacy"),
  staticPage("delete-account"),
  staticPage("terms"),
  staticPage("tools"),
  staticPage("tools/bmr-vs-tdee", "article"),
  staticPage("contact"),
  staticPage("open-source"),
  staticPage("compare"),
  staticPage("migrate"),
  staticPage("blog"),
  ...toolSlugs.map((slug) => staticPage(`tools/${slug}`)),
  ...comparisons.map((comp) => staticPage(`compare/${comp.slug}`, "article")),
  ...migrations.map((migration) => staticPage(`migrate/${migration.slug}`, "article")),
];

// Add blog posts
for (const post of blogPosts) {
  pages.push({
    route: `blog/${post.slug}`,
    title: `${post.title} — ${APP_NAME}`,
    description: post.excerpt,
    canonical: `${APP_URL}/blog/${post.slug}`,
    type: "article",
    // Preloaded because the hero is the LCP element on every article.
    preloadImage: post.image,
  });
}

// Pre-render and write files
let createdCount = 0;
for (const page of pages) {
  let html = baseTemplate;

  // Replace Title
  html = html.replace(/<title>.*?<\/title>/i, `<title>${escapeHtml(page.title)}</title>`);

  // Replace Meta Description
  html = html.replace(
    /<meta\s+name=["']description["']\s+content=["'][^"']*["']\s*\/?>/i,
    `<meta name="description" content="${escapeAttr(page.description)}" />`
  );

  // Replace Canonical if exists, or inject before </head>
  if (html.includes('<link rel="canonical"')) {
    html = html.replace(
      /<link\s+rel=["']canonical["']\s+href=["'][^"']*["']\s*\/?>/i,
      `<link rel="canonical" href="${page.canonical}" />`
    );
  } else {
    html = html.replace(
      "</head>",
      `  <link rel="canonical" href="${page.canonical}" />\n  </head>`
    );
  }

  // Update OpenGraph
  html = html.replace(
    /<meta\s+property=["']og:title["']\s+content=["'][^"']*["']\s*\/?>/i,
    `<meta property="og:title" content="${escapeAttr(page.title)}" />`
  );
  html = html.replace(
    /<meta\s+property=["']og:description["']\s+content=["'][^"']*["']\s*\/?>/i,
    `<meta property="og:description" content="${escapeAttr(page.description)}" />`
  );
  if (html.includes('property="og:url"')) {
    html = html.replace(
      /<meta\s+property=["']og:url["']\s+content=["'][^"']*["']\s*\/?>/i,
      `<meta property="og:url" content="${page.canonical}" />`
    );
  } else {
    html = html.replace(
      "</head>",
      `  <meta property="og:url" content="${page.canonical}" />\n  </head>`
    );
  }

  // Update Twitter
  html = html.replace(
    /<meta\s+name=["']twitter:title["']\s+content=["'][^"']*["']\s*\/?>/i,
    `<meta name="twitter:title" content="${escapeAttr(page.title)}" />`
  );
  html = html.replace(
    /<meta\s+name=["']twitter:description["']\s+content=["'][^"']*["']\s*\/?>/i,
    `<meta name="twitter:description" content="${escapeAttr(page.description)}" />`
  );

  if (page.preloadImage) {
    html = html.replace(
      "</head>",
      `  <link rel="preload" as="image" href="${escapeAttr(page.preloadImage)}" fetchpriority="high" />\n  </head>`
    );
  }

  // No JSON-LD is injected here. The React pages render their own, and
  // emitting it from both places shipped two BlogPosting blocks per article and
  // two BreadcrumbList blocks per comparison, each pair disagreeing.

  // The real React page, which main.tsx hydrates. A page that only reached a
  // loading state would ship a spinner to crawlers, so that fails the build.
  if (renderRoute) {
    const pathname = `/${page.route}`;
    const appHtml = await renderRoute(pathname);
    if (!/<h1[\s>]/.test(appHtml)) {
      throw new Error(`Pre-rendered ${pathname} has no <h1>; it did not render its page.`);
    }
    html = html.replace(
      '<div id="root"></div>',
      `<div id="root" data-prerendered="${pathname}">${appHtml}</div>`
    );
  }

  // Determine output path
  const targetDir = page.route ? path.join(distDir, page.route) : distDir;
  fs.mkdirSync(targetDir, { recursive: true });
  const targetFile = path.join(targetDir, "index.html");

  fs.writeFileSync(targetFile, html, "utf8");

  // Also compress to gzip for static server speed. Skipped for Capacitor:
  // assets are read out of the APK rather than served over HTTP, so the .gz is
  // dead weight there — and worse, Android's asset merger treats
  // `index.html.gz` as a duplicate of `index.html` and fails the build with
  // "Duplicate resources". vite.config.ts skips viteCompression() for the same
  // reason; this path was missed.
  if (process.env.CAPACITOR !== "true") {
    const gzipped = zlib.gzipSync(Buffer.from(html, "utf8"));
    fs.writeFileSync(`${targetFile}.gz`, gzipped);
  }

  createdCount++;
}

console.log(`Successfully pre-rendered ${createdCount} static pages with SEO metadata.`);

// The rendered route trees leave timers behind (router and query cache GC), so
// the process would otherwise never exit and the build would hang.
process.exit(0);

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
