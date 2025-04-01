// src/modules/goals/schemas.ts
import { t } from "elysia";

// --- Reusable Primitives ---
const PositiveNumberOrNull = t.Nullable(t.Number({ minimum: 0 }));
const PositiveIntegerOrNull = t.Nullable(t.Integer({ minimum: 0 }));
const DateStringOrNull = t.Nullable(t.String({ format: "date" }));
// Removed MacroPercentage as it's moved

// --- Exported Goal Schemas ---
// Now only contains schemas related to Weight Goals
export const GoalSchemas = {
  // Schema for Weight Goals data (API structure - camelCase)
  weightGoalData: t.Object({
    currentWeight: PositiveNumberOrNull,
    targetWeight: PositiveNumberOrNull,
    weightGoal: t.Nullable(
      t.Union([t.Literal("lose"), t.Literal("maintain"), t.Literal("gain")])
    ),
    startDate: DateStringOrNull,
    targetDate: DateStringOrNull,
    adjustedCalorieTarget: PositiveNumberOrNull, // Renamed field
    calculatedWeeks: PositiveIntegerOrNull,
    weeklyChange: t.Nullable(t.Number()),
    dailyChange: t.Nullable(t.Number()), // Renamed field
  }),

  // --- Request/Response Schemas for Weight Goals ---

  getWeightGoalResponse: t.Nullable(
    t.Object({
      currentWeight: PositiveNumberOrNull,
      targetWeight: PositiveNumberOrNull,
      weightGoal: t.Nullable(
        t.Union([t.Literal("lose"), t.Literal("maintain"), t.Literal("gain")])
      ),
      startDate: DateStringOrNull,
      targetDate: DateStringOrNull,
      adjustedCalorieTarget: PositiveNumberOrNull, // Renamed field
      calculatedWeeks: PositiveIntegerOrNull,
      weeklyChange: t.Nullable(t.Number()),
      dailyChange: t.Nullable(t.Number()), // Renamed field
    })
  ),
  updateWeightGoalBody: t.Object({
    currentWeight: PositiveNumberOrNull,
    targetWeight: PositiveNumberOrNull, // Allow null for initial set? Let's keep PositiveNumberOrNull
    weightGoal: t.Nullable(
      t.Union([t.Literal("lose"), t.Literal("maintain"), t.Literal("gain")])
    ), // Allow null? Let's keep Nullable
    startDate: DateStringOrNull,
    targetDate: DateStringOrNull,
    adjustedCalorieTarget: PositiveNumberOrNull, // Renamed field
    calculatedWeeks: PositiveIntegerOrNull,
    weeklyChange: t.Nullable(t.Number()),
    dailyChange: t.Nullable(t.Number()), // Renamed field
  }),
  updateWeightGoalResponse: t.Object({
    // Response after update
    currentWeight: PositiveNumberOrNull,
    targetWeight: PositiveNumberOrNull,
    weightGoal: t.Nullable(
      t.Union([t.Literal("lose"), t.Literal("maintain"), t.Literal("gain")])
    ),
    startDate: DateStringOrNull,
    targetDate: DateStringOrNull,
    adjustedCalorieTarget: PositiveNumberOrNull, // Renamed field
    calculatedWeeks: PositiveIntegerOrNull,
    weeklyChange: t.Nullable(t.Number()),
    dailyChange: t.Nullable(t.Number()), // Renamed field
  }),

  // Schema for resetting goals
  resetResponse: t.Object({
    success: t.Boolean(),
  }),
};
