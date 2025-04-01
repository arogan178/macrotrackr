// src/modules/goals/schemas.ts
import { t } from "elysia";

// --- Reusable Primitives ---
const PositiveNumber = t.Number({ minimum: 0 });
const PositiveNumberOrNull = t.Nullable(t.Number({ minimum: 0 }));
const PositiveIntegerOrNull = t.Nullable(t.Integer({ minimum: 0 }));
const DateString = t.String({ format: "date" });
const DateStringOrNull = t.Nullable(t.String({ format: "date" }));
const MacroPercentage = t.Integer({ minimum: 5, maximum: 70 });

// --- Macro Targeta (similar to user settings) ---
// This is used within the Macro Target schema below
const MacroTargetSchema = t.Object(
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
      dailyChange: t.Nullable(t.Number()),
    })
  ),

  // Schema for updating weight goals
  updateWeightGoalBody: t.Object({
    currentWeight: PositiveNumber,
    targetWeight: PositiveNumberOrNull,
    weightGoal: t.Union([
      t.Literal("lose"),
      t.Literal("maintain"),
      t.Literal("gain"),
    ]),
    startDate: DateString,
    targetDate: DateStringOrNull,
    adjustedCalorieIntake: PositiveNumberOrNull,
    calculatedWeeks: PositiveIntegerOrNull,
    weeklyChange: t.Nullable(t.Number()),
    dailyChange: t.Nullable(t.Number()),
  }),

  // Schema for the response when updating weight goals
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
    dailyChange: t.Nullable(t.Number()),
  }),

  // Schema for the response when getting macro target
  getMacroTargetResponse: t.Nullable(
    t.Object({
      targetCalories: t.Nullable(PositiveNumber),
      macroTarget: t.Nullable(
        t.Object({
          proteinPercentage: MacroPercentage,
          carbsPercentage: MacroPercentage,
          fatsPercentage: MacroPercentage,
        })
      ),
    })
  ),

  // Schema for updating macro target
  updateMacroTargetBody: t.Object({
    targetCalories: t.Nullable(PositiveNumber),
    macroTarget: t.Nullable(
      t.Object({
        proteinPercentage: MacroPercentage,
        carbsPercentage: MacroPercentage,
        fatsPercentage: MacroPercentage,
      })
    ),
  }),

  // Schema for the response when updating macro target
  updateMacroTargetResponse: t.Object({
    targetCalories: t.Nullable(PositiveNumber),
    macroTarget: t.Nullable(
      t.Object({
        proteinPercentage: MacroPercentage,
        carbsPercentage: MacroPercentage,
        fatsPercentage: MacroPercentage,
      })
    ),
  }),

  // Schema for the response when resetting goals
  resetResponse: t.Object({
    success: t.Boolean(),
  }),
};
