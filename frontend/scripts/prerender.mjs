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
const SUPPORT_EMAIL = process.env.VITE_SUPPORT_EMAIL?.trim() || "support@macrotrackr.com";

if (!fs.existsSync(distDir)) {
  console.log("No dist directory found; skipping pre-rendering.");
  process.exit(0);
}

const templatePath = path.join(distDir, "index.html");
if (!fs.existsSync(templatePath)) {
  console.error("No dist/index.html template found.");
  process.exit(1);
}

const baseTemplate = fs
  .readFileSync(templatePath, "utf8")
  .replace(
    /<script(?![^>]*\bdata-cfasync=)([^>]*\btype=["']module["'])/i,
    '<script data-cfasync="false"$1'
  );

// The same file the React catalog imports. Transcribing it here is what let
// the served and rendered pages drift apart.
const comparisons = JSON.parse(
  fs.readFileSync(path.join(srcDir, "data/comparisons.json"), "utf8")
);

// Same file the calculator pages read.
const calculatorContent = JSON.parse(
  fs.readFileSync(path.join(srcDir, "data/calculator-content.json"), "utf8")
);

const openSource = JSON.parse(
  fs.readFileSync(path.join(srcDir, "data/open-source.json"), "utf8")
);

const bmrVsTdee = JSON.parse(
  fs.readFileSync(path.join(srcDir, "data/bmr-vs-tdee.json"), "utf8")
);

const contact = JSON.parse(
  fs.readFileSync(path.join(srcDir, "data/contact.json"), "utf8")
);

// Same file the React catalog imports.
const migrations = JSON.parse(
  fs.readFileSync(path.join(srcDir, "data/migrations.json"), "utf8")
);

// Tools catalog
const tools = [
  {
    slug: "tdee-calculator",
    heading: "Free TDEE Calculator",
    subtitle: "Calculate your Total Daily Energy Expenditure and baseline daily calorie burn.",
  },
  {
    slug: "bmr-calculator",
    heading: "Free BMR Calculator",
    subtitle: "Determine your Basal Metabolic Rate — the calories your body burns at rest.",
  },
  {
    slug: "macro-calculator",
    heading: "Free Macro Calculator",
    subtitle: "Determine your exact macronutrient breakdown in grams tailored to your fitness objective.",
  },
  {
    slug: "weight-loss-calculator",
    heading: "Free Weight Loss Calculator",
    subtitle: "Calculate your target calorie deficit and project your realistic goal timeline.",
  },
  {
    slug: "protein-calculator",
    heading: "Free Protein Calculator",
    subtitle: "Calculate your optimal daily protein target in grams based on body weight and activity.",
  },
];

// Title and description for every route come from the same file the React
// pages read, so the static HTML and the rendered DOM cannot disagree.
const pageMeta = JSON.parse(
  fs.readFileSync(path.join(srcDir, "data/page-metadata.json"), "utf8")
);
const metaFor = (route) => {
  const meta = pageMeta[route];
  if (!meta) throw new Error(`No metadata for "${route}" in src/data/page-metadata.json`);
  return meta;
};

// Load blog posts
let blogPosts = [];
try {
  const rawBlog = fs.readFileSync(path.join(srcDir, "data/blog-posts.json"), "utf8");
  blogPosts = JSON.parse(rawBlog);
} catch (e) {
  console.warn("Could not read blog-posts.json:", e.message);
}

// Render post bodies with the same markdown pipeline as BlogArticlePage, so
// crawlers get the article instead of just the excerpt. Loaded lazily because
// the script also runs in fixtures that have no node_modules.
let renderMarkdownBody = () => "";

if (blogPosts.length > 0) {
  const [React, { renderToStaticMarkup }, { default: ReactMarkdown }, { default: remarkGfm }, { default: rehypeSlug }, { default: rehypeAutolinkHeadings }] =
    await Promise.all([
      import("react").then((m) => m.default ?? m),
      import("react-dom/server"),
      import("react-markdown"),
      import("remark-gfm"),
      import("rehype-slug"),
      import("rehype-autolink-headings"),
    ]);

  renderMarkdownBody = (slug) => {
    const mdPath = path.join(srcDir, "data/blog-content", `${slug}.md`);
    if (!fs.existsSync(mdPath)) return "";
    return renderToStaticMarkup(
      React.createElement(
        ReactMarkdown,
        {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, { behavior: "wrap" }]],
        },
        fs.readFileSync(mdPath, "utf8")
      )
    );
  };
}

// The React footer is the only site-wide navigation on legal and article
// pages, and it did not exist in the crawler copy. Without it every
// pre-rendered page was an island, which is why Google had never reached
// /pricing, /contact or the calculators.
const siteNavHtml = `
      <nav style="padding:2rem 1rem;max-width:800px;margin:0 auto;" aria-label="Site">
        <h2>${APP_NAME}</h2>
        <ul>
          <li><a href="/">Home</a></li>
          <li><a href="/pricing">Pricing</a></li>
          <li><a href="/blog">Blog</a></li>
          <li><a href="/tools">Free calculators</a></li>
          <li><a href="/compare">Alternatives and comparisons</a></li>
          <li><a href="/migrate">Import your history</a></li>
          <li><a href="/open-source">Open source and self-hosting</a></li>
          <li><a href="/contact">Contact</a></li>
          <li><a href="/terms">Terms of service</a></li>
          <li><a href="/privacy">Privacy policy</a></li>
        </ul>
      </nav>
`;

// Build all pages to pre-render
const pages = [
  {
    route: "",
    ...metaFor("/"),
    canonical: APP_URL,
    type: "website",
    bodyHtml: `
      <header style="padding:2rem 1rem;text-align:center;max-width:800px;margin:0 auto;">
        <h1>${APP_NAME} — Fast, Open Source Macro Tracking</h1>
        <p>Know what you ate, without the admin. Log meals in seconds, scan barcodes for free, and track your daily nutrition without banner ads.</p>
        <p><a href="/register">Create Free Account</a> | <a href="/compare">Compare Alternatives</a> | <a href="/tools">Free Calculators</a></p>
      </header>
    `,
  },
  {
    route: "pricing",
    ...metaFor("/pricing"),
    canonical: `${APP_URL}/pricing`,
    type: "website",
    bodyHtml: `
      <main style="padding:2rem 1rem;max-width:800px;margin:0 auto;">
        <h1>${APP_NAME} Pricing</h1>
        <p>100% Free & Open Source for self-hosting. Pro adds cloud sync and advanced insights at $3.99/month.</p>
      </main>
    `,
  },
  {
    route: "privacy",
    ...metaFor("/privacy"),
    canonical: `${APP_URL}/privacy`,
    type: "website",
    bodyHtml: `
      <main style="padding:2rem 1rem;max-width:800px;margin:0 auto;">
        <h1>Privacy Policy</h1>
        <p>We respect your privacy. No selling of health data, no 3rd-party ad trackers.</p>
      </main>
    `,
  },
  {
    route: "delete-account",
    ...metaFor("/delete-account"),
    canonical: `${APP_URL}/delete-account`,
    type: "website",
    bodyHtml: `
      <main style="padding:2rem 1rem;max-width:800px;margin:0 auto;">
        <h1>Delete your account</h1>
        <p>Delete your account and all associated data from Settings inside the app, or email support to request deletion.</p>
      </main>
    `,
  },
  {
    route: "terms",
    ...metaFor("/terms"),
    canonical: `${APP_URL}/terms`,
    type: "website",
    bodyHtml: `
      <main style="padding:2rem 1rem;max-width:800px;margin:0 auto;">
        <h1>Terms of Service</h1>
      </main>
    `,
  },
  {
    route: "tools",
    ...metaFor("/tools"),
    canonical: `${APP_URL}/tools`,
    type: "website",
    bodyHtml: `
      <main style="padding:2rem 1rem;max-width:800px;margin:0 auto;">
        <h1>Free Nutrition & Macro Calculators</h1>
        <p>Scientific calculators to help you dial in your daily nutrition goals.</p>
        <ul>
          ${tools.map((t) => `<li><a href="/tools/${t.slug}">${t.heading}</a> - ${t.subtitle}</li>`).join("")}
        </ul>
      </main>
    `,
  },
  {
    route: "tools/bmr-vs-tdee",
    ...metaFor("/tools/bmr-vs-tdee"),
    canonical: `${APP_URL}/tools/bmr-vs-tdee`,
    type: "article",
    bodyHtml: `
      <main style="padding:2rem 1rem;max-width:800px;margin:0 auto;">
        <nav><a href="/">Home</a> / <a href="/tools">Calculators</a> / <span>BMR vs TDEE</span></nav>
        <h1>${escapeHtml(metaFor("/tools/bmr-vs-tdee").h1)}</h1>
        <p>${escapeHtml(bmrVsTdee.intro)}</p>
        <h2>The difference in one line each</h2>
        ${bmrVsTdee.definitions
          .map((item) => `<h3>${escapeHtml(item.term)}</h3><p>${escapeHtml(item.body)}</p>`)
          .join("")}
        <h2>What TDEE is made of</h2>
        <ul>
          ${bmrVsTdee.components
            .map((item) => `<li><strong>${escapeHtml(item.name)}</strong>: ${escapeHtml(item.note)}</li>`)
            .join("")}
        </ul>
        <h2>Turning BMR into TDEE</h2>
        <ul>
          ${bmrVsTdee.multipliers
            .map((item) => `<li>${escapeHtml(item.level)}: x${escapeHtml(item.factor)}</li>`)
            .join("")}
        </ul>
        <h2>Questions</h2>
        ${bmrVsTdee.faqs
          .map((faq) => `<h3>${escapeHtml(faq.question)}</h3><p>${escapeHtml(faq.answer)}</p>`)
          .join("")}
        <p><a href="/tools/tdee-calculator">TDEE calculator</a> | <a href="/tools/bmr-calculator">BMR calculator</a></p>
      </main>
    `,
  },
  {
    route: "contact",
    ...metaFor("/contact"),
    canonical: `${APP_URL}/contact`,
    type: "website",
    bodyHtml: `
      <main style="padding:2rem 1rem;max-width:800px;margin:0 auto;">
        <h1>${escapeHtml(metaFor("/contact").h1)}</h1>
        <p>${escapeHtml(contact.intro)}</p>
        <p><a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
        <h2>What to send where</h2>
        ${contact.channels
          .map(
            (channel) =>
              `<h3>${escapeHtml(channel.title)}</h3><p>${escapeHtml(channel.body)}</p>`
          )
          .join("")}
        <h2>Self-hosting</h2>
        <p>${escapeHtml(contact.selfHostedNote)}</p>
        <p><a href="/open-source">Open source and self-hosting</a></p>
      </main>
    `,
  },
  {
    route: "open-source",
    ...metaFor("/open-source"),
    canonical: `${APP_URL}/open-source`,
    type: "website",
    bodyHtml: `
      <main style="padding:2rem 1rem;max-width:800px;margin:0 auto;">
        <h1>${escapeHtml(metaFor("/open-source").h1)}</h1>
        <p>${escapeHtml(openSource.intro)}</p>
        <h2>What that actually buys you</h2>
        ${openSource.principles
          .map(
            (item) =>
              `<h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description)}</p>`
          )
          .join("")}
        <h2>Where it runs</h2>
        <ul>
          ${openSource.platforms
            .map(
              (item) =>
                `<li><strong>${escapeHtml(item.name)}</strong>: ${escapeHtml(item.detail)}</li>`
            )
            .join("")}
        </ul>
        <h2>Questions</h2>
        ${openSource.faqs
          .map(
            (faq) =>
              `<h3>${escapeHtml(faq.question)}</h3><p>${escapeHtml(faq.answer)}</p>`
          )
          .join("")}
        <p><a href="/pricing">Managed hosting pricing</a> | <a href="/register">Start free</a></p>
      </main>
    `,
  },
  {
    route: "compare",
    ...metaFor("/compare"),
    canonical: `${APP_URL}/compare`,
    type: "website",
    bodyHtml: `
      <main style="padding:2rem 1rem;max-width:800px;margin:0 auto;">
        <h1>Compare ${APP_NAME} Against Competitors</h1>
        <p>Discover how ${APP_NAME} provides free barcode scanning, zero ads, and total data privacy compared to commercial alternatives.</p>
        <ul>
          ${comparisons.map((c) => `<li><a href="/compare/${c.slug}"><strong>${c.shortTitle}</strong></a>: ${c.tagline}</li>`).join("")}
        </ul>
      </main>
    `,
  },
  {
    route: "migrate",
    ...metaFor("/migrate"),
    canonical: `${APP_URL}/migrate`,
    type: "website",
    bodyHtml: `
      <main style="padding:2rem 1rem;max-width:800px;margin:0 auto;">
        <h1>Switch Trackers Without Starting Over</h1>
        <p>Export from your current nutrition app, preview the file in ${APP_NAME}, and import only when the totals look right.</p>
        <ul>
          ${migrations.map((migration) => `<li><a href="/migrate/${migration.slug}">${migration.title}</a></li>`).join("")}
        </ul>
      </main>
    `,
  },
  {
    route: "blog",
    ...metaFor("/blog"),
    canonical: `${APP_URL}/blog`,
    type: "website",
    bodyHtml: `
      <main style="padding:2rem 1rem;max-width:800px;margin:0 auto;">
        <h1>${APP_NAME} Blog</h1>
        <ul>
          ${blogPosts.map((p) => `<li><a href="/blog/${p.slug}">${p.title}</a> (${p.date}) - ${p.excerpt}</li>`).join("")}
        </ul>
      </main>
    `,
  },
];

// Add tool pages
for (const tool of tools) {
  pages.push({
    route: `tools/${tool.slug}`,
    ...metaFor(`/tools/${tool.slug}`),
    canonical: `${APP_URL}/tools/${tool.slug}`,
    type: "website",
    bodyHtml: `
      <main style="padding:2rem 1rem;max-width:800px;margin:0 auto;">
        <nav><a href="/">Home</a> / <a href="/tools">Calculators</a> / <span>${escapeHtml(tool.heading)}</span></nav>
        <h1>${escapeHtml(metaFor(`/tools/${tool.slug}`).h1)}</h1>
        <p>${escapeHtml(tool.subtitle)}</p>
        <p>${escapeHtml(metaFor(`/tools/${tool.slug}`).description)}</p>
        <h2>How this is calculated</h2>
        <p>${escapeHtml(calculatorContent.calculators[tool.slug].method)}</p>
        <h2>Frequently Asked Questions</h2>
        ${calculatorContent.calculators[tool.slug].faqs
          .map(
            (faq) =>
              `<h3>${escapeHtml(faq.question)}</h3><p>${escapeHtml(faq.answer)}</p>`
          )
          .join("")}
        <p>${escapeHtml(calculatorContent.disclaimer)}</p>
        <p><a href="/tools">All free calculators</a> | <a href="/register">Start Tracking with ${APP_NAME}</a></p>
      </main>
    `,
  });
}

// Add comparison pages
for (const comp of comparisons) {
  pages.push({
    route: `compare/${comp.slug}`,
    ...metaFor(`/compare/${comp.slug}`),
    canonical: `${APP_URL}/compare/${comp.slug}`,
    type: "article",
    bodyHtml: `
      <main style="padding:2rem 1rem;max-width:800px;margin:0 auto;">
        <nav><a href="/">Home</a> / <a href="/compare">Comparisons</a> / <span>${comp.competitorName}</span></nav>
        <h1>${escapeHtml(metaFor(`/compare/${comp.slug}`).h1)}</h1>
        <p><strong>${escapeHtml(comp.tagline)}</strong></p>
        <p>${escapeHtml(comp.subtitle)}</p>
        <h2>${APP_NAME} vs ${escapeHtml(comp.competitorName)}, feature by feature</h2>
        <table>
          <thead><tr><th>Feature</th><th>${APP_NAME}</th><th>${escapeHtml(comp.competitorName)}</th></tr></thead>
          <tbody>
            ${comp.matrix
              .map(
                (row) =>
                  `<tr><td>${escapeHtml(row.feature)}</td><td>${escapeHtml(row.macrotrackr)}</td><td>${escapeHtml(row.competitor)}</td></tr>`
              )
              .join("")}
          </tbody>
        </table>
        <h2>Where ${APP_NAME} differs</h2>
        ${comp.keyDifferentiators
          .map(
            (diff) =>
              `<h3>${escapeHtml(diff.title)}</h3><p>${escapeHtml(diff.description)}</p>`
          )
          .join("")}
        <h2>Questions</h2>
        ${comp.faqs
          .map(
            (faq) =>
              `<h3>${escapeHtml(faq.question)}</h3><p>${escapeHtml(faq.answer)}</p>`
          )
          .join("")}
        <p><a href="/migrate/${comp.slug}">How to import your ${escapeHtml(comp.competitorName)} history</a></p>
        <p><a href="/tools">Free calculators: work out your targets</a></p>
        <p><a href="/register">Get Started Free with ${APP_NAME}</a></p>
      </main>
    `,
  });
}

for (const migration of migrations) {
  pages.push({
    route: `migrate/${migration.slug}`,
    ...metaFor(`/migrate/${migration.slug}`),
    canonical: `${APP_URL}/migrate/${migration.slug}`,
    type: "article",
    bodyHtml: `
      <main style="padding:2rem 1rem;max-width:800px;margin:0 auto;">
        <nav><a href="/">Home</a> / <a href="/migrate">Migration guides</a> / <span>${escapeHtml(migration.sourceName)}</span></nav>
        <h1>${escapeHtml(metaFor(`/migrate/${migration.slug}`).h1)}</h1>
        <p>${escapeHtml(migration.summary)}</p>
        <h2>Export from ${escapeHtml(migration.sourceName)}</h2>
        <ol>
          ${migration.exportSteps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}
        </ol>
        <p><strong>Before you export:</strong> ${escapeHtml(migration.caveat)}</p>
        <h2>Preview, then import</h2>
        <p>${escapeHtml(migration.fileGuidance)} Nothing is written until you confirm the preview.</p>
        <p><a href="${escapeAttr(migration.officialExportUrl)}">Official ${escapeHtml(migration.sourceName)} export instructions</a></p>
        <p><a href="/compare/${migration.slug}">${APP_NAME} compared with ${escapeHtml(migration.sourceName)}</a></p>
        <h2>Now set your targets</h2>
        <p>Your history tells you what you have been eating. These work out what you should be, and need no account.</p>
        <ul>
          <li><a href="/tools/tdee-calculator">TDEE calculator</a></li>
          <li><a href="/tools/macro-calculator">Macro calculator</a></li>
          <li><a href="/tools">All free calculators</a></li>
        </ul>
        <p><a href="/register?returnTo=%2Fsettings%3Ftab%3Ddata%26from%3Dmigration">Create an account and open the importer</a></p>
      </main>
    `,
  });
}

// Add blog posts
for (const post of blogPosts) {
  pages.push({
    route: `blog/${post.slug}`,
    title: `${post.title} — ${APP_NAME}`,
    description: post.excerpt,
    canonical: `${APP_URL}/blog/${post.slug}`,
    type: "article",
    // The hero only enters the DOM once React hydrates, around 5s on a
    // throttled phone, so the fetch started far too late to serve LCP.
    preloadImage: post.image,
    bodyHtml: `
      <main style="padding:2rem 1rem;max-width:800px;margin:0 auto;">
        <nav><a href="/">Home</a> / <a href="/blog">Blog</a> / <span>${post.title}</span></nav>
        <h1>${post.title}</h1>
        <p>Published on ${post.date} by ${post.author || APP_NAME}</p>
        <p>${post.excerpt}</p>
        <article>${renderMarkdownBody(post.slug)}</article>
      </main>
    `,
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

  // No JSON-LD is injected here. The React pages emit their own on mount, and
  // emitting it from both places shipped two BlogPosting blocks per article and
  // two BreadcrumbList blocks per comparison, each pair disagreeing.

  // Keep crawler copy available when JavaScript is disabled without letting it
  // flash before the client-rendered app mounts.
  if (page.bodyHtml) {
    html = html.replace(
      "</noscript>",
      `${page.bodyHtml}${siteNavHtml}\n    </noscript>`
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
