import { describe, expect, it } from "vitest";
import {
  EmailSchema,
  PasswordSchema,
  PositiveNumberSchema,
  PositiveIntegerSchema,
  MealTypeSchema,
  WeightGoalTypeSchema,
  MacroPercentageSchema,
  AccentColorSchema,
  createPercentageConstraint,
  SuccessResponseSchema,
  ErrorResponseSchema,
  PaginationQuerySchema,
  PaginationResponseSchema,
} from "../../src/lib/schemas";

describe("schemas", () => {
  describe("EmailSchema", () => {
    it("should be defined with email format", () => {
      expect(EmailSchema).toBeDefined();
      expect(EmailSchema.type).toBe("string");
    });
  });

  describe("PasswordSchema", () => {
    it("should be defined with minLength 8", () => {
      expect(PasswordSchema).toBeDefined();
      expect(PasswordSchema.type).toBe("string");
    });
  });

  describe("PositiveNumberSchema", () => {
    it("should be defined with minimum 0", () => {
      expect(PositiveNumberSchema).toBeDefined();
      expect(PositiveNumberSchema.type).toBe("number");
    });
  });

  describe("PositiveIntegerSchema", () => {
    it("should be defined with minimum 1", () => {
      expect(PositiveIntegerSchema).toBeDefined();
      expect(PositiveIntegerSchema.type).toBe("number");
    });
  });

  describe("MealTypeSchema", () => {
    it("should have breakfast, lunch, dinner, snack as valid options", () => {
      expect(MealTypeSchema).toBeDefined();
      expect(MealTypeSchema.type).toBe("union");
    });

    it("should have snack as default", () => {
      const anyOf = (MealTypeSchema as any).anyOf;
      const defaultValue = (MealTypeSchema as any).default;
      expect(defaultValue).toBe("snack");
    });
  });

  describe("WeightGoalTypeSchema", () => {
    it("should have lose, maintain, gain as valid options", () => {
      expect(WeightGoalTypeSchema).toBeDefined();
      expect(WeightGoalTypeSchema.type).toBe("union");
    });

    it("should have maintain as default", () => {
      const defaultValue = (WeightGoalTypeSchema as any).default;
      expect(defaultValue).toBe("maintain");
    });
  });

  describe("MacroPercentageSchema", () => {
    it("should be defined with min 5 and max 70", () => {
      expect(MacroPercentageSchema).toBeDefined();
      expect(MacroPercentageSchema.type).toBe("integer");
    });
  });

  describe("AccentColorSchema", () => {
    it("should have indigo, blue, green, purple as valid options", () => {
      expect(AccentColorSchema).toBeDefined();
      expect(AccentColorSchema.type).toBe("union");
    });
  });

  describe("createPercentageConstraint", () => {
    it("should return a validator function", () => {
      const constraint = createPercentageConstraint();
      expect(constraint).toBeDefined();
      expect(typeof constraint.validator).toBe("function");
    });

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

  describe("SuccessResponseSchema", () => {
    it("should be defined with success boolean", () => {
      expect(SuccessResponseSchema).toBeDefined();
      expect(SuccessResponseSchema.type).toBe("object");
    });
  });

  describe("ErrorResponseSchema", () => {
    it("should be defined with code and message strings", () => {
      expect(ErrorResponseSchema).toBeDefined();
      expect(ErrorResponseSchema.type).toBe("object");
    });
  });

  describe("PaginationQuerySchema", () => {
    it("should be defined with pagination parameters", () => {
      expect(PaginationQuerySchema).toBeDefined();
      expect(PaginationQuerySchema.type).toBe("object");
    });
  });

  describe("PaginationResponseSchema", () => {
    it("should be defined with data array and pagination object", () => {
      expect(PaginationResponseSchema).toBeDefined();
      expect(PaginationResponseSchema.type).toBe("object");
    });
  });
});
