// src/modules/macros/schemas.ts
import { t } from "elysia";

// --- Reusable Base Schemas ---

// Basic macro values - must be non-negative numbers, allowing decimals
const MacroValueSchema = t.Number({
  minimum: 0,
  error: "Macro value cannot be negative.",
});

// Allowed meal types - using an enum-like union
const MealTypeSchema = t.Union(
  [
    t.Literal("breakfast"),
    t.Literal("lunch"),
    t.Literal("dinner"),
    t.Literal("snack"),
  ],
  {
    default: "breakfast", // Default to breakfast if not provided
    error:
      "Invalid meal type. Must be 'breakfast', 'lunch', 'dinner', or 'snack'.",
  }
);

// Date and time format validation (ISO 8601 subset)
const DateSchema = t.String({
  format: "date",
  error: "Invalid date format. Please use YYYY-MM-DD.",
});
const TimeSchema = t.String({
  pattern: "^([01]\\d|2[0-3]):([0-5]\\d)(?::([0-5]\\d))?$",
  error: "Invalid time format. Please use HH:MM or HH:MM:SS.",
}); // HH:MM or HH:MM:SS

// --- Define Base Schema Separately ---
// Define the base structure for a macro entry independently
const macroEntryBase = t.Object({
  protein: MacroValueSchema,
  carbs: MacroValueSchema,
  fats: MacroValueSchema,
  mealType: MealTypeSchema,
  mealName: t.Optional(t.String({ default: "" })), // Optional meal name, defaults to empty string
  entry_date: DateSchema, // Use entry_date consistently
  entry_time: TimeSchema, // Use entry_time consistently
});

// --- Exported Schemas Object ---
// Now define the main export object, referencing the standalone 'macroEntryBase' directly
export const MacroSchemas = {
  // Reference the separately defined base schema directly for creation
  macroEntryCreate: macroEntryBase, // Replaced t.Ref(macroEntryBase)

  // Schema for updating an existing macro entry (allows partial updates)
  // Use t.Partial around the direct reference to the base schema
  macroEntryUpdate: t.Partial(macroEntryBase), // Replaced t.Partial(t.Ref(macroEntryBase))

  // Schema for the response when returning a single macro entry
  macroEntryResponse: t.Object({
    id: t.Number(),
    protein: MacroValueSchema,
    carbs: MacroValueSchema,
    fats: MacroValueSchema,
    mealType: MealTypeSchema,
    mealName: t.Optional(t.String()),
    entry_date: DateSchema,
    entry_time: TimeSchema,
    created_at: t.Union([t.Date(), t.String()]),
  }),

  // Schema for returning daily macro totals
  macroTotals: t.Object({
    protein: t.Number(), // Totals can be numbers
    carbs: t.Number(),
    fats: t.Number(),
    calories: t.Number(),
  }),

  // Schema for validating the ID parameter in routes like /:id
  macroIdParam: t.Object({
    id: t.Numeric({
      minimum: 1,
      error: "Invalid ID parameter. Must be a positive number.",
    }), // Use Numeric for coercion
  }),
};
