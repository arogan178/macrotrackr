#!/usr/bin/env node
import { execSync } from "child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { basename, join } from "path";

const DIST_DIR = join(process.cwd(), "dist");
// The browser must fetch the entry script *and* every chunk the same document
// modulepreloads before the app can run, so the budget covers all of them.
// Measuring the entry alone reported 124KB while the real cost was 301KB, which
// is why this never fired. Pinned at today's figure: ratchet it down, do not
// raise it. Deferring Clerk off the public routes is worth about 77KB.
const CRITICAL_PATH_THRESHOLD_KB = 310;
const TOTAL_BUNDLE_THRESHOLD_KB = 2000; // Alert if total JS > 2MB

function getGzippedSize(filePath) {
  // Check if .gz file exists
  const gzPath = filePath + ".gz";
  if (existsSync(gzPath)) {
    return statSync(gzPath).size;
  }
  // Estimate gzip ratio (~33% of original)
  return Math.floor(statSync(filePath).size * 0.33);
}

/**
 * Every JS file the document makes the browser fetch before it can run: the
 * entry script plus each `modulepreload`. Vite emits a preload for each static
 * dependency of the entry, so these load together, not lazily.
 */
function getCriticalPathChunks() {
  const indexHtmlPath = join(DIST_DIR, "index.html");

  if (!existsSync(indexHtmlPath)) {
    return [];
  }

  const indexHtml = readFileSync(indexHtmlPath, "utf8");
  const entry = indexHtml.match(
    /<script[^>]*type="module"[^>]*src="([^"]+\.js)"/,
  );
  const preloads = [
    ...indexHtml.matchAll(
      /<link[^>]*rel="modulepreload"[^>]*href="([^"]+\.js)"/g,
    ),
  ].map((match) => match[1]);

  return [...(entry ? [entry[1]] : []), ...preloads].map((href) =>
    basename(href),
  );
}

function getBundleSizes() {
  const statsPath = join(DIST_DIR, "stats.html");
  if (!existsSync(statsPath)) {
    console.log("Building with bundle analysis...");
    execSync("npm run build", { stdio: "inherit" });
  }

  // Get actual file sizes from dist/assets
  const assetsPath = join(DIST_DIR, "assets");

  if (!existsSync(assetsPath)) {
    console.error(
      "Error: dist/assets directory not found. Make sure to run build first.",
    );
    process.exit(1);
  }

  console.log("\nBundle Sizes (gzipped):");
  console.log("==========================");

  // Read all JS files and get their sizes
  const files = readdirSync(assetsPath);
  const jsFiles = files.filter((f) => f.endsWith(".js"));

  // Sort by size (largest first)
  const fileSizes = jsFiles
    .map((name) => {
      const filePath = join(assetsPath, name);
      const rawSize = statSync(filePath).size;
      const gzipSize = getGzippedSize(filePath);
      return { name, rawSize, gzipSize };
    })
    .sort((a, b) => b.gzipSize - a.gzipSize);

  let totalRaw = 0;
  let totalGzip = 0;

  const criticalChunkNames = getCriticalPathChunks();
  const criticalChunks = criticalChunkNames
    .map((name) => fileSizes.find((file) => file.name === name))
    .filter(Boolean);
  const criticalGzip = criticalChunks.reduce(
    (total, chunk) => total + chunk.gzipSize,
    0,
  );
  const criticalGzipKB = (criticalGzip / 1024).toFixed(2);

  for (const { name, rawSize, gzipSize } of fileSizes) {
    const rawKB = (rawSize / 1024).toFixed(2);
    const gzipKB = (gzipSize / 1024).toFixed(2);
    totalRaw += rawSize;
    totalGzip += gzipSize;
    console.log(`  ${name}: ${gzipKB} KB (raw: ${rawKB} KB)`);
  }

  const totalRawKB = (totalRaw / 1024).toFixed(2);
  const totalGzipKB = (totalGzip / 1024).toFixed(2);

  console.log("\nCritical path (entry + modulepreloads):");
  for (const chunk of criticalChunks) {
    console.log(`  ${chunk.name}: ${(chunk.gzipSize / 1024).toFixed(2)} KB`);
  }
  console.log(
    `  = ${criticalGzipKB} KB gzipped across ${criticalChunks.length} files`,
  );
  console.log(
    `Total JS Size: ${totalGzipKB} KB gzipped (${totalRawKB} KB raw)`,
  );

  // Check thresholds
  let hasWarning = false;

  if (criticalChunks.length === 0) {
    console.log("\nWARNING: could not resolve the critical path from index.html");
    hasWarning = true;
  } else if (criticalGzip / 1024 > CRITICAL_PATH_THRESHOLD_KB) {
    console.log(
      `\nWARNING: critical path (${criticalGzipKB} KB) exceeds ${CRITICAL_PATH_THRESHOLD_KB} KB threshold`,
    );
    hasWarning = true;
  }

  if (totalGzip / 1024 > TOTAL_BUNDLE_THRESHOLD_KB) {
    console.log(
      `\nWARNING: Total bundle size (${totalGzipKB} KB) exceeds ${TOTAL_BUNDLE_THRESHOLD_KB} KB threshold`,
    );
    hasWarning = true;
  }

  if (hasWarning) {
    process.exit(1);
  }

  console.log("\nBundle sizes within thresholds");
  console.log(
    `   Critical path: ${criticalGzipKB} KB < ${CRITICAL_PATH_THRESHOLD_KB} KB threshold`,
  );
  console.log(
    `   Total bundle: ${totalGzipKB} KB < ${TOTAL_BUNDLE_THRESHOLD_KB} KB threshold`,
  );
}

getBundleSizes();
