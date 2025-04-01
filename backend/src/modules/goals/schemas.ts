// src/modules/goals/schemas.ts
import { t } from "elysia";

// --- Reusable Primitives ---
const PositiveNumberOrNull = t.Nullable(t.Number({ minimum: 0 }));
const PositiveIntegerOrNull = t.Nullable(t.Integer({ minimum: 0 }));
const DateStringOrNull = t.Nullable(t.String({ format: "date" }));

// --- Macro Distribution Schema (similar to user settings) ---
// This is used within the Macro Targets schema below
const MacroDistributionSchema = t.Object(
  {
    proteinPercentage: t.Integer({ minimum: 5, maximum: 70 }),
    carbsPercentage: t.Integer({ minimum: 5, maximum: 70 }),
    fatsPercentage: t.Integer({ minimum: 5, maximum: 70 }),
  },
  {
    // Validator for sum = 100
    // *** ADDED Explicit type for the 'value' parameter ***
    validator: (value: {
      proteinPercentage: number;
      carbsPercentage: number;
      fatsPercentage: number;
    }) => {
      // Check if the sum of percentages equals 100
      if (
        value.proteinPercentage +
          value.carbsPercentage +
          value.fatsPercentage !==
        100
      ) {
        // Return error message if validation fails
        return "Macro percentages must sum to 100.";
      }
      // Return true if validation passes
      return true;
    },
  }
);

// --- Exported Goal Schemas ---
// Defines schemas directly without using t.Ref for simplicity during development.
export const GoalSchemas = {
  // Schema for the response when getting weight goals
  getWeightGoalResponse: t.Nullable(
    t.Object({
      currentWeight: PositiveNumberOrNull,
      targetWeight: PositiveNumberOrNull,
      weightGoal: t.Nullable(
        t.Union([t.Literal("lose"), t.Literal("maintain"), t.Literal("gain")])
      ),
      startDate: DateStringOrNull,
      targetDate: DateStringOrNull,
      adjustedCalorieIntake: PositiveNumberOrNull,
      calculatedWeeks: PositiveIntegerOrNull,
      weeklyChange: t.Nullable(t.Number()),
      dailyDeficit: t.Nullable(t.Number()),
    })
  ),

  // Schema for the request body when updating weight goals
  updateWeightGoalBody: t.Object({
    currentWeight: PositiveNumberOrNull,
    targetWeight: PositiveNumberOrNull,
    weightGoal: t.Nullable(
      t.Union([t.Literal("lose"), t.Literal("maintain"), t.Literal("gain")])
    ),
    startDate: DateStringOrNull,
    targetDate: DateStringOrNull,
    adjustedCalorieIntake: PositiveNumberOrNull,
    calculatedWeeks: PositiveIntegerOrNull,
    weeklyChange: t.Nullable(t.Number()),
    dailyDeficit: t.Nullable(t.Number()),
  }),

  // Schema for the response when getting macro targets
  getMacroTargetResponse: t.Nullable(
    t.Object({
      targetCalories: PositiveNumberOrNull,
      macroDistribution: t.Nullable(MacroDistributionSchema), // Use nested schema directly
    })
  ),

  // Schema for the request body when updating macro targets
  updateMacroTargetBody: t.Object({
    targetCalories: PositiveNumberOrNull,
    macroDistribution: t.Nullable(MacroDistributionSchema), // Use nested schema directly
  }),

  // Schema for the response after successfully updating weight goals
  // (Often the same as the GET response, returning the updated object)
  updateWeightGoalResponse: t.Object({
    currentWeight: PositiveNumberOrNull,
    targetWeight: PositiveNumberOrNull,
    weightGoal: t.Nullable(
      t.Union([t.Literal("lose"), t.Literal("maintain"), t.Literal("gain")])
    ),
    startDate: DateStringOrNull,
    targetDate: DateStringOrNull,
    adjustedCalorieIntake: PositiveNumberOrNull,
    calculatedWeeks: PositiveIntegerOrNull,
    weeklyChange: t.Nullable(t.Number()),
    dailyDeficit: t.Nullable(t.Number()),
  }),

  // Schema for the response after successfully updating macro targets
  // (Often the same as the GET response, returning the updated object)
  updateMacroTargetResponse: t.Object({
    targetCalories: PositiveNumberOrNull,
    macroDistribution: t.Nullable(MacroDistributionSchema),
  }),

  // Generic success response for reset
  resetResponse: t.Object({
    success: t.Boolean(),
  }),
};

// Note: The version using t.Ref ('GoalSchemas') and the alternative export
// ('ActiveGoalSchemas = GoalSchemasAlt') have been removed for simplicity.
