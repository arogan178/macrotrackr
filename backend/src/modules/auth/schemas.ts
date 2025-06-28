// src/modules/auth/schemas.ts
import { t } from "elysia";
import {
  EmailSchema,
  PasswordSchema,
  RequiredStringSchema,
  DateStringSchema,
  PositiveNumberSchema,
  GenderSchema,
  ActivityLevelSchema,
} from "../../lib/schemas";

export const AuthSchemas = {
  // Schema for validating email existence check
  validateEmail: t.Object({
    email: EmailSchema,
  }),

  // Schema for user registration payload
  register: t.Object({
    email: EmailSchema,
    password: PasswordSchema,
    firstName: RequiredStringSchema,
    lastName: RequiredStringSchema,
    dateOfBirth: DateStringSchema,
    height: PositiveNumberSchema,
    weight: PositiveNumberSchema,
    gender: GenderSchema,
    activityLevel: ActivityLevelSchema,
  }),

  // Schema for user login payload
  login: t.Object({
    email: EmailSchema,
    password: t.String({ minLength: 1, error: "Password is required." }),
  }),

  // Schema defining the structure of the JWT payload
  jwtPayload: t.Object({
    userId: t.Integer({ minimum: 1 }),
    email: EmailSchema,
    firstName: RequiredStringSchema,
    lastName: RequiredStringSchema,
  }),

  // Schema for the response after successful login/registration
  tokenResponse: t.Object({
    token: t.String(),
  }),
};
