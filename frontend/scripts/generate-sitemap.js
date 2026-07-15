#!/usr/bin/env bun
import fs from "fs";
import path from "path";

// Static list of canonical routes to include in the sitemap.
// Edit this list as you add or remove public marketing pages.
const routes = [
  { path: "/", changefreq: "weekly", priority: 0.8 },
  { path: "/blog", changefreq: "weekly", priority: 0.7 },
  { path: "/login", changefreq: "monthly", priority: 0.5 },
  { path: "/register", changefreq: "monthly", priority: 0.5 },
  { path: "/reset-password", changefreq: "monthly", priority: 0.5 },
  { path: "/privacy", changefreq: "yearly", priority: 0.2 },
  { path: "/terms", changefreq: "yearly", priority: 0.2 },
];

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

function buildSitemap(hostname) {
  const lastmod = formatDate(new Date());

  // Dynamically resolve and read blog posts
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

  const dynamicRoutes = blogPosts.map((post) => ({
    path: `/blog/${post.slug}`,
    changefreq: "weekly",
    priority: 0.6,
  }));

  const allRoutes = [...routes, ...dynamicRoutes];

  const urls = allRoutes
    .map((r) => {
      return `  <url>\n    <loc>${hostname}${r.path}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${r.changefreq}</changefreq>\n    <priority>${r.priority}</priority>\n  </url>`;
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
