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
import { logger } from "../../lib/logger";
import type { AuthenticatedContext } from "../../types";

// import { rateLimiters } from "../../middleware/rate-limit"; // Temporarily disabled

// Extended auth context type for route handlers
// Extends AuthenticatedContext with module-specific properties
interface AuthRouteContext extends AuthenticatedContext {
  body?: Record<string, unknown>;
  params?: Record<string, string>;
  query: Record<string, string | undefined>;
  db: Database;
  jwt?: { sign: (payload: any) => Promise<string> };
  clerkClient?: any;
}

export const authRoutes = (app: Elysia) =>
  app.group("/api/auth", (group) =>
    group
      // .use(rateLimiters.auth) // Temporarily disabled for testing
      .decorate("db", db)

      /**
       * POST /validate-email - Check if an email is available for registration
       * 
       * @deprecated Use Clerk authentication instead.
       * This endpoint will be removed in a future version.
       * Clerk handles email validation during the signup process.
       */
      .post(
        "/validate-email",
        async (context: any) => {
          const { body, db, set } = context as AuthRouteContext & {
            set: { headers: Record<string, string> };
          };
          
          // Add deprecation headers
          set.headers = set.headers || {};
          set.headers["X-Deprecated"] = "true";
          set.headers["X-Deprecation-Message"] = "Use Clerk authentication. This endpoint will be removed.";
          
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
            summary: "[DEPRECATED] Check if an email is available for registration",
            description: "This endpoint is deprecated. Clerk now handles email validation.",
            tags: ["Auth", "Deprecated"],
          },
        }
      )

      /**
       * POST /register - Register a new user account
       * 
       * @deprecated Use Clerk authentication instead.
       * This endpoint will be removed in a future version.
       * Use Clerk's SignUp component for new user registration.
       */
      .post(
        "/register",
        async (context: any) => {
          const { body, db, jwt, set } = context as AuthRouteContext & {
            jwt: { sign: (payload: any) => Promise<string> };
            set: { headers: Record<string, string> };
          };
          
          // Add deprecation headers
          set.headers = set.headers || {};
          set.headers["X-Deprecated"] = "true";
          set.headers["X-Deprecation-Message"] = "Use Clerk authentication. This endpoint will be removed.";
          
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
          detail: { 
            summary: "[DEPRECATED] Register a new user account", 
            description: "This endpoint is deprecated. Use Clerk's SignUp component instead.",
            tags: ["Auth", "Deprecated"] 
          },
        }
      )

      /**
       * POST /login - Authenticate user and retrieve JWT token
       * 
       * @deprecated Use Clerk authentication instead.
       * This endpoint will be removed in a future version.
       * Use Clerk's SignIn component for authentication.
       */
      .post(
        "/login",
        async (context: any) => {
          const { body, db, jwt, set } = context as AuthRouteContext & {
            jwt: { sign: (payload: any) => Promise<string> };
            set: { headers: Record<string, string> };
          };
          
          // Add deprecation headers
          set.headers = set.headers || {};
          set.headers["X-Deprecated"] = "true";
          set.headers["X-Deprecation-Message"] = "Use Clerk authentication. This endpoint will be removed.";
          
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
            summary: "[DEPRECATED] Authenticate user and retrieve JWT token",
            description: "This endpoint is deprecated. Use Clerk's SignIn component instead.",
            tags: ["Auth", "Deprecated"],
          },
        }
      )
      
      /**
       * POST /forgot-password - Request a password reset link
       * 
       * @deprecated Use Clerk authentication instead.
       * This endpoint will be removed in a future version.
       * Use Clerk's password reset flow for password recovery.
       */
      .post(
        "/forgot-password",
        async (context: any) => {
          const { body, db, set } = context as AuthRouteContext & {
            set: { headers: Record<string, string> };
          };
          
          // Add deprecation headers
          set.headers = set.headers || {};
          set.headers["X-Deprecated"] = "true";
          set.headers["X-Deprecation-Message"] = "Use Clerk authentication. This endpoint will be removed.";
          
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
            summary: "[DEPRECATED] Request a password reset link",
            description: "This endpoint is deprecated. Use Clerk's password reset flow instead.",
            tags: ["Auth", "Deprecated"],
          },
        }
      )

      /**
       * POST /reset-password - Reset password using a valid token
       * 
       * @deprecated Use Clerk authentication instead.
       * This endpoint will be removed in a future version.
       * Use Clerk's password reset flow for password recovery.
       */
      .post(
        "/reset-password",
        async (context: any) => {
          const { body, db, set } = context as AuthRouteContext & {
            set: { headers: Record<string, string> };
          };
          
          // Add deprecation headers
          set.headers = set.headers || {};
          set.headers["X-Deprecated"] = "true";
          set.headers["X-Deprecation-Message"] = "Use Clerk authentication. This endpoint will be removed.";
          
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
            summary: "[DEPRECATED] Reset password using a valid token",
            description: "This endpoint is deprecated. Use Clerk's password reset flow instead.",
            tags: ["Auth", "Deprecated"],
          },
        }
      )

      // Clerk User Sync - Sync Clerk user with our database
      .post(
        "/clerk-sync",
        async (context: any) => {
          const { db, user, clerkClient } = context as AuthRouteContext;
          
          if (!user?.clerkUserId) {
            throw new AuthenticationError("Unauthorized - No Clerk user ID found");
          }

          const clerkUserId = user.clerkUserId;
          let email = user.email as string | undefined;
          let firstName = (user.firstName as string | undefined) || "";
          let lastName = (user.lastName as string | undefined) || "";

          // Defensive fallback: resolve missing Clerk profile fields from Clerk API.
          if (!email || !firstName || !lastName) {
            try {
              const clerkUser = await clerkClient?.users?.getUser?.(clerkUserId);
              email = email || clerkUser?.emailAddresses?.[0]?.emailAddress;
              firstName = firstName || clerkUser?.firstName || "";
              lastName = lastName || clerkUser?.lastName || "";
            } catch (error) {
              logger.warn(
                { clerkUserId, error },
                "Failed to resolve Clerk user details during sync"
              );
            }
          }

          if (!email) {
            throw new AuthenticationError(
              "Unable to resolve Clerk account email. Please verify your email and try again."
            );
          }

          logger.info({ clerkUserId, email, firstName, lastName }, "[clerk-sync] Syncing Clerk user with database");

          // Check if user already exists (prefer clerk_id match).
          const existingByClerkId = safeQuery<UserRow & { email: string }>(
            db,
            "SELECT id, email FROM users WHERE clerk_id = ?",
            [clerkUserId]
          );
          
          const existingByEmail = safeQuery<UserRow & { clerk_id: string | null; email: string }>(
            db,
            "SELECT id, clerk_id, email FROM users WHERE LOWER(email) = LOWER(?)",
            [email]
          );
          
          logger.info({ 
            foundByClerkId: !!existingByClerkId, 
            foundByEmail: !!existingByEmail,
            clerkUserId,
            email 
          }, "[clerk-sync] User lookup results");
          
          const existingUser = existingByClerkId || existingByEmail;

          if (existingUser) {
            // Update existing user with Clerk ID
            logger.info({ 
              userId: existingUser.id, 
              clerkUserId,
              existingClerkId: existingByEmail?.clerk_id,
              matchedBy: existingByClerkId ? "clerk_id" : "email"
            }, "[clerk-sync] Updating existing user");
            
            // Handle email updates carefully for multi-provider account linking and account merges
            const currentEmail = existingUser.email;
            let emailToUpdate = email;
            
            // Check if incoming email belongs to a DIFFERENT existing user (account merge scenario)
            const emailOwner = safeQuery<{ id: number; clerk_id: string | null }>(
              db,
              "SELECT id, clerk_id FROM users WHERE LOWER(email) = LOWER(?) AND id != ?",
              [email, existingUser.id]
            );
            
            if (emailOwner) {
              // Account merge scenario: incoming email exists on another database record
              // This happens when Clerk merges two accounts (e.g., Google link to existing account)
              // We should NOT update email - it would violate unique constraint
              // Both accounts need manual merge or the other account should be deleted first
              logger.warn({
                userId: existingUser.id,
                currentEmail,
                incomingEmail: email,
                emailOwnerId: emailOwner.id,
                emailOwnerClerkId: emailOwner.clerk_id,
                clerkUserId,
                matchedBy: existingByClerkId ? "clerk_id" : "email"
              }, "[clerk-sync] Account merge scenario detected: incoming email belongs to different user, keeping existing email");
              emailToUpdate = currentEmail;
            } else if (currentEmail && currentEmail.toLowerCase() !== email.toLowerCase()) {
              // Email is different and NOT owned by another user - safe to update
              emailToUpdate = email;
            }
            
            safeExecute(
              db,
              "UPDATE users SET clerk_id = ?, email = ?, first_name = ?, last_name = ? WHERE id = ?",
              [clerkUserId, emailToUpdate, firstName, lastName, existingUser.id]
            );

            return {
              id: existingUser.id,
              clerkId: clerkUserId,
              email: emailToUpdate,
              firstName,
              lastName,
              message: "User synced successfully",
            };
          }

          // Create new user
          const userData = withTransaction(db, () => {
            // Insert user
            const userResult = safeExecute(
              db,
              "INSERT INTO users (email, first_name, last_name, clerk_id, password) VALUES (?, ?, ?, ?, ?)",
              [email, firstName, lastName, clerkUserId, "clerk-auth"] // No password for Clerk users
            );
            const userId = Number(userResult.lastInsertRowid);

            // Insert default user details (empty, can be filled later)
            safeExecute(
              db,
              `INSERT INTO user_details (user_id, date_of_birth, height, weight, gender, activity_level)
               VALUES (?, NULL, NULL, NULL, NULL, NULL)`,
              [userId]
            );

            // Insert default macro targets
            safeExecute(
              db,
              `INSERT INTO macro_targets (user_id, protein_percentage, carbs_percentage, fats_percentage, locked_macros)
               VALUES (?, 30, 40, 30, '[]')`,
              [userId]
            );

            return { userId };
          });

          return {
            id: userData.userId,
            clerkId: clerkUserId,
            email,
            firstName,
            lastName,
            message: "User created and synced successfully",
          };
        },
        {
          detail: {
            summary: "Sync Clerk user with database",
            description: "Creates or updates a user in our database based on Clerk authentication",
            tags: ["Auth"],
          },
        }
      )
  );
