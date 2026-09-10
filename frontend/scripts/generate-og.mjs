// Renders public/og.png, the 1200x630 card X, Slack, iMessage and LinkedIn
// show when a macrotrackr.com link is pasted.
//
//   node scripts/generate-og.mjs
//
// Chromium rather than a canvas or an SVG rasteriser, because the card is set
// in Archivo's condensed cut and only a real text shaper gets the width axis,
// the tabular figures and the negative tracking right. The font is inlined as
// a data URI so the render does not depend on a running dev server.
//
// Rendered at 2x and downsampled, which is how the type stays crisp at the
// ~500px X actually displays the card at.

import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { chromium } from "@playwright/test";

const execFileAsync = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));

const WIDTH = 1200;
const HEIGHT = 630;
const OUT = resolve(__dirname, "..", "public", "og.png");

// The panel shows a real day: 148g protein and 171g carbs at 4 kcal, 55g fat
// at 9, which is the 1,771 above it. A card for a nutrition tracker whose
// numbers do not add up is the one mistake the audience will check.
const DAY = {
  calories: 1771,
  target: 2200,
  macros: [
    { name: "Protein", value: 148, target: 165, color: "var(--protein)" },
    { name: "Carbs", value: 171, target: 220, color: "var(--carbs)" },
    { name: "Fats", value: 55, target: 73, color: "var(--fats)" },
  ],
};

/** The mark is read from the app's own path constant, not re-copied. */
async function readBrandMark() {
  const source = await readFile(
    resolve(__dirname, "..", "src", "components", "layout", "BrandMarkPath.ts"),
    "utf8"
  );
  const viewBox = source.match(
    /BRAND_MARK_VIEW_BOX = \{ x: (\d+), y: (\d+), width: (\d+), height: (\d+) \}/u
  );
  const path = source.match(/BRAND_MARK_PATH =\s*"([^"]+)"/u);
  if (!viewBox || !path) throw new Error("Could not read the brand mark from BrandMarkPath.ts");
  return { viewBox: viewBox.slice(1, 5).join(" "), path: path[1] };
}

const pct = (value, target) => `${Math.round((value / target) * 100)}%`;

function macroRow({ name, value, target, color }) {
  return `
    <li class="macro">
      <div class="macro-line">
        <span class="macro-name"><i style="background:${color}"></i>${name}</span>
        <span class="macro-value">${value} <span class="macro-target">/ ${target} g</span></span>
      </div>
      <div class="bar bar-thin">
        <div class="fill" style="width:${pct(value, target)};background:${color}"></div>
      </div>
    </li>`;
}

function html({ font, mark }) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      @font-face {
        font-family: "Archivo";
        font-weight: 100 900;
        font-stretch: 62% 125%;
        src: url(data:font/woff2;base64,${font}) format("woff2");
      }

      :root {
        --background: #0c0a09;
        --surface: #141211;
        --border: #2b2724;
        --primary: #57c04a;
        --muted: #aba49c;
        --protein: #34d399;
        --carbs: #60a5fa;
        --fats: #facc15;
      }

      * { margin: 0; padding: 0; box-sizing: border-box; }

      body {
        width: ${WIDTH}px;
        height: ${HEIGHT}px;
        display: flex;
        align-items: center;
        gap: 56px;
        padding: 0 72px;
        background: var(--background);
        color: #fff;
        font-family: "Archivo";
        font-variant-numeric: tabular-nums;
        -webkit-font-smoothing: antialiased;
        overflow: hidden;
      }

      .copy {
        width: 600px;
        display: flex;
        flex-direction: column;
        gap: 34px;
      }

      .lockup {
        display: flex;
        align-items: center;
        gap: 13px;
        font-size: 27px;
        font-weight: 700;
        letter-spacing: -0.01em;
      }
      .lockup svg { height: 32px; width: auto; }

      h1 {
        font-size: 76px;
        font-weight: 700;
        font-stretch: 78%;
        line-height: 0.95;
        letter-spacing: -0.015em;
      }
      h1 span { color: var(--muted); }

      p {
        font-size: 23px;
        line-height: 1.45;
        color: rgba(255, 255, 255, 0.72);
        max-width: 440px;
      }

      .pill {
        align-self: flex-start;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 9px 18px;
        border: 1px solid var(--border);
        border-radius: 999px;
        background: #1b1917;
        font-size: 18px;
        color: var(--muted);
      }
      .pill i {
        width: 9px;
        height: 9px;
        border-radius: 999px;
        background: var(--primary);
      }

      .panel {
        width: 400px;
        padding: 30px 32px 32px;
        border: 1px solid var(--border);
        border-radius: 16px;
        background: var(--surface);
      }

      .panel-label {
        font-size: 13px;
        font-weight: 600;
        letter-spacing: 0.1em;
        color: var(--muted);
      }

      .kcal {
        display: flex;
        align-items: baseline;
        gap: 9px;
        margin-top: 8px;
      }
      .kcal strong {
        font-size: 62px;
        font-weight: 700;
        font-stretch: 78%;
        line-height: 1;
        letter-spacing: -0.02em;
      }
      .kcal span { font-size: 21px; color: var(--muted); }

      .bar {
        height: 6px;
        border-radius: 999px;
        background: var(--border);
        overflow: hidden;
      }
      .bar-thin { height: 4px; }
      .fill { height: 100%; border-radius: 999px; }

      .kcal + .bar { margin: 20px 0 28px; }

      .macros { list-style: none; display: flex; flex-direction: column; gap: 19px; }
      .macro-line {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 9px;
      }
      .macro-name {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 19px;
        color: rgba(255, 255, 255, 0.85);
      }
      .macro-name i { width: 8px; height: 8px; border-radius: 999px; }
      .macro-value { font-size: 19px; }
      .macro-target { color: var(--muted); }
    </style>
  </head>
  <body>
    <div class="copy">
      <div class="lockup">
        <svg viewBox="${mark.viewBox}"><path d="${mark.path}" fill="var(--primary)" fill-rule="evenodd" /></svg>
        MacroTrackr
      </div>
      <h1>Know what you ate.<br /><span>Without the admin.</span></h1>
      <p>Log meals in seconds, set a macro split, and see where the week actually went.</p>
      <div class="pill"><i></i>Free · no card · open source</div>
    </div>

    <div class="panel">
      <div class="panel-label">CALORIES</div>
      <div class="kcal">
        <strong>${DAY.calories.toLocaleString("en-US")}</strong>
        <span>of ${DAY.target.toLocaleString("en-US")}</span>
      </div>
      <div class="bar">
        <div class="fill" style="width:${pct(DAY.calories, DAY.target)};background:var(--primary)"></div>
      </div>
      <ul class="macros">${DAY.macros.map(macroRow).join("")}</ul>
    </div>
  </body>
</html>`;
}

const [font, mark] = await Promise.all([
  readFile(resolve(__dirname, "..", "public", "fonts", "archivo-latin-variable.woff2"), "base64"),
  readBrandMark(),
]);

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: WIDTH, height: HEIGHT },
  deviceScaleFactor: 2,
});
await page.setContent(html({ font, mark }), { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
const shot = await page.screenshot({ type: "png" });
await browser.close();

await writeFile(OUT, shot);
await execFileAsync("magick", [OUT, "-resize", `${WIDTH}x${HEIGHT}`, "-strip", OUT]);

const { size } = await import("node:fs/promises").then((fs) => fs.stat(OUT));
console.log(`public/og.png — ${WIDTH}x${HEIGHT}, ${(size / 1024).toFixed(0)} KB`);
