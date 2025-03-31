// src/modules/goals/schemas.ts
import { t } from "elysia";

// Placeholder schemas for the Goals module
// Define actual schemas based on your application's requirements for goals

export const GoalSchemas = {
  // Example: Schema for creating a goal
  goalCreate: t.Object({
    targetCalories: t.Optional(t.Integer({ minimum: 0 })),
    targetProtein: t.Optional(t.Integer({ minimum: 0 })),
    targetCarbs: t.Optional(t.Integer({ minimum: 0 })),
    targetFats: t.Optional(t.Integer({ minimum: 0 })),
    startDate: t.Optional(t.String({ format: "date" })),
    endDate: t.Optional(t.String({ format: "date" })),
    description: t.Optional(t.String()),
  }),

  // Example: Schema for a goal response
  goalResponse: t.Object({
    id: t.Integer(),
    userId: t.Integer(),
    targetCalories: t.Nullable(t.Integer()),
    targetProtein: t.Nullable(t.Integer()),
    targetCarbs: t.Nullable(t.Integer()),
    targetFats: t.Nullable(t.Integer()),
    startDate: t.Nullable(t.String()),
    endDate: t.Nullable(t.String()),
    description: t.Nullable(t.String()),
    createdAt: t.Union([t.Date(), t.String()]),
  }),

  // Example: Schema for goal ID parameter
  goalIdParam: t.Object({
    id: t.Numeric({ minimum: 1, error: "Invalid Goal ID parameter." }),
  }),
};
