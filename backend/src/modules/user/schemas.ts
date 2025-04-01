// src/modules/user/schemas.ts
import { t } from "elysia";
import { AuthSchemas } from "../auth/schemas";

// Represents target MACRO DISTRIBUTION IN PERCENTAGES (camelCase)
// Copied from user/types.ts for clarity, or could be imported if structure allows
const MacroTargetPercentagesSchema = t.Object(
  {
    proteinPercentage: t.Integer({ minimum: 5, maximum: 70 }),
    carbsPercentage: t.Integer({ minimum: 5, maximum: 70 }),
    fatsPercentage: t.Integer({ minimum: 5, maximum: 70 }),
    lockedMacros: t.Optional(
      t.Array(
        // Use camelCase 'lockedMacros'
        t.Union([t.Literal("protein"), t.Literal("carbs"), t.Literal("fats")]),
        { default: [] }
      )
    ),
  },
  {
    // Validator for sum = 100
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

// *** ADDED: Export the static TypeScript type derived from the schema ***
export type MacroTargetPercentages = typeof MacroTargetPercentagesSchema.static;

// Reusable optional types for updates
const OptionalDateString = t.Optional(
  t.Union([t.String({ format: "date" }), t.Null()])
);
const OptionalPositiveNumber = t.Optional(
  t.Union([t.Numeric({ minimum: 0 }), t.Null()])
);
const OptionalGender = t.Optional(
  t.Union([t.Literal("male"), t.Literal("female"), t.Null()])
);
const OptionalActivityLevel = t.Optional(
  t.Union([t.Numeric({ minimum: 1, maximum: 5 }), t.Null()])
);

export const UserSchemas = {
  // Schema for the response of the /me endpoint - USE camelCase
  userDetailsResponse: t.Object({
    id: t.Integer(),
    email: AuthSchemas.login.properties.email,
    firstName: t.String(),
    lastName: t.String(),
    createdAt: t.Union([t.Date(), t.String()]),
    // User details (can be null if not set) - USE camelCase
    dateOfBirth: t.Nullable(t.String({ format: "date" })),
    height: t.Nullable(t.Number()),
    weight: t.Nullable(t.Number()),
    gender: t.Nullable(t.Union([t.Literal("male"), t.Literal("female")])),
    activityLevel: t.Nullable(t.Integer({ minimum: 1, maximum: 5 })),
    // Macro target percentages - USE camelCase & RENAMED key
    // Use the schema constant here
    macroTarget: t.Nullable(MacroTargetPercentagesSchema),
  }),

  // Schema for updating user settings - USE camelCase
  userSettingsUpdate: t.Object({
    // Basic user info (optional updates)
    firstName: t.Optional(t.String()),
    lastName: t.Optional(t.String()),
    email: t.Optional(AuthSchemas.login.properties.email),
    // User details (optional updates, allow null to clear) - USE camelCase
    dateOfBirth: OptionalDateString,
    height: OptionalPositiveNumber,
    weight: OptionalPositiveNumber,
    gender: OptionalGender,
    activityLevel: OptionalActivityLevel,
    // Macro target percentages (optional update) - USE camelCase & RENAMED key
    // Use the schema constant here
    macroTarget: t.Optional(t.Nullable(MacroTargetPercentagesSchema)),
  }),

  // Schema for the simplified profile completion endpoint - USE camelCase
  profileCompletion: t.Object({
    dateOfBirth: OptionalDateString,
    height: OptionalPositiveNumber,
    weight: OptionalPositiveNumber,
    activityLevel: OptionalActivityLevel,
  }),
};
