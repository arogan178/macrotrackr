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

const baseTemplate = fs
  .readFileSync(templatePath, "utf8")
  .replace(
    /<script(?![^>]*\bdata-cfasync=)([^>]*\btype=["']module["'])/i,
    '<script data-cfasync="false"$1'
  );

// Load comparisons catalog
const comparisons = [
  {
    slug: "myfitnesspal",
    shortTitle: "MyFitnessPal Alternative",
    title: `Best Free MyFitnessPal Alternative Without Ads (2026) — ${APP_NAME}`,
    description: `Looking for a MyFitnessPal alternative? ${APP_NAME} offers 100% free barcode scanning, zero banner ads, rapid logging, and self-hosted privacy.`,
    heading: "The Clean, Free Alternative to MyFitnessPal",
    tagline: "Free barcode scanning, zero ads, no locked macro goals, and open-source self-hosting.",
    competitorName: "MyFitnessPal",
    priceNote: "$19.99/mo or $79.99/yr for Premium",
    verdict: `${APP_NAME} provides a fast, privacy-focused alternative to MyFitnessPal with free barcode scanning and custom macro targets out of the box.`,
    faqs: [
      {
        q: "Is barcode scanning really free on MacroTrackr?",
        a: "Yes. Barcode scanning on MacroTrackr uses the OpenFoodFacts global database and is 100% free forever without requiring a premium subscription.",
      },
      {
        q: "Can I self-host MacroTrackr on my own server?",
        a: "Yes. MacroTrackr is fully open source (AGPLv3) and can be deployed with Docker in under 60 seconds on any Linux server, VPS, or Raspberry Pi.",
      },
      {
        q: "How does MacroTrackr compare in logging speed?",
        a: "MacroTrackr is built with optimistic UI updates and zero ad networks, making meal logging 2-3x faster than heavy ad-supported commercial apps.",
      },
    ],
  },
  {
    slug: "macrofactor",
    shortTitle: "MacroFactor Alternative",
    title: `Free & Open Source MacroFactor Alternative — ${APP_NAME}`,
    description: `Compare ${APP_NAME} with MacroFactor. Get weekly macro trend tracking, responsive smart averages, and clean analytics without a monthly fee.`,
    heading: "Smart Macro Tracking Without the Expensive Subscription",
    tagline: "Weekly average analytics and smooth macro targets with an open-source core.",
    competitorName: "MacroFactor",
    priceNote: "$11.99/mo or $71.99/yr (No Free Tier)",
    verdict: `${APP_NAME} offers clean weekly averages and goal tracking for athletes and fitness enthusiasts who want total control over their targets without a paid subscription.`,
    faqs: [
      {
        q: "Does MacroTrackr have a free tier unlike MacroFactor?",
        a: "Yes. MacroTrackr is free to self-host and has a generous free tier with zero trial expiration, whereas MacroFactor requires a paid subscription after a 7-day trial.",
      },
    ],
  },
  {
    slug: "cronometer",
    shortTitle: "Cronometer Alternative",
    title: `Lightweight Cronometer Alternative — ${APP_NAME}`,
    description: `A fast, distraction-free alternative to Cronometer. Focus on calories and macros without spreadsheet clutter or bloated menus.`,
    heading: "Streamlined Nutrition Tracking Without the Clutter",
    tagline: "Fast macro tracking focused on energy and protein balance without overwhelming micro-nutrient tables.",
    competitorName: "Cronometer",
    priceNote: "$9.99/mo or $59.99/yr for Gold",
    verdict: `${APP_NAME} focuses on macro balance and fast meal logging with a clean, modern interface that avoids spreadsheet fatigue.`,
    faqs: [
      {
        q: "Why choose MacroTrackr over Cronometer?",
        a: "If your goal is tracking daily calories, protein, carbs, and fats without managing 80+ micronutrient progress bars, MacroTrackr gets you logged and out in seconds.",
      },
    ],
  },
  {
    slug: "lose-it",
    shortTitle: "Lose It! Alternative",
    title: `Best Ad-Free Lose It! Alternative — ${APP_NAME}`,
    description: `Compare ${APP_NAME} with Lose It! Track custom protein, carb, and fat gram targets without paywalls, upsells, or intrusive ads.`,
    heading: "Ad-Free Calorie & Macro Tracking with Custom Gram Splits",
    tagline: "Lock in your exact macro gram splits without paying for a premium unlock.",
    competitorName: "Lose It!",
    priceNote: "$39.99/yr for Premium",
    verdict: `${APP_NAME} provides custom gram goals and comprehensive macro analytics on the free tier with zero banner advertisements.`,
    faqs: [
      {
        q: "Can I customize exact macro gram targets in MacroTrackr for free?",
        a: "Yes. Setting custom gram goals and dynamic percentage splits is completely free on MacroTrackr.",
      },
    ],
  },
];

const migrations = [
  {
    slug: "myfitnesspal",
    sourceName: "MyFitnessPal",
    title: `Import MyFitnessPal History into ${APP_NAME}`,
    description: `Move your MyFitnessPal nutrition CSV into ${APP_NAME}, preview the detected meals, and keep tracking without starting over.`,
  },
  {
    slug: "cronometer",
    sourceName: "Cronometer",
    title: `Import Cronometer History into ${APP_NAME}`,
    description: `Move your Cronometer servings CSV into ${APP_NAME} and verify the detected meals before saving them.`,
  },
  {
    slug: "macrofactor",
    sourceName: "MacroFactor",
    title: `Import MacroFactor History into ${APP_NAME}`,
    description: `Move your MacroFactor granular nutrition export into ${APP_NAME} without losing your existing tracking history.`,
  },
  {
    slug: "lose-it",
    sourceName: "Lose It!",
    title: `Import Lose It! History into ${APP_NAME}`,
    description: `Move your Lose It! food log into ${APP_NAME}, preview the detected entries, and continue tracking without starting over.`,
  },
];

// Tools catalog
const tools = [
  {
    slug: "tdee-calculator",
    title: `Free TDEE Calculator — Total Daily Energy Expenditure | ${APP_NAME}`,
    description: "Calculate your Total Daily Energy Expenditure (TDEE) based on your BMR, activity level, and fitness goals with MacroTrackr's free calculator.",
    heading: "Free TDEE Calculator",
    subtitle: "Calculate your Total Daily Energy Expenditure and baseline daily calorie burn.",
  },
  {
    slug: "bmr-calculator",
    title: `Free BMR Calculator — Basal Metabolic Rate | ${APP_NAME}`,
    description: "Find your Basal Metabolic Rate (BMR) using the Mifflin-St Jeor formula. Free, accurate, and instant.",
    heading: "Free BMR Calculator",
    subtitle: "Determine your Basal Metabolic Rate — the calories your body burns at rest.",
  },
  {
    slug: "macro-calculator",
    title: `Free Macro Calculator — Protein, Carbs & Fat Targets | ${APP_NAME}`,
    description: "Calculate optimal daily grams of protein, fats, and carbs for fat loss, muscle gain, or body recomposition.",
    heading: "Free Macro Calculator",
    subtitle: "Determine your exact macronutrient breakdown in grams tailored to your fitness objective.",
  },
  {
    slug: "weight-loss-calculator",
    title: `Free Weight Loss Timeline Calculator | ${APP_NAME}`,
    description: "Estimate your realistic weight loss timeline, required daily caloric deficit, and projected goal date.",
    heading: "Free Weight Loss Calculator",
    subtitle: "Calculate your target calorie deficit and project your realistic goal timeline.",
  },
  {
    slug: "protein-calculator",
    title: `Free Protein Intake Calculator | ${APP_NAME}`,
    description: "Calculate optimal daily protein intake in grams for muscle building, fat loss, or endurance training.",
    heading: "Free Protein Calculator",
    subtitle: "Calculate your optimal daily protein target in grams based on body weight and activity.",
  },
];

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

// Build all pages to pre-render
const pages = [
  {
    route: "",
    title: `${APP_NAME} — Know what you ate, without the admin`,
    description: "Log meals in seconds, set a macro split, and see where the week actually went. Free, open source, and self-hostable nutrition tracker.",
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
    title: `Pricing — Transparent & Fair | ${APP_NAME}`,
    description: "Free forever for self-hosters and core tracking. $4/month cloud sync for multi-device convenience.",
    canonical: `${APP_URL}/pricing`,
    type: "website",
    bodyHtml: `
      <main style="padding:2rem 1rem;max-width:800px;margin:0 auto;">
        <h1>${APP_NAME} Pricing</h1>
        <p>100% Free & Open Source for self-hosting. Optional cloud sync at $4/month.</p>
      </main>
    `,
  },
  {
    route: "privacy",
    title: `Privacy Policy — ${APP_NAME}`,
    description: `How ${APP_NAME} protects your health data and respects your privacy.`,
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
    title: `Delete your account — ${APP_NAME}`,
    description: `How to permanently delete your ${APP_NAME} account and all associated data.`,
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
    title: `Terms of Service — ${APP_NAME}`,
    description: `Terms and conditions for using ${APP_NAME}.`,
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
    title: `Free Nutrition Calculators — TDEE, BMR, Macros & Protein | ${APP_NAME}`,
    description: "Free evidence-based fitness and nutrition calculators. Calculate your TDEE, BMR, optimal macros, weight loss timeline, and protein target.",
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
    route: "compare",
    title: `Best Free Alternatives & Comparisons — ${APP_NAME}`,
    description: `Compare ${APP_NAME} against MyFitnessPal, MacroFactor, Cronometer, and Lose It. See why users choose our ad-free, open-source nutrition tracker.`,
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
    title: `Import Your Nutrition History — ${APP_NAME}`,
    description: `Move meal history from MyFitnessPal, Cronometer, MacroFactor, or Lose It into ${APP_NAME} with a preview before anything is saved.`,
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
    title: `Blog & Product Updates — ${APP_NAME}`,
    description: "Nutrition guides, macro tracking strategies, product release notes, and updates from the MacroTrackr team.",
    canonical: `${APP_URL}/blog`,
    type: "website",
    bodyHtml: `
      <main style="padding:2rem 1rem;max-width:800px;margin:0 auto;">
        <h1>${APP_NAME} Blog & Release Notes</h1>
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
    title: tool.title,
    description: tool.description,
    canonical: `${APP_URL}/tools/${tool.slug}`,
    type: "website",
    bodyHtml: `
      <main style="padding:2rem 1rem;max-width:800px;margin:0 auto;">
        <nav><a href="/">Home</a> / <a href="/tools">Calculators</a> / <span>${tool.heading}</span></nav>
        <h1>${tool.heading}</h1>
        <p>${tool.subtitle}</p>
        <p>${tool.description}</p>
        <p><a href="/register">Start Tracking with ${APP_NAME}</a></p>
      </main>
    `,
  });
}

// Add comparison pages
for (const comp of comparisons) {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: comp.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.a,
      },
    })),
  };

  const breadcrumbsSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: APP_URL },
      { "@type": "ListItem", position: 2, name: "Comparisons", item: `${APP_URL}/compare` },
      { "@type": "ListItem", position: 3, name: comp.shortTitle, item: `${APP_URL}/compare/${comp.slug}` },
    ],
  };

  pages.push({
    route: `compare/${comp.slug}`,
    title: comp.title,
    description: comp.description,
    canonical: `${APP_URL}/compare/${comp.slug}`,
    type: "article",
    extraHead: `
      <script type="application/ld+json">${JSON.stringify(breadcrumbsSchema)}</script>
      <script type="application/ld+json">${JSON.stringify(faqSchema)}</script>
    `,
    bodyHtml: `
      <main style="padding:2rem 1rem;max-width:800px;margin:0 auto;">
        <nav><a href="/">Home</a> / <a href="/compare">Comparisons</a> / <span>${comp.competitorName}</span></nav>
        <h1>${comp.heading}</h1>
        <p><strong>${comp.tagline}</strong></p>
        <h2>Quick Verdict</h2>
        <p>${comp.verdict}</p>
        <h2>Frequently Asked Questions</h2>
        ${comp.faqs.map((f) => `<div><h3>${f.q}</h3><p>${f.a}</p></div>`).join("")}
        <p><a href="/register">Get Started Free with ${APP_NAME}</a></p>
      </main>
    `,
  });
}

for (const migration of migrations) {
  pages.push({
    route: `migrate/${migration.slug}`,
    title: migration.title,
    description: migration.description,
    canonical: `${APP_URL}/migrate/${migration.slug}`,
    type: "article",
    bodyHtml: `
      <main style="padding:2rem 1rem;max-width:800px;margin:0 auto;">
        <nav><a href="/">Home</a> / <a href="/migrate">Migration guides</a> / <span>${migration.sourceName}</span></nav>
        <h1>${migration.title}</h1>
        <p>${migration.description}</p>
        <p><a href="/register?returnTo=%2Fsettings%3Ftab%3Ddata%26from%3Dmigration">Create an account and open the importer</a></p>
      </main>
    `,
  });
}

// Add blog posts
for (const post of blogPosts) {
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    author: {
      "@type": "Organization",
      name: post.author || APP_NAME,
    },
    publisher: {
      "@type": "Organization",
      name: APP_NAME,
      logo: `${APP_URL}/icon.png`,
    },
    mainEntityOfPage: `${APP_URL}/blog/${post.slug}`,
  };

  pages.push({
    route: `blog/${post.slug}`,
    title: `${post.title} — ${APP_NAME}`,
    description: post.excerpt,
    canonical: `${APP_URL}/blog/${post.slug}`,
    type: "article",
    extraHead: `<script type="application/ld+json">${JSON.stringify(articleSchema)}</script>`,
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

  // Inject Extra Head if present
  if (page.extraHead) {
    html = html.replace("</head>", `${page.extraHead}\n</head>`);
  }

  // Keep crawler copy available when JavaScript is disabled without letting it
  // flash before the client-rendered app mounts.
  if (page.bodyHtml) {
    html = html.replace(
      "</noscript>",
      `${page.bodyHtml}\n    </noscript>`
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
