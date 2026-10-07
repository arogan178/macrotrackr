import { describe, expect, it } from "vitest";

import { normalizeWeightGoals } from "./goalUtilities";

describe("goalUtilities", () => {
  describe("normalizeWeightGoals", () => {
    it("returns undefined when goals is undefined", () => {
      expect(normalizeWeightGoals(undefined, 150)).toBeUndefined();
    });

    it("returns undefined when goals is null", () => {
      expect(normalizeWeightGoals(null, 150)).toBeUndefined();
    });

    it("returns undefined when the API reports a null targetWeight", () => {
      expect(
        normalizeWeightGoals(
          {
            startingWeight: 180,
            currentWeight: 180,
            targetWeight: null,
            weightGoal: null,
            startDate: null,
            targetDate: null,
            calorieTarget: null,
            calculatedWeeks: null,
            weeklyChange: null,
            dailyChange: null,
          },
          undefined,
        ),
      ).toBeUndefined();
    });

    it("fills defaults for null fields on an API weight goal", () => {
      expect(
        normalizeWeightGoals(
          {
            startingWeight: 180,
            currentWeight: null,
            targetWeight: 160,
            weightGoal: null,
            startDate: null,
            targetDate: null,
            calorieTarget: null,
            calculatedWeeks: null,
            weeklyChange: null,
            dailyChange: null,
          },
          undefined,
        ),
      ).toEqual({
        startingWeight: 180,
        currentWeight: 180,
        targetWeight: 160,
        weightGoal: "maintain",
        startDate: "",
        targetDate: "",
        calorieTarget: 0,
        calculatedWeeks: 0,
        weeklyChange: 0,
        dailyChange: 0,
      });
    });

    it("returns undefined when only targetWeight is provided", () => {
      const goals = normalizeWeightGoals({ targetWeight: 150 }, 160);
      expect(goals?.targetWeight).toBe(150);
      expect(goals?.startingWeight).toBeUndefined();
    });

    it("normalizes full WeightGoals with defaults", () => {
      const goals = normalizeWeightGoals(
        {
          startingWeight: 180,
          currentWeight: 170,
          targetWeight: 160,
          weightGoal: "lose",
          startDate: "2024-01-01",
          targetDate: "2024-06-01",
          calorieTarget: 2000,
          calculatedWeeks: 20,
          weeklyChange: -1,
          dailyChange: -500,
        },
        170,
      );
      expect(goals?.startingWeight).toBe(180);
      expect(goals?.currentWeight).toBe(170);
      expect(goals?.targetWeight).toBe(160);
      expect(goals?.weightGoal).toBe("lose");
    });

    it("uses userWeight when currentWeight is not provided in WeightGoals", () => {
      const goals = normalizeWeightGoals(
        {
          startingWeight: 180,
          targetWeight: 160,
        },
        175,
      );
      expect(goals?.currentWeight).toBe(175);
    });

    it("handles minimal WeightGoals object", () => {
      const goals = normalizeWeightGoals(
        {
          currentWeight: 170,
          targetWeight: 160,
        },
        175,
      );
      expect(goals?.startingWeight).toBe(160);
    });
  });
});
