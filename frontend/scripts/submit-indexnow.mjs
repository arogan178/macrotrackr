#!/usr/bin/env node
/**
 * Tells Bing, Yandex and the other IndexNow participants that the site changed.
 *
 * Google's sitemap ping was retired, and Bing's returns 410 Gone, so this is
 * the only remaining way to push rather than wait for a crawl. The key is
 * public by design: IndexNow verifies ownership by fetching
 * https://<host>/<key>.txt and checking it contains the key.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const host = (process.env.INDEXNOW_HOST || "https://macrotrackr.com").replace(/\/$/, "");
const publicDir = path.resolve(__dirname, "..", "public");

const keyFile = fs
  .readdirSync(publicDir)
  .find((name) => /^[a-f\d]{8,128}\.txt$/i.test(name));

if (!keyFile) {
  console.error("No IndexNow key file in frontend/public. Nothing submitted.");
  process.exit(1);
}

const key = keyFile.replace(/\.txt$/, "");

const sitemapPath = path.join(publicDir, "sitemap.xml");
if (!fs.existsSync(sitemapPath)) {
  console.error("No sitemap.xml; run generate-sitemap.js first.");
  process.exit(1);
}

const urlList = [
  ...fs.readFileSync(sitemapPath, "utf8").matchAll(/<loc>(.*?)<\/loc>/g),
].map((match) => match[1]);

if (urlList.length === 0) {
  console.error("Sitemap contained no URLs.");
  process.exit(1);
}

const payload = {
  host: new URL(host).host,
  key,
  keyLocation: `${host}/${keyFile}`,
  urlList,
};

const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify(payload),
});

// 200 accepts, 202 accepts pending key validation. Both are success.
if (response.status !== 200 && response.status !== 202) {
  console.error(
    `IndexNow rejected the submission: ${response.status} ${await response.text()}`,
  );
  process.exit(1);
}

console.log(`IndexNow accepted ${urlList.length} URLs (${response.status}).`);
