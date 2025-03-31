// src/modules/auth/schemas.ts
import { t } from "elysia"; // Use Elysia's built-in wrapper around Zod

// Common reusable types with specific error messages
const EmailSchema = t.String({
  format: "email",
  error: "Invalid email format.",
});
const PasswordSchema = t.String({
  minLength: 8,
  error: "Password must be at least 8 characters long.",
});
const NameSchema = t.String({ minLength: 1, error: "Name cannot be empty." });
const DateStringSchema = t.String({
  format: "date",
  error: "Invalid date format. Please use YYYY-MM-DD.",
}); // ISO 8601 date
const TimeStringSchema = t.String({
  pattern: "^([01]\\d|2[0-3]):([0-5]\\d)(?::([0-5]\\d))?$",
  error: "Invalid time format. Please use HH:MM or HH:MM:SS.",
}); // HH:MM or HH:MM:SS
const PositiveNumberSchema = t.Numeric({
  minimum: 0,
  error: "Value must be a positive number.",
}); // Use Numeric for auto-coercion from string if needed
const IntegerSchema = t.Integer({ error: "Value must be a whole number." });
const PositiveIntegerSchema = t.Integer({
  minimum: 0,
  error: "Value must be a positive whole number.",
});

export const AuthSchemas = {
  // Schema for validating email existence check
  validateEmail: t.Object({
    email: EmailSchema,
  }),
  // Schema for user registration payload
  register: t.Object({
    email: EmailSchema,
    password: PasswordSchema,
    firstName: NameSchema,
    lastName: NameSchema,
    dateOfBirth: DateStringSchema,
    height: PositiveNumberSchema, // e.g., 175 (cm)
    weight: PositiveNumberSchema, // e.g., 70 (kg)
    gender: t.Union([t.Literal("male"), t.Literal("female")], {
      error: "Gender must be 'male' or 'female'.",
    }),
    // Map activity level names to numbers for storage
    activityLevel: t.Numeric({
      minimum: 1,
      maximum: 5,
      error: "Activity level must be between 1 and 5.",
    }),
  }),
  // Schema for user login payload
  login: t.Object({
    email: EmailSchema,
    password: t.String({ minLength: 1, error: "Password is required." }), // Basic check, complexity handled elsewhere
  }),
  // Schema defining the structure of the JWT payload
  jwtPayload: t.Object({
    userId: t.Integer({ minimum: 1 }), // User ID must be a positive integer
    email: EmailSchema,
    firstName: NameSchema, // Include names for potential display use
    lastName: NameSchema,
    // Add standard JWT claims if needed (Elysia's JWT plugin handles 'exp' automatically)
    // iat: t.Optional(t.Number()), // Issued At timestamp
  }),
  // Schema for the response after successful login/registration
  tokenResponse: t.Object({
    token: t.String(),
  }),
};
