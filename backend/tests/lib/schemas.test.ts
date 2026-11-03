import { describe, expect, it } from "vitest";
import {
  MealTypeSchema,
  WeightGoalTypeSchema,
  createPercentageConstraint,
} from "../../src/lib/http/schemas";

describe("schemas", () => {
  describe("MealTypeSchema", () => {
    it("should have snack as default", () => {
      const defaultValue = (MealTypeSchema as any).default;
      expect(defaultValue).toBe("snack");
    });
  });

  describe("WeightGoalTypeSchema", () => {
    it("should have maintain as default", () => {
      const defaultValue = (WeightGoalTypeSchema as any).default;
      expect(defaultValue).toBe("maintain");
    });
  });

  describe("createPercentageConstraint", () => {
    it("should return true when percentages sum to 100", () => {
      const constraint = createPercentageConstraint();
      const result = constraint.validator({
        proteinPercentage: 30,
        carbsPercentage: 40,
        fatsPercentage: 30,
      });
      expect(result).toBe(true);
    });

    it("should return error message when percentages don't sum to 100", () => {
      const constraint = createPercentageConstraint();
      const result = constraint.validator({
        proteinPercentage: 30,
        carbsPercentage: 30,
        fatsPercentage: 30,
      });
      expect(result).toBe("Macro percentages must sum to 100.");
    });
  });
});
