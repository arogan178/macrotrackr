// src/modules/auth/routes.ts
import type { Database } from "bun:sqlite";
import { Elysia } from "elysia";
import { db } from "../../db";
import { AuthSchemas } from "./schemas";
import { hashPassword, verifyPassword } from "../../lib/password";
import {
  safeQuery,
  safeExecute,
  withTransaction,
  type UserRow,
} from "../../lib/database";
import { ConflictError, AuthenticationError } from "../../lib/errors";
import crypto from "crypto";
import { emailService } from "../../lib/email-service";
import { loggerHelpers } from "../../lib/logger";
import { createJwtCookie } from "../../lib/auth-utils";
import type { AuthenticatedContext } from "../../middleware/auth";

// import { rateLimiters } from "../../middleware/rate-limit"; // Temporarily disabled

export const authRoutes = (app: Elysia) =>
  app.group("/api/auth", (group) =>
    group
      // .use(rateLimiters.auth) // Temporarily disabled for testing
      .decorate("db", db)

      // Email Validation
      .post(
        "/validate-email",
        async (context: any) => {
          const { body, db } = context as { body: Record<string, unknown>; db: Database };
          const email = (body as { email: string }).email;
          const existingUser = safeQuery<UserRow>(
            db,
            "SELECT id FROM users WHERE email = ?",
            [email]
          );

          if (existingUser) {
            throw new ConflictError("Email is already registered.");
          }

          return { valid: true };
        },
        {
          body: AuthSchemas.validateEmail,
          detail: {
            summary: "Check if an email is available for registration",
            tags: ["Auth"],
          },
        }
      )

      // User Registration
      .post(
        "/register",
        async (context: any) => {
          const { body, db, jwt, set } = context as AuthenticatedContext & { body: Record<string, unknown> };
          const {
            email,
            password,
            firstName,
            lastName,
            dateOfBirth,
            height,
            weight,
            gender,
            activityLevel,
          } = body as {
            email: string;
            password: string;
            firstName: string;
            lastName: string;
            dateOfBirth: string;
            height: number;
            weight: number;
            gender: "male" | "female";
            activityLevel: number;
          };

          const hashedPassword = await hashPassword(password);

          const userData = withTransaction(db, () => {
            // Check email uniqueness within transaction
            const existingUser = safeQuery<UserRow>(
              db,
              "SELECT id FROM users WHERE email = ?",
              [email]
            );

            if (existingUser) {
              throw new ConflictError(
                "Email has just been registered. Please try logging in."
              );
            }

            // Insert user
            const userResult = safeExecute(
              db,
              "INSERT INTO users (email, password, first_name, last_name) VALUES (?, ?, ?, ?)",
              [email, hashedPassword, firstName, lastName]
            );
            const userId = Number(userResult.lastInsertRowid);

            // Insert user details
            safeExecute(
              db,
              `INSERT INTO user_details (user_id, date_of_birth, height, weight, gender, activity_level)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [userId, dateOfBirth, height, weight, gender, activityLevel]
            );

            // Insert default macro targets
            safeExecute(
              db,
              `INSERT INTO macro_targets (user_id, protein_percentage, carbs_percentage, fats_percentage, locked_macros)
               VALUES (?, 30, 40, 30, '[]')`,
              [userId]
            );

            return { userId, email, firstName, lastName };
          });

          // Generate JWT token
          const token = await jwt.sign({
            userId: userData.userId,
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
          });

          // Set JWT as persistent cookie
          set.headers["Set-Cookie"] = createJwtCookie(token);

          return { token };
        },
        {
          body: AuthSchemas.register,
          response: AuthSchemas.tokenResponse,
          detail: { summary: "Register a new user account", tags: ["Auth"] },
        }
      )

      // User Login
      .post(
        "/login",
        async (context: any) => {
          const { body, db, jwt, set } = context as AuthenticatedContext & { body: Record<string, unknown> };
          const { email, password } = body as { email: string; password: string };

          const user = safeQuery<UserRow>(
            db,
            "SELECT id, password, first_name, last_name, email FROM users WHERE email = ?",
            [email]
          );

          if (!user || !user.password) {
            throw new AuthenticationError("Invalid email or password.");
          }

          const isPasswordValid = await verifyPassword(
            password,
            user.password
          );
          if (!isPasswordValid) {
            throw new AuthenticationError("Invalid email or password.");
          }

          // Generate JWT token
          const token = await jwt.sign({
            userId: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
          });

          // Set JWT as persistent cookie
          set.headers["Set-Cookie"] = createJwtCookie(token);

          return { token };
        },
        {
          body: AuthSchemas.login,
          response: AuthSchemas.tokenResponse,
          detail: {
            summary: "Authenticate user and retrieve JWT token",
            tags: ["Auth"],
          },
        }
      )
      // Password Reset Request
      .post(
        "/forgot-password",
        async (context: any) => {
          const { body, db } = context as { body: Record<string, unknown>; db: Database };
          const { email } = body as { email: string };
          
          loggerHelpers.auth("password_reset_requested", undefined, email);
          
          const user = safeQuery<{ id: number }>(
            db,
            "SELECT id FROM users WHERE email = ?",
            [email]
          );

          if (user) {
            const token = crypto.randomBytes(32).toString("hex");
            const expires = new Date(Date.now() + 3600000); // 1 hour from now

            safeExecute(
              db,
              "UPDATE users SET password_reset_token = ?, password_reset_expires = ? WHERE id = ?",
              [token, expires.toISOString(), user.id]
            );

            // Send password reset email via Resend
            await emailService.sendPasswordResetEmail(email, token);
          } else {
            // Log for monitoring but don't reveal to user
            loggerHelpers.auth("password_reset_no_user", undefined, email, false);
          }

          return {
            message:
              "If an account with that email exists, a password reset link has been sent.",
          };
        },
        {
          body: AuthSchemas.forgotPassword,
          detail: {
            summary: "Request a password reset link",
            tags: ["Auth"],
          },
        }
      )

      // Password Reset Handler
      .post(
        "/reset-password",
        async (context: any) => {
          const { body, db } = context as { body: Record<string, unknown>; db: Database };
          const { token, newPassword } = body as { token: string; newPassword: string };

          const user = safeQuery<UserRow>(
            db,
            "SELECT id, password_reset_expires FROM users WHERE password_reset_token = ?",
            [token]
          );

          if (!user || !user.password_reset_expires) {
            throw new AuthenticationError(
              "Invalid or expired password reset token."
            );
          }

          const expires = new Date(user.password_reset_expires);
          if (expires < new Date()) {
            throw new AuthenticationError(
              "Invalid or expired password reset token."
            );
          }

          const hashedPassword = await hashPassword(newPassword);

          safeExecute(
            db,
            "UPDATE users SET password = ?, password_reset_token = NULL, password_reset_expires = NULL WHERE id = ?",
            [hashedPassword, user.id]
          );

          return { message: "Password has been reset successfully." };
        },
        {
          body: AuthSchemas.resetPassword,
          detail: {
            summary: "Reset password using a valid token",
            tags: ["Auth"],
          },
        }
      )
  );
