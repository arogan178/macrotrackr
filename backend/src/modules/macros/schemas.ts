// src/modules/macros/schemas.ts
import { t } from "elysia";

// --- Reusable Primitives ---
const PositiveNumberOrNull = t.Nullable(t.Number({ minimum: 0 }));
const MacroPercentage = t.Integer({ minimum: 5, maximum: 70 });

// --- Macro Entry Schemas ---

const MacroValueSchema = t.Number({
  minimum: 0,
  error: "Macro value cannot be negative.",
});
const MealTypeSchema = t.Union(
  [
    t.Literal("breakfast"),
    t.Literal("lunch"),
    t.Literal("dinner"),
    t.Literal("snack"),
  ],
  {
    default: "snack",
    error:
      "Invalid meal type. Must be 'breakfast', 'lunch', 'dinner', or 'snack'.",
  } // Changed default
);
const DateSchema = t.String({
  format: "date",
  error: "Invalid date format. Please use YYYY-MM-DD.",
});
const TimeSchema = t.String({
  pattern: "^([01]\\d|2[0-3]):([0-5]\\d)(?::([0-5]\\d))?$",
  error: "Invalid time format. Please use HH:MM or HH:MM:SS.",
});

const macroEntryBase = t.Object({
  protein: MacroValueSchema,
  carbs: MacroValueSchema,
  fats: MacroValueSchema,
  mealType: MealTypeSchema, // Use camelCase for API
  mealName: t.Optional(t.String({ default: "" })), // Use camelCase for API
  entry_date: DateSchema, // Keep snake_case to match DB/payload easily? Or change to camelCase? Let's keep for now.
  entry_time: TimeSchema, // Keep snake_case for now.
});

// --- Macro Target Percentages Schema (Moved from goals/schemas.ts) ---
const MacroTargetPercentagesSchema = t.Object(
  {
    proteinPercentage: MacroPercentage,
    carbsPercentage: MacroPercentage,
    fatsPercentage: MacroPercentage,
    lockedMacros: t.Optional(
      t.Array(
        t.Union([t.Literal("protein"), t.Literal("carbs"), t.Literal("fats")]),
        { default: [] }
      )
    ),
  },
  {
    validator: (value: {
      proteinPercentage: number;
      carbsPercentage: number;
      fatsPercentage: number;
    }) => {
      if (
        value.proteinPercentage +
          value.carbsPercentage +
          value.fatsPercentage !==
        100
      ) {
        return "Macro percentages must sum to 100.";
      }
      return true;
    },
  }
);
// Export the type if needed elsewhere
export type MacroTargetPercentages = typeof MacroTargetPercentagesSchema.static;

// --- Exported Schemas Object ---
export const MacroSchemas = {
  // --- Macro Entry Schemas ---
  macroEntryCreate: macroEntryBase,
  macroEntryUpdate: t.Partial(macroEntryBase),
  macroEntryResponse: t.Object({
    // Use camelCase for API consistency
    id: t.Number(),
    protein: MacroValueSchema,
    carbs: MacroValueSchema,
    fats: MacroValueSchema,
    mealType: MealTypeSchema, // camelCase
    mealName: t.Optional(t.String()), // camelCase
    entry_date: DateSchema,
    entry_time: TimeSchema,
    created_at: t.Union([t.Date(), t.String()]),
  }),
  macroTotals: t.Object({
    protein: t.Number(),
    carbs: t.Number(),
    fats: t.Number(),
    calories: t.Number(),
  }),
  macroIdParam: t.Object({
    id: t.Numeric({ minimum: 1, error: "Invalid ID parameter." }),
  }),

  // --- Macro Target Schemas (Moved from goals/schemas.ts) ---
  getMacroTargetResponse: t.Nullable(
    t.Object({
      // Contains only the percentages object
      macroTarget: t.Nullable(MacroTargetPercentagesSchema),
    })
  ),
  updateMacroTargetBody: t.Object({
    // Body only contains percentages object
    macroTarget: t.Nullable(MacroTargetPercentagesSchema),
  }),
  updateMacroTargetResponse: t.Object({
    // Response only contains percentages object
    macroTarget: t.Nullable(MacroTargetPercentagesSchema),
  }),
};
