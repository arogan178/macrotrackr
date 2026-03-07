// src/modules/auth/schemas.ts
import { t } from "elysia";
import { PasswordSchema } from "../../lib/schemas";

export const AuthSchemas = {
  // Schema for resetting a password with a token
  resetPassword: t.Object({
    token: t.String(),
    newPassword: PasswordSchema,
  }),
};
