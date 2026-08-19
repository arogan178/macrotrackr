import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * The preview and the PNG drifted because each owned its own copy of the
 * numbers, the palette and the wording. `macroSnapshot.ts` owns all three now.
 *
 * These are source assertions rather than render assertions on purpose: the
 * defect was not a wrong pixel, it was a second implementation existing at all.
 * A behavioural test would have to guess which value diverged next; this fails
 * the moment a renderer starts deciding for itself.
 */

const ROOT = join(import.meta.dirname, "..");
const CANVAS = join(ROOT, "utils/macroSnapshotCanvas.ts");
const MODAL = join(ROOT, "components/MacroSnapshotModal.tsx");

const read = (path: string) => readFileSync(path, "utf8");

const RENDERERS = [
  ["canvas export", CANVAS],
  ["preview modal", MODAL],
] as const;

describe("snapshot renderers own layout only", () => {
  it.each(RENDERERS)("%s hardcodes no colours", (_label, path) => {
    const source = read(path);
    // The canvas carried 57 hex literals, including a rose #f43f5e for fats
    // where the app's token is yellow. Colour comes from resolveSnapshotPalette
    // or a Tailwind token class, never a literal.
    const hexes = source.match(/#[\dA-Fa-f]{3,8}\b/g) ?? [];

    expect(hexes).toEqual([]);
  });

  it.each(RENDERERS)("%s derives no percentages", (_label, path) => {
    const source = read(path);
    // `x / target * 100` in a renderer is how the two disagreed about 113%.
    expect(source).not.toMatch(/\)\s*\*\s*100\s*\)/);
    expect(source).not.toMatch(/Math\.min\(\s*100/);
  });

  it.each(RENDERERS)("%s carries no emoji", (_label, path) => {
    expect(read(path)).not.toMatch(
      /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]|\u{FE0F}/u,
    );
  });

  it.each(RENDERERS)("%s builds the model rather than the data", (_label, path) => {
    expect(read(path)).toMatch(/buildSnapshotModel/);
  });

  it("keeps decorative gradients out of the export", () => {
    // Flat fills only, per the palette rules; the export had two radial glows
    // and three gradient bars the app has nowhere.
    const source = read(CANVAS);

    expect(source).not.toMatch(/createLinearGradient|createRadialGradient/);
  });

  it("keeps brochure copy out of both renderers", () => {
    for (const [, path] of RENDERERS) {
      const source = read(path);
      for (const phrase of [
        "Precision Nutrition",
        "Verified MacroTrackr Log",
        "Self-Hosted & Cloud",
        "Scorecard",
      ]) {
        expect(source, `${path} contains "${phrase}"`).not.toContain(phrase);
      }
    }
  });
});
