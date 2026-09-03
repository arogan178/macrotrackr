#!/usr/bin/env node
/**
 * A ratchet, not a gate.
 *
 * Every symptom the UI plan describes was found by counting, not by looking:
 * 7 radii, ~20 surface fills, 12 hairlines, 18 heading class strings. None of
 * them was a bad decision at the time — each was a reasonable local choice made
 * because the system had no obvious place to put the thing.
 *
 * These numbers may fall freely. They may not rise without editing
 * ui-budgets.json in the same change, which makes the decision visible in
 * review rather than invisible in a diff.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SOURCE = path.join(ROOT, "src");
const BUDGETS = JSON.parse(
  readFileSync(path.join(ROOT, "ui-budgets.json"), "utf8"),
);

const listFiles = (directory) => {
  const files = [];
  for (const entry of readdirSync(directory)) {
    const full = path.join(directory, entry);
    if (statSync(full).isDirectory()) {
      files.push(...listFiles(full));
    } else if (/\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry)) {
      files.push(full);
    }
  }

  return files;
};

const files = listFiles(SOURCE);
const sources = files.map((file) => readFileSync(file, "utf8"));
const all = sources.join("\n");

/**
 * Comments stripped, so a budget measures colour the browser paints rather than
 * prose about colour. Several of these files explain in a doc comment which hex
 * they used to hold and why it was wrong, which is worth keeping and is not
 * drift. Block comments go first, then whole-line `//` comments — a trailing
 * comment after code is left alone rather than risk eating a `https://` URL.
 */
const code = sources
  .map((source) =>
    source.replaceAll(/\/\*[\s\S]*?\*\//g, "").replaceAll(/^\s*\/\/.*$/gm, ""),
  )
  .join("\n");

const countMatches = (pattern) => (all.match(pattern) ?? []).length;
const countCode = (pattern) => (code.match(pattern) ?? []).length;
const countDistinct = (pattern) => new Set(all.match(pattern) ?? []).size;
const countFiles = (needle) =>
  sources.filter((source) => source.includes(needle)).length;

const measurements = {
  // Three radii: controls, cards, pills. Nothing else.
  radii: countDistinct(/\brounded-(?:control|card|full)\b/g),
  // Only class strings: `rounded="card"` is the Skeleton prop, not a utility.
  legacyRadii: countMatches(/\brounded-(?:sm|md|lg|xl|2xl|3xl)\b/g),
  // Four opaque surface steps, no alpha.
  //
  // Longest alternative first, and the reason is not style. `-` is a word
  // boundary, so with `surface` listed ahead of `surface-2` the engine matches
  // `bg-surface-2` as `bg-surface` and stops. Three of the four steps collapsed
  // into one, the distinct count could not exceed 2 against a budget of 4, and
  // the line printed `ratchet this down` for a counter measuring nothing — a
  // `bg-surface-4` would have entered the codebase silently. Any alternation
  // here whose branches share a prefix has to run longest-first.
  surfaces: countDistinct(/\bbg-(?:background|surface-2|surface-3|surface)\b/g),
  surfaceAlpha: countMatches(/\bbg-(?:surface|surface-2|surface-3)\/\d+\b/g),
  // Two hairlines.
  hairlineAlpha: countMatches(/\bborder-(?:border|border-2|white)\/\d+\b/g),
  // Motion. The first version of this budget counted files importing
  // motion/react and asked for 20. That measured the wrong thing: it is
  // satisfied by deleting motion that was doing its job, and violated by a
  // system with perfect motion spread across many components. Every other
  // budget here counts *distinct values*, because inventing a value at a call
  // site is the drift. Motion gets measured the same way.
  //
  // Seconds-scale only — `duration: 8000` is a toast timer, not an animation.
  motionDurations: countDistinct(/\bduration: (?:[0-4](?:\.\d+)?)\b/g),
  motionEasings: countDistinct(/\bease: (?:"[a-zA-Z]+"|\[[\d.,\s]+\])/g),
  // A call site declaring its own initial/animate is how 23 durations happened.
  // Intent belongs in <Reveal>; numbers belong in DURATIONS/EASINGS.
  motionCallSites: countFiles("initial={{"),
  // `layout`/`layoutId` re-measure on every render and reflow the content being
  // read. Never inside a virtualized list, which measures rows itself.
  layoutProjection: countMatches(/\blayoutId=|^\s+layout$/gm),
  // Loose backstop only. Not the headline.
  motionFiles: countFiles("motion/react"),
  // 100vh on iOS measures the viewport as if the browser chrome were not there,
  // so a min-h-screen page is taller than the screen and pans under the toolbar.
  // min-h-dvh is the replacement. The three shells are converted; this counts
  // what is left, on landing, blog and legal pages, so the next page cannot add
  // another spelling of full height without the decision showing up in review.
  // The budget is the count on master, which is one above what this branch
  // measures on its own: the landing DeleteAccountPage and the extracted
  // AuthLoadingScreen landed while this was open, and the check runs on the
  // merge. Pinning a new counter to a stale base fails it on arrival.
  legacyViewportHeight: countMatches(/\bmin-h-screen\b/g),
  // One breakpoint was doing all the work; this should keep falling as density
  // moves into the primitives.
  smOverrides: countMatches(/\bsm:/g),
  // Blur costs a compositing layer per element and samples an opaque page
  // everywhere except a genuine overlay.
  backdropBlur: countMatches(/\bbackdrop-blur-/g),
  // Shadows cannot render on #000; only the modal keeps one. The arbitrary form
  // is counted too: 95 hex literals of Clerk theming hid a drop shadow behind
  // `shadow-[0_25px_50px_...]`, which the keyword-only pattern missed.
  shadows: countMatches(/\bshadow-(?:sm|md|lg|xl|2xl)\b|\bshadow-\[/g),
  // A colour written as a literal cannot follow a token change. Two files
  // transcribed the whole palette by hand and both were still on the
  // pre-Phase-9 values: the snapshot PNG drew rose fats against the app's
  // yellow, and Clerk themed the auth screens in the old green over cool greys.
  // What remains is the floor: the 15-value fallback in designTokens.ts, which
  // a test holds equal to style.css, and Google's six brand colours, which are
  // theirs and not ours to tokenise. Comments are stripped before counting, so
  // a doc comment naming the hex a file used to hold does not count against it.
  hexLiterals: countCode(/#[\dA-Fa-f]{6}\b/g),
  // Emoji are not part of the UI vocabulary. Badges shipped with 🔥, 🎯 and ⚡.
  emoji: countMatches(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu),
  // One spelling for a figure. A daily target shipped as both "2000 kcal" and
  // "2,000 kcal", and the split ran through the primitive meant to prevent it:
  // `Value` grouped via toLocaleString, the `AnimatedNumber` it delegates to
  // did not, so adding `animate` changed the spelling. Every separator comes
  // from `formatGrouped` now; a call site formatting for itself is the drift.
  // The no-argument form only: `date.toLocaleString("en-US", {...})` in the
  // reporting queries formats a month label, which is not a figure and not
  // this counter's business. formatNumber.ts is excluded as the implementation.
  adHocNumberFormat: files.reduce(
    (total, file, index) =>
      /lib[/\\]formatNumber\.ts$/.test(file)
        ? total
        : total + (sources[index].match(/\.toLocaleString\(\)/g) ?? []).length,
    0,
  ),
  // The other half of the same rule. `adHocNumberFormat` catches a call site
  // reaching for `toLocaleString`; this catches one that formats by not
  // formatting — `{tdee} kcal`, which prints "2841 kcal" beside a "2,841 kcal"
  // two components away. Both JSX and template-literal forms, because the
  // sweep found the split in both. Anything printing a figure next to a
  // calorie unit goes through `formatGrouped`.
  //
  // Counted by matching then filtering rather than by subtracting two patterns:
  // `{" "}` is JSX's explicit space, so `{formatGrouped(tdee)}{" "}\nkcal` puts
  // a bare `{" "}` directly before the unit and a subtracting pattern scores it
  // as raw. The expression itself has to be inspected.
  rawCalorieFigures: (() => {
    const figureBeforeUnit =
      /\{[^{}\n]{1,70}\}\s*(?:\{" "\})?\s*(?:kcal|calories|cal\/)|\$\{[^}\n]{1,70}\}\s*(?:kcal|calories)/g;

    return (code.match(figureBeforeUnit) ?? []).filter(
      (match) => !match.includes("formatGrouped") && !/^\{"\s*"\}/.test(match),
    ).length;
  })(),
  // TYPE_SCALE stops at font-semibold except for its two display steps, so
  // font-bold outside Heading/Value is a call site inventing a weight. Heading
  // and Value are excluded because they define the scale.
  boldOutsideScale: files.reduce(
    (total, file, index) =>
      /components[/\\]ui[/\\](?:Heading|Value)\.tsx$/.test(file)
        ? total
        : total + (sources[index].match(/\bfont-bold\b/g) ?? []).length,
    0,
  ),
};

let failed = false;
const rows = [];

for (const [key, budget] of Object.entries(BUDGETS.budgets)) {
  const actual = measurements[key];
  if (actual === undefined) {
    rows.push(`  ?  ${key}: no measurement defined`);
    continue;
  }

  const ok = actual <= budget;
  if (!ok) failed = true;
  rows.push(
    `  ${ok ? "ok" : "!!"} ${key}: ${actual} (budget ${budget})${
      actual < budget ? " — ratchet this down" : ""
    }`,
  );
}

console.log("UI budgets");
console.log(rows.join("\n"));

if (failed) {
  console.error(
    "\nA budget went up. Either put it back, or raise the number in " +
      "ui-budgets.json in this same change so the trade-off is reviewable.",
  );
  process.exit(1);
}
