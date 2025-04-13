// src/modules/goals/schemas.ts
import { t } from "elysia";

// --- Reusable Primitives ---
const PositiveNumberOrNull = t.Nullable(t.Number({ minimum: 0 }));
const PositiveIntegerOrNull = t.Nullable(t.Integer({ minimum: 0 }));
const DateStringOrNull = t.Nullable(t.String({ format: "date" }));
// Add reusable DateString for required dates
const DateString = t.String({
  format: "date",
  default: new Date().toISOString().split("T")[0],
}); // YYYY-MM-DD

// --- Exported Goal Schemas --- //
export const GoalSchemas = {
  // Schema for Weight Goals data (API structure - camelCase)
  weightGoalData: t.Object({
    startingWeight: PositiveNumberOrNull,
    targetWeight: PositiveNumberOrNull,
    weightGoal: t.Nullable(
      t.Union([t.Literal("lose"), t.Literal("maintain"), t.Literal("gain")])
    ),
    startDate: DateStringOrNull,
    targetDate: DateStringOrNull,
    calorieTarget: PositiveNumberOrNull, // Renamed field
    calculatedWeeks: PositiveIntegerOrNull,
    weeklyChange: t.Nullable(t.Number()),
    dailyChange: t.Nullable(t.Number()), // Renamed field
  }),

  // --- Request/Response Schemas for Weight Goals ---

  getWeightGoalResponse: t.Nullable(
    t.Object({
      startingWeight: PositiveNumberOrNull,
      targetWeight: PositiveNumberOrNull,
      weightGoal: t.Nullable(
        t.Union([t.Literal("lose"), t.Literal("maintain"), t.Literal("gain")])
      ),
      startDate: DateStringOrNull,
      targetDate: DateStringOrNull,
      calorieTarget: PositiveNumberOrNull, // Renamed field
      calculatedWeeks: PositiveIntegerOrNull,
      weeklyChange: t.Nullable(t.Number()),
      dailyChange: t.Nullable(t.Number()), // Renamed field
    })
  ),
  updateWeightGoalBody: t.Object({
    startingWeight: PositiveNumberOrNull,
    targetWeight: PositiveNumberOrNull, // Allow null for initial set? Let's keep PositiveNumberOrNull
    weightGoal: t.Nullable(
      t.Union([t.Literal("lose"), t.Literal("maintain"), t.Literal("gain")])
    ), // Allow null? Let's keep Nullable
    startDate: DateStringOrNull,
    targetDate: DateStringOrNull,
    calorieTarget: PositiveNumberOrNull,
    calculatedWeeks: PositiveIntegerOrNull,
    weeklyChange: t.Nullable(t.Number()),
    dailyChange: t.Nullable(t.Number()),
  }),
  updateWeightGoalResponse: t.Object({
    // Response after update
    startingWeight: PositiveNumberOrNull,
    targetWeight: PositiveNumberOrNull,
    weightGoal: t.Nullable(
      t.Union([t.Literal("lose"), t.Literal("maintain"), t.Literal("gain")])
    ),
    startDate: DateStringOrNull,
    targetDate: DateStringOrNull,
    calorieTarget: PositiveNumberOrNull,
    calculatedWeeks: PositiveIntegerOrNull,
    weeklyChange: t.Nullable(t.Number()),
    dailyChange: t.Nullable(t.Number()),
  }),

  // Schema for resetting goals
  resetResponse: t.Object({
    success: t.Boolean(),
  }),

  // --- Weight Log Schemas ---

  // Schema for a single weight log entry (used in responses)
  weightLogEntry: t.Object({
    id: t.String(),
    userId: t.String(), // Included in POST response, maybe not GET
    date: DateString,
    weight: t.Number({ minimum: 0 }),
  }),

  // Schema for the request body when adding a new weight log entry
  addWeightLogBody: t.Object({
    date: DateString, // Date for the new entry
    weight: t.Number({ minimum: 0 }), // Weight for the new entry
  }),

  // Schema for the response after successfully adding a weight log entry
  addWeightLogResponse: t.Object({
    id: t.String(),
    userId: t.String(),
    date: DateString,
    weight: t.Number({ minimum: 0 }),
  }),

  // Schema for the response when fetching the weight log history
  getWeightLogResponse: t.Array(
    t.Object({
      id: t.String(),
      // userId is usually not needed when fetching for the logged-in user
      date: DateString,
      weight: t.Number({ minimum: 0 }),
    })
  ),
};
