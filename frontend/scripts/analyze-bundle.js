#!/usr/bin/env node
import { execSync } from "child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { basename, join } from "path";

const DIST_DIR = join(process.cwd(), "dist");
const INITIAL_BUNDLE_THRESHOLD_KB = 200; // Alert if initial JS > 200KB gzipped
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

function getEntryChunkName() {
  const indexHtmlPath = join(DIST_DIR, "index.html");

  if (!existsSync(indexHtmlPath)) {
    return null;
  }

  const indexHtml = readFileSync(indexHtmlPath, "utf8");
  const entryScriptMatch = indexHtml.match(
    /<script[^>]*type="module"[^>]*src="([^"]+\.js)"/,
  );

  if (!entryScriptMatch) {
    return null;
  }

  return basename(entryScriptMatch[1]);
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

  // Identify the actual entry bundle from dist/index.html rather than
  // assuming the largest index.* chunk is the initial page bundle.
  const entryChunkName = getEntryChunkName();
  const initialBundle = entryChunkName
    ? fileSizes.find((file) => file.name === entryChunkName)
    : null;
  const initialGzipKB = initialBundle
    ? (initialBundle.gzipSize / 1024).toFixed(2)
    : "N/A";

  for (const { name, rawSize, gzipSize } of fileSizes) {
    const rawKB = (rawSize / 1024).toFixed(2);
    const gzipKB = (gzipSize / 1024).toFixed(2);
    totalRaw += rawSize;
    totalGzip += gzipSize;
    console.log(`  ${name}: ${gzipKB} KB (raw: ${rawKB} KB)`);
  }

  const totalRawKB = (totalRaw / 1024).toFixed(2);
  const totalGzipKB = (totalGzip / 1024).toFixed(2);

  console.log(
    `\nInitial Bundle (${entryChunkName || "entry script not found"}): ${initialGzipKB} KB gzipped`,
  );
  console.log(
    `Total JS Size: ${totalGzipKB} KB gzipped (${totalRawKB} KB raw)`,
  );

  // Check thresholds
  let hasWarning = false;

  if (
    initialBundle &&
    initialBundle.gzipSize / 1024 > INITIAL_BUNDLE_THRESHOLD_KB
  ) {
    console.log(
      `\nWARNING: Initial bundle size (${initialGzipKB} KB) exceeds ${INITIAL_BUNDLE_THRESHOLD_KB} KB threshold`,
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
    `   Initial bundle: ${initialGzipKB} KB < ${INITIAL_BUNDLE_THRESHOLD_KB} KB threshold`,
  );
  console.log(
    `   Total bundle: ${totalGzipKB} KB < ${TOTAL_BUNDLE_THRESHOLD_KB} KB threshold`,
  );
}

getBundleSizes();
