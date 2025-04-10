// src/modules/habits/schemas.ts
import { t } from "elysia";

// Define the accent color union type
const AccentColor = t.Union([
  t.Literal("indigo"),
  t.Literal("blue"),
  t.Literal("green"),
  t.Literal("purple"),
]);

// Define reusable primitives
const StringRequired = t.String({ minLength: 1 });
const PositiveNumber = t.Number({ minimum: 0 });
const DateString = t.String({ format: "date-time" });
const DateStringOrNull = t.Nullable(t.String({ format: "date-time" }));
const BooleanOrNull = t.Nullable(t.Boolean());

// Habit schemas for API responses and requests
export const HabitSchemas = {
  // Schema for a single habit
  habitData: t.Object({
    id: StringRequired,
    title: StringRequired,
    iconName: StringRequired,
    current: PositiveNumber,
    target: PositiveNumber,
    progress: PositiveNumber,
    accentColor: t.Optional(AccentColor),
    isComplete: t.Optional(t.Boolean()),
    createdAt: DateString,
    completedAt: t.Optional(DateStringOrNull),
  }),

  // Schema for GET /api/habits response
  getHabitsResponse: t.Array(
    t.Object({
      id: StringRequired,
      title: StringRequired,
      iconName: StringRequired,
      current: PositiveNumber,
      target: PositiveNumber,
      progress: PositiveNumber,
      accentColor: t.Optional(AccentColor),
      isComplete: t.Optional(t.Boolean()),
      createdAt: DateString,
      completedAt: t.Optional(DateStringOrNull),
    })
  ),

  // Schema for POST /api/habits request body
  createHabitBody: t.Object({
    id: StringRequired,
    title: StringRequired,
    iconName: StringRequired,
    current: PositiveNumber,
    target: PositiveNumber,
    progress: PositiveNumber,
    accentColor: t.Optional(AccentColor),
    isComplete: t.Optional(t.Boolean()),
    createdAt: DateString,
    completedAt: t.Optional(DateStringOrNull),
  }),

  // Schema for response after creating a habit
  createHabitResponse: t.Object({
    id: StringRequired,
    title: StringRequired,
    iconName: StringRequired,
    current: PositiveNumber,
    target: PositiveNumber,
    progress: PositiveNumber,
    accentColor: t.Optional(AccentColor),
    isComplete: t.Optional(BooleanOrNull),
    createdAt: DateString,
    completedAt: t.Optional(DateStringOrNull),
  }),

  // Schema for PUT /api/habits/:id request body
  updateHabitBody: t.Object({
    id: StringRequired,
    title: StringRequired,
    iconName: StringRequired,
    current: PositiveNumber,
    target: PositiveNumber,
    progress: PositiveNumber,
    accentColor: t.Optional(AccentColor),
    isComplete: t.Optional(t.Boolean()),
    createdAt: DateString,
    completedAt: t.Optional(DateStringOrNull),
  }),

  // Schema for response after updating a habit
  updateHabitResponse: t.Object({
    success: t.Boolean(),
  }),

  // Schema for response after deleting a habit
  deleteHabitResponse: t.Object({
    success: t.Boolean(),
  }),

  // Schema for response after resetting all habits
  resetHabitsResponse: t.Object({
    success: t.Boolean(),
  }),
};
