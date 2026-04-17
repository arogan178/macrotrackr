import { t } from "elysia";

/**
 * Common reusable schema patterns
 */

// Basic types with validation
export const EmailSchema = t.String({
  format: "email",
  error: "Invalid email format.",
});

export const PasswordSchema = t.String({
  minLength: 8,
  error: "Password must be at least 8 characters long.",
});

export const RequiredStringSchema = t.String({
  minLength: 1,
  error: "This field cannot be empty.",
});

export const OptionalStringSchema = t.Optional(t.String());

export const PositiveNumberSchema = t.Number({
  minimum: 0,
  error: "Value must be a positive number.",
});

export const OptionalPositiveNumberSchema = t.Optional(
  t.Union([t.Number({ minimum: 0 }), t.Null()])
);

export const PositiveIntegerSchema = t.Integer({
  minimum: 1,
  error: "Value must be a positive integer.",
});

export const OptionalPositiveIntegerSchema = t.Optional(
  t.Union([t.Integer({ minimum: 1 }), t.Null()])
);

// Date and time schemas
export const DateStringSchema = t.String({
  format: "date",
  error: "Invalid date format. Please use YYYY-MM-DD.",
});

export const OptionalDateStringSchema = t.Optional(
  t.Union([DateStringSchema, t.Null()])
);

export const TimeStringSchema = t.String({
  pattern: "^([01]\\d|2[0-3]):([0-5]\\d)(?::([0-5]\\d))?$",
  error: "Invalid time format. Please use HH:MM or HH:MM:SS.",
});

export const DateTimeStringSchema = t.String({
  format: "date-time",
  error: "Invalid date-time format. Please use ISO 8601 format.",
});

export const OptionalDateTimeStringSchema = t.Optional(
  t.Union([DateTimeStringSchema, t.Null()])
);

// Domain-specific schemas
export const GenderSchema = t.Union([t.Literal("male"), t.Literal("female")], {
  error: "Gender must be 'male' or 'female'.",
});

export const OptionalGenderSchema = t.Optional(
  t.Union([GenderSchema, t.Null()])
);

export const ActivityLevelSchema = t.Integer({
  minimum: 1,
  maximum: 5,
  error: "Activity level must be between 1 and 5.",
});

export const OptionalActivityLevelSchema = t.Optional(
  t.Union([ActivityLevelSchema, t.Null()])
);

export const MealTypeSchema = t.Union(
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
  }
);

export const WeightGoalTypeSchema = t.Union(
  [t.Literal("lose"), t.Literal("maintain"), t.Literal("gain")],
  {
    default: "maintain",
    error: "Weight goal must be 'lose', 'maintain', or 'gain'.",
  }
);

export const OptionalWeightGoalTypeSchema = t.Optional(
  t.Union([WeightGoalTypeSchema, t.Null()])
);

export const AccentColorSchema = t.Union([
  t.Literal("indigo"),
  t.Literal("blue"),
  t.Literal("green"),
  t.Literal("purple"),
]);

export const OptionalAccentColorSchema = t.Optional(AccentColorSchema);

export const MacroPercentageSchema = t.Integer({
  minimum: 5,
  maximum: 70,
  error: "Macro percentage must be between 5% and 70%.",
});

export const MacroValueSchema = t.Number({
  minimum: 0,
  error: "Macro value cannot be negative.",
});

// Common parameter schemas
export const IdParamSchema = t.Object({
  id: t.Union([t.String(), t.Numeric({ minimum: 1 })], {
    error: "Invalid ID parameter.",
  }),
});

// Common response schemas
export const SuccessResponseSchema = t.Object({
  success: t.Boolean(),
  message: t.Optional(t.String()),
});

export const ErrorResponseSchema = t.Object({
  code: t.String(),
  message: t.String(),
  details: t.Optional(t.Unknown()),
});

// Pagination schemas
export const PaginationQuerySchema = t.Object({
  page: t.Optional(t.Integer({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Integer({ minimum: 1, maximum: 100, default: 20 })),
  sortBy: t.Optional(t.String()),
  sortOrder: t.Optional(
    t.Union([t.Literal("asc"), t.Literal("desc")], { default: "desc" })
  ),
});

export const PaginationResponseSchema = t.Object({
  data: t.Array(t.Unknown()),
  pagination: t.Object({
    page: t.Integer(),
    limit: t.Integer(),
    total: t.Integer(),
    totalPages: t.Integer(),
    hasNext: t.Boolean(),
    hasPrev: t.Boolean(),
  }),
});

/**
 * Utility function to create validation constraints
 */
export function createPercentageConstraint() {
  return {
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
  };
}
