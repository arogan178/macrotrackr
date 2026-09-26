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

const Frequency = t.Union([t.Literal("daily"), t.Literal("weekly")]);

// Define reusable primitives
const StringRequired = t.String({ minLength: 1 });
const PositiveNumber = t.Number({ minimum: 0 });
const DateString = t.String({ format: "date-time" });
const DateStringOrNull = t.Nullable(t.String({ format: "date-time" }));
const BooleanOrNull = t.Nullable(t.Boolean());
// The user's local day. A strict pattern because progress matches on the exact string.
const LocalDate = t.String({ pattern: "^\\d{4}-\\d{2}-\\d{2}$" });

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
    frequency: Frequency,
    isComplete: t.Optional(t.Boolean()),
    createdAt: DateString,
    completedAt: t.Optional(DateStringOrNull),
  }),

  getHabitsQuery: t.Object({
    date: t.Optional(LocalDate),
  }),

  habitProgressBody: t.Object({
    action: t.Union([
      t.Literal("increment"),
      t.Literal("decrement"),
      t.Literal("reset"),
      t.Literal("complete"),
    ]),
    date: LocalDate,
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
      frequency: Frequency,
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
    frequency: t.Optional(Frequency),
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
    frequency: Frequency,
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
    frequency: t.Optional(Frequency),
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
    frequency: Frequency,
    isComplete: t.Boolean(),
    createdAt: DateString,
    completedAt: t.Optional(DateStringOrNull),
  }),

  // Schema for response after deleting a habit
  deleteHabitResponse: t.Object({
    success: t.Boolean(),
    id: StringRequired,
  }),
};
