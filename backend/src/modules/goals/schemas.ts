// src/modules/goals/schemas.ts
import { t } from "elysia";

// Define valid weight goal types
const WeightGoalEnum = t.Union(
  [t.Literal("lose"), t.Literal("maintain"), t.Literal("gain")],
  { default: "maintain" } // Optional: Provide a default
);

// --- Base Properties (used in response) ---
const BaseWeightGoalProperties = {
  startingWeight: t.Nullable(t.Number()), // Starting weight is part of the goal record
  targetWeight: t.Nullable(t.Number()),
  weightGoal: t.Nullable(WeightGoalEnum),
  startDate: t.Nullable(t.String({ format: "date" })), // ISO 8601 date string YYYY-MM-DD
  targetDate: t.Nullable(t.String({ format: "date" })), // ISO 8601 date string YYYY-MM-DD
  calorieTarget: t.Nullable(t.Number()),
  calculatedWeeks: t.Nullable(t.Number()),
  weeklyChange: t.Nullable(t.Number()),
  dailyChange: t.Nullable(t.Number()),
};

// --- GET Response ---
const getWeightGoalResponse = t.Nullable(t.Object(BaseWeightGoalProperties));

// --- POST (Create) Body ---
// Requires startingWeight
const createWeightGoalBody = t.Object({
  startingWeight: t.Number(), // Explicitly require startingWeight for creation
  targetWeight: t.Nullable(t.Number()),
  weightGoal: t.Nullable(WeightGoalEnum),
  startDate: t.Nullable(t.String({ format: "date" })),
  targetDate: t.Nullable(t.String({ format: "date" })),
  calorieTarget: t.Nullable(t.Number()),
  calculatedWeeks: t.Nullable(t.Number()),
  weeklyChange: t.Nullable(t.Number()),
  dailyChange: t.Nullable(t.Number()),
});

// --- PUT (Update) Body ---
// Does NOT include startingWeight, as it shouldn't be changed
const updateWeightGoalBody = t.Object({
  targetWeight: t.Nullable(t.Number()),
  weightGoal: t.Nullable(WeightGoalEnum),
  startDate: t.Nullable(t.String({ format: "date" })),
  targetDate: t.Nullable(t.String({ format: "date" })),
  calorieTarget: t.Nullable(t.Number()),
  calculatedWeeks: t.Nullable(t.Number()),
  weeklyChange: t.Nullable(t.Number()),
  dailyChange: t.Nullable(t.Number()),
});

// --- POST/PUT Response (same structure) ---
const weightGoalResponse = t.Object(BaseWeightGoalProperties);

// --- Reset Response ---
const resetResponse = t.Object({ success: t.Boolean() });

// --- Weight Log Schemas ---
const WeightLogEntry = t.Object({
  id: t.String(),
  date: t.String({ format: "date" }), // YYYY-MM-DD
  weight: t.Number(),
});

const getWeightLogResponse = t.Array(WeightLogEntry);

const addWeightLogBody = t.Object({
  date: t.String({ format: "date" }),
  weight: t.Number(),
});

// Response includes the generated ID and user ID
const addWeightLogResponse = t.Object({
  id: t.String(),
  userId: t.String(), // Assuming user ID is treated as string in API
  date: t.String({ format: "date" }),
  weight: t.Number(),
});

// --- Export ---
export const GoalSchemas = {
  getWeightGoalResponse,
  createWeightGoalBody, // ADDED
  updateWeightGoalBody,
  weightGoalResponse, // RENAMED (used for POST/PUT response)
  resetResponse,
  getWeightLogResponse,
  addWeightLogBody,
  addWeightLogResponse,
};
