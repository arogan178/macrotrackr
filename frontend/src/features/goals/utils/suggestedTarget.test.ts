import { afterEach, describe, expect, it } from "vitest";

import type { WeightGoals } from "@/types/goal";

import {
  clearSuggestionDismissals,
  describeSuggestion,
  isoWeek,
  suggestionDismissKey,
  suggestTarget,
} from "./suggestedTarget";

const goal = (overrides: Partial<WeightGoals>): WeightGoals => ({
  startingWeight: 85,
  currentWeight: 80,
  targetWeight: 75,
  weightGoal: "lose",
  startDate: "2026-09-01",
  targetDate: "2027-01-01",
  calorieTarget: 2240,
  calculatedWeeks: 13,
  weeklyChange: -0.4,
  dailyChange: -440,
  ...overrides,
});

describe("suggestTarget", () => {
  it("takes the goal's deficit off measured expenditure when losing", () => {
    const suggestion = suggestTarget({
      measuredEstimate: 2347,
      goals: goal({}),
      bmr: 1700,
    });

    expect(suggestion).toMatchObject({ target: 1910, measured: 2350, change: -440 });
    expect(describeSuggestion(suggestion!)).toBe(
      "Suggested target 1,910 kcal: measured 2,350 minus 440 for losing 0.5% a week. Your current target is 2,240.",
    );
  });

  it("reads an older positive daily change as a deficit for a lose goal", () => {
    expect(
      suggestTarget({ measuredEstimate: 2350, goals: goal({ dailyChange: 440 }), bmr: 0 })
        ?.target,
    ).toBe(1910);
  });

  it("adds the goal's surplus when gaining", () => {
    const suggestion = suggestTarget({
      measuredEstimate: 2500,
      goals: goal({
        weightGoal: "gain",
        targetWeight: 85,
        weeklyChange: 0.2,
        dailyChange: 220,
        calorieTarget: 2500,
      }),
      bmr: 1700,
    });

    expect(suggestion?.target).toBe(2720);
    expect(describeSuggestion(suggestion!)).toBe(
      "Suggested target 2,720 kcal: measured 2,500 plus 220 for gaining 0.25% a week. Your current target is 2,500.",
    );
  });

  it("suggests measured expenditure itself when maintaining", () => {
    const suggestion = suggestTarget({
      measuredEstimate: 2350,
      goals: goal({
        weightGoal: "maintain",
        weeklyChange: 0,
        dailyChange: 0,
        calorieTarget: 2100,
      }),
      bmr: 1700,
    });

    expect(suggestion).toMatchObject({ target: 2350, change: 0 });
    expect(describeSuggestion(suggestion!)).toBe(
      "Suggested target 2,350 kcal: your measured 2,350, to keep your weight steady. Your current target is 2,100.",
    );
  });

  it("never suggests below BMR, and says so", () => {
    const suggestion = suggestTarget({
      measuredEstimate: 1900,
      goals: goal({
        currentWeight: 100,
        weeklyChange: -0.5,
        dailyChange: -550,
        calorieTarget: 2000,
      }),
      bmr: 1600,
    });

    expect(suggestion).toMatchObject({ target: 1600, bmrFloor: 1600 });
    expect(describeSuggestion(suggestion!)).toBe(
      "Suggested target 1,600 kcal: measured 1,900 minus 550 for losing 0.5% a week is 1,350, below your BMR of 1,600, so it stops at your BMR. Your current target is 2,000.",
    );
  });

  it("stays quiet under a 100 kcal difference", () => {
    const maintain = { weightGoal: "maintain" as const, weeklyChange: 0, dailyChange: 0 };

    expect(
      suggestTarget({ measuredEstimate: 2300, goals: goal({ ...maintain, calorieTarget: 2210 }), bmr: 0 }),
    ).toBeNull();
    expect(
      suggestTarget({ measuredEstimate: 2300, goals: goal({ ...maintain, calorieTarget: 2200 }), bmr: 0 })
        ?.target,
    ).toBe(2300);
  });
});

describe("isoWeek", () => {
  it("runs Monday to Sunday", () => {
    expect(isoWeek("2026-10-12")).toBe("2026-W42");
    expect(isoWeek("2026-10-18")).toBe("2026-W42");
    expect(isoWeek("2026-10-19")).toBe("2026-W43");
  });

  it("gives early January to the previous year when its Thursday is there", () => {
    expect(isoWeek("2027-01-01")).toBe("2026-W53");
    expect(isoWeek("2026-01-01")).toBe("2026-W01");
  });
});

describe("clearSuggestionDismissals", () => {
  afterEach(() => localStorage.clear());

  it("removes only the suggestion keys", () => {
    localStorage.setItem(suggestionDismissKey(7, "2026-W42"), "1");
    localStorage.setItem(suggestionDismissKey(8, "2026-W41"), "1");
    localStorage.setItem("token", "abc");

    clearSuggestionDismissals();

    expect(localStorage.length).toBe(1);
    expect(localStorage.getItem("token")).toBe("abc");
  });
});
