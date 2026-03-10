// src/modules/habits/schemas.ts
import { t } from "elysia";

// Define the accent color union type
// Expanded to support all colors used by the frontend HabitForm
const AccentColor = t.Union([
  t.Literal("indigo"),
  t.Literal("blue"),
  t.Literal("cyan"),
  t.Literal("teal"),
  t.Literal("green"),
  t.Literal("lime"),
  t.Literal("yellow"),
  t.Literal("orange"),
  t.Literal("red"),
  t.Literal("pink"),
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
    title: StringRequired,
    iconName: StringRequired,
    current: PositiveNumber,
    target: PositiveNumber,
    accentColor: t.Optional(AccentColor),
    isComplete: t.Optional(t.Boolean()),
    createdAt: DateString,
    completedAt: t.Optional(DateStringOrNull),
  }),

  // Schema for response after updating a habit
  updateHabitResponse: t.Object({
    id: StringRequired,
    title: StringRequired,
    iconName: StringRequired,
    current: PositiveNumber,
    target: PositiveNumber,
    progress: PositiveNumber,
    accentColor: t.Optional(AccentColor),
    isComplete: t.Boolean(),
    createdAt: DateString,
    completedAt: t.Optional(DateStringOrNull),
  }),

  // Schema for response after deleting a habit
  deleteHabitResponse: t.Object({
    success: t.Boolean(),
    id: StringRequired,
  }),

  // Schema for response after resetting all habits
  resetHabitsResponse: t.Object({
    success: t.Boolean(),
    count: t.Number({ minimum: 0 }),
  }),
};
