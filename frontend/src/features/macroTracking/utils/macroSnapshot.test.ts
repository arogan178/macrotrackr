import { describe, expect, it } from "vitest";

import {
  buildSnapshotModel,
  type MacroSnapshotData,
  resolveSnapshotPalette,
  SNAPSHOT_PALETTE_FALLBACK,
} from "./macroSnapshot";

const base: MacroSnapshotData = {
  dateLabel: "Aug 19, 2026",
  calories: 1222,
  calorieTarget: 2000,
  protein: 50,
  proteinTarget: 175,
  carbs: 181,
  carbsTarget: 160,
  fats: 33,
  fatsTarget: 73,
};

describe("buildSnapshotModel", () => {
  it("reports a macro over its target as the real figure", () => {
    // The reported case: 181g against a 160g target. The preview clamped this
    // to 100% while the exported PNG printed 113%.
    const carbs = buildSnapshotModel(base).macros.find((m) => m.key === "carbs");

    expect(carbs?.percentOfTarget).toBe(113);
  });

  it("clamps the bar but not the number", () => {
    const carbs = buildSnapshotModel(base).macros.find((m) => m.key === "carbs");

    expect(carbs?.barPercent).toBe(100);
    expect(carbs?.percentOfTarget).toBeGreaterThan(100);
  });

  it("computes calories from grams at 4/4/9", () => {
    const model = buildSnapshotModel(base);
    const byKey = Object.fromEntries(model.macros.map((m) => [m.key, m]));

    expect(byKey.protein.calories).toBe(200);
    expect(byKey.carbs.calories).toBe(724);
    expect(byKey.fats.calories).toBe(297);
    expect(model.totalMacroCalories).toBe(1221);
  });

  it("makes the energy split add up to 100 after rounding", () => {
    const total = buildSnapshotModel(base).macros.reduce(
      (sum, macro) => sum + macro.energyShare,
      0,
    );

    expect(total).toBe(100);
  });

  it("phrases the remainder for both directions", () => {
    expect(buildSnapshotModel(base).calorieRemainder).toBe("778 kcal left");
    expect(
      buildSnapshotModel({ ...base, calories: 2400 }).calorieRemainder,
    ).toBe("400 kcal over");
  });

  it("builds a badge without emoji", () => {
    expect(buildSnapshotModel({ ...base, streakDays: 7 }).badge).toBe(
      "7-day streak",
    );
    expect(
      buildSnapshotModel({ ...base, complianceScore: 92 }).badge,
    ).toBe("92% compliance");
    expect(buildSnapshotModel(base).badge).toBe("61% of target");

    for (const data of [
      { ...base, streakDays: 7 },
      { ...base, complianceScore: 92 },
      base,
    ]) {
      expect(buildSnapshotModel(data).badge).not.toMatch(
        /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u,
      );
    }
  });

  it("falls back to sane targets rather than dividing by zero", () => {
    const model = buildSnapshotModel({
      calories: 0,
      calorieTarget: 0,
      protein: 0,
      proteinTarget: 0,
      carbs: 0,
      carbsTarget: 0,
      fats: 0,
      fatsTarget: 0,
    });

    expect(model.calorieTarget).toBe(2000);
    expect(model.caloriePercent).toBe(0);
    expect(model.totalMacroCalories).toBe(0);
    expect(model.macros.every((m) => Number.isFinite(m.percentOfTarget))).toBe(
      true,
    );
  });

  it("slugifies the date for a filename", () => {
    expect(buildSnapshotModel(base).fileStem).toBe("aug-19-2026");
    expect(buildSnapshotModel({ ...base, dateLabel: "!!!" }).fileStem).toBe(
      "snapshot",
    );
  });

  it("states the day plainly in the share text", () => {
    const text = buildSnapshotModel(base).shareText;

    expect(text).toBe(
      "1,222 of 2,000 kcal — protein 50g, carbs 181g, fats 33g.",
    );
    expect(text).not.toMatch(/!/);
  });
});

describe("resolveSnapshotPalette", () => {
  it("reads the app's own tokens so the export cannot drift", () => {
    document.documentElement.style.setProperty("--color-fats", "#facc15");
    document.documentElement.style.setProperty("--color-protein", "#34d399");

    const palette = resolveSnapshotPalette();

    expect(palette.fats).toBe("#facc15");
    expect(palette.protein).toBe("#34d399");
  });

  it("never leaves a colour undefined", () => {
    for (const [key, value] of Object.entries(resolveSnapshotPalette())) {
      expect(value, key).toMatch(/^#|^rgb|^oklch|^hsl/);
    }
  });

  it("keeps the fallback in step with the declared tokens", () => {
    // Guards the copy in this file against the stylesheet changing under it.
    expect(SNAPSHOT_PALETTE_FALLBACK.fats).toBe("#facc15");
    expect(SNAPSHOT_PALETTE_FALLBACK.carbs).toBe("#60a5fa");
    expect(SNAPSHOT_PALETTE_FALLBACK.protein).toBe("#34d399");
  });
});
