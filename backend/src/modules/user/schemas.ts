// src/modules/user/schemas.ts
import { t } from "elysia";
import { AuthSchemas } from "../auth/schemas"; // Import shared schemas if needed

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

// Define the structure for macro distribution settings
const MacroDistributionSettingsSchema = t.Object(
  {
    proteinPercentage: t.Integer({
      minimum: 5,
      maximum: 70,
      error: "Protein % must be between 5 and 70.",
    }),
    carbsPercentage: t.Integer({
      minimum: 5,
      maximum: 70,
      error: "Carbs % must be between 5 and 70.",
    }),
    fatsPercentage: t.Integer({
      minimum: 5,
      maximum: 70,
      error: "Fats % must be between 5 and 70.",
    }),
    locked_macros: t.Array(
      t.Union([t.Literal("protein"), t.Literal("carbs"), t.Literal("fats")]),
      {
        default: [],
        error:
          "Locked macros must be an array containing 'protein', 'carbs', or 'fats'.",
      }
    ),
  },
  {
    // Additional validation rule for the object itself
    validator: (value) => {
      if (
        value.proteinPercentage +
          value.carbsPercentage +
          value.fatsPercentage !==
        100
      ) {
        return "Macro percentages must sum up to exactly 100.";
      }
      return true; // Indicates validation passed
    },
  }
);

export const UserSchemas = {
  // Schema for the response of the /me endpoint
  userDetailsResponse: t.Object({
    id: t.Integer(),
    email: AuthSchemas.login.properties.email, // Reuse email schema
    first_name: AuthSchemas.register.properties.firstName, // Reuse name schema
    last_name: AuthSchemas.register.properties.lastName, // Reuse name schema
    created_at: t.Union([t.Date(), t.String()]), // Allow Date object or ISO string
    // User details (can be null if not set)
    date_of_birth: t.Nullable(t.String({ format: "date" })),
    height: t.Nullable(t.Number()),
    weight: t.Nullable(t.Number()),
    gender: t.Nullable(t.Union([t.Literal("male"), t.Literal("female")])),
    activity_level: t.Nullable(t.Integer({ minimum: 1, maximum: 5 })),
    // Macro distribution settings
    macro_distribution: t.Nullable(MacroDistributionSettingsSchema), // Can be null if not set
  }),

  // Schema for updating user settings
  userSettingsUpdate: t.Object({
    // Basic user info (optional updates)
    first_name: t.Optional(AuthSchemas.register.properties.firstName),
    last_name: t.Optional(AuthSchemas.register.properties.lastName),
    email: t.Optional(AuthSchemas.login.properties.email), // Allow email update
    // User details (optional updates, allow null to clear)
    date_of_birth: OptionalDateString,
    height: OptionalPositiveNumber,
    weight: OptionalPositiveNumber,
    gender: OptionalGender,
    activity_level: OptionalActivityLevel,
    // Macro distribution (optional update)
    macro_distribution: t.Optional(MacroDistributionSettingsSchema), // Use the defined schema
  }),

  // Schema for the simplified profile completion endpoint
  profileCompletion: t.Object({
    dateOfBirth: OptionalDateString,
    height: OptionalPositiveNumber,
    weight: OptionalPositiveNumber,
    activityLevel: OptionalActivityLevel,
  }),
};
