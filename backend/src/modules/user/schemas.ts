// src/modules/user/schemas.ts
import { t } from "elysia";
import { AuthSchemas } from "../auth/schemas";

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
  userDetailsResponse: t.Object({
    id: t.Integer(),
    email: AuthSchemas.login.properties.email,
    firstName: t.String(),
    lastName: t.String(),
    createdAt: t.String(),
    dateOfBirth: t.Nullable(t.String({ format: "date" })),
    height: t.Nullable(t.Number()),
    weight: t.Nullable(t.Number()),
    gender: t.Nullable(t.Union([t.Literal("male"), t.Literal("female")])),
    activityLevel: t.Nullable(t.Integer({ minimum: 1, maximum: 5 })),
    subscription: t.Object({
      status: t.Union([
        t.Literal("free"),
        t.Literal("pro"),
        t.Literal("canceled"),
      ]),
      hasStripeCustomer: t.Boolean(),
      subscription: t.Nullable(
        t.Object({
          id: t.String(),
          status: t.Union([
            t.Literal("active"),
            t.Literal("canceled"),
            t.Literal("past_due"),
            t.Literal("unpaid"),
          ]),
          currentPeriodEnd: t.String(),
          stripeSubscriptionId: t.String(),
        })
      ),
    }),
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
  }),

  // Schema for the simplified profile completion endpoint - USE camelCase
  profileCompletion: t.Object({
    dateOfBirth: OptionalDateString,
    height: OptionalPositiveNumber,
    weight: OptionalPositiveNumber,
    activityLevel: OptionalActivityLevel,
  }),

  // Schema for changing a user's password
  changePassword: t.Object({
    currentPassword: t.String(),
    newPassword: t.String(),
  }),
};
