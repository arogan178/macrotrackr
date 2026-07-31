// src/modules/auth/schemas.ts
import { t } from "elysia";
import {
  EmailSchema,
  PasswordSchema,
  SuccessResponseSchema,
} from "../../lib/http/schemas";

export const AuthSchemas = {
  register: t.Object({
    email: EmailSchema,
    password: PasswordSchema,
    firstName: t.String({ minLength: 1 }),
    lastName: t.String({ minLength: 1 }),
  }),

  login: t.Object({
    email: EmailSchema,
    password: PasswordSchema,
  }),

  forgotPassword: t.Object({
    email: EmailSchema,
  }),

  // Schema for resetting a password with a token
  resetPassword: t.Object({
    token: t.String(),
    newPassword: PasswordSchema,
  }),

  changePassword: t.Object({
    currentPassword: PasswordSchema,
    newPassword: PasswordSchema,
  }),

  sessionResponse: t.Object({
    authenticated: t.Boolean(),
    user: t.Nullable(
      t.Object({
        id: t.Number(),
        email: t.String(),
        firstName: t.String(),
        lastName: t.String(),
      }),
    ),
  }),

  successResponse: SuccessResponseSchema,

  authResponse: t.Object({
    success: t.Boolean(),
    message: t.Optional(t.String()),
    token: t.Optional(t.String()),
    user: t.Optional(
      t.Nullable(
        t.Object({
          id: t.Number(),
          email: t.String(),
          firstName: t.Optional(t.Nullable(t.String())),
          lastName: t.Optional(t.Nullable(t.String())),
        }),
      ),
    ),
  }),
};
