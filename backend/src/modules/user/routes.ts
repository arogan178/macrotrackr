// src/modules/user/routes.ts
import { Elysia, t } from "elysia";
import { db } from "../../db";
import { UserSchemas } from "./schemas";
import type { AuthenticatedContext } from "../../types";
import { generateId } from "../../utils/id-generator";
import { safeQuery, safeExecute, withTransaction } from "../../lib/database";
import {
  NotFoundError,
  ConflictError,
  AuthenticationError,
} from "../../lib/errors";
import { toCamelCase, handleError } from "../../lib/responses";
import { loggerHelpers } from "../../lib/logger";
import { hashPassword, verifyPassword } from "../../lib/password";
import { SubscriptionService } from "../billing/subscription-service";
import type { Database } from "bun:sqlite";
import { logger } from "../../lib/logger";
import { getInternalUserId } from "../../lib/clerk-utils";

// Extended user context type for route handlers
// Extends AuthenticatedContext with module-specific properties
interface UserRouteContext extends AuthenticatedContext {
  body?: Record<string, unknown>;
  params?: Record<string, string>;
  query: Record<string, string | undefined>;
  db: Database;
}

// Helper function
const nullify = <T>(value: T | undefined | null): T | null =>
  value === undefined || value === null ? null : value;

// Type for user details query result
interface UserDetailsResult {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
  date_of_birth: string | null;
  height: number | null;
  weight: number | null;
  gender: "male" | "female" | null;
  activity_level: number | null;
}

export const userRoutes = (app: Elysia) =>
  app.group("/api/user", (group) =>
    group
      .decorate("db", db)

      // GET /me - Get current user details
      .get(
        "/me",
        async (context: any) => {
          try {
            const { db, user } = context as UserRouteContext;

            if (!user?.clerkUserId) {
              throw new AuthenticationError("Unauthorized");
            }

            // Get internal user ID from Clerk ID
            logger.info({ clerkUserId: user.clerkUserId, email: user.email }, "[/api/user/me] Looking up internal user ID");
            
            const internalUserId = getInternalUserId(
              db,
              user.clerkUserId,
              user.email
            );

            if (!internalUserId) {
              // User doesn't exist in our DB yet - this shouldn't happen
              // if they called /auth/clerk-sync first, but handle it gracefully
              logger.error(
                { clerkUserId: user.clerkUserId, email: user.email },
                "[/api/user/me] User not found in database - sync may have failed"
              );
              throw new NotFoundError(
                "User not found. Please sign out and sign in again."
              );
            }
            
            logger.info({ internalUserId, clerkUserId: user.clerkUserId }, "[/api/user/me] Found internal user");

            // Fetch user details
            const dbResult = safeQuery<UserDetailsResult>(
              db,
              `SELECT u.id, u.email, u.first_name, u.last_name, u.created_at,
                      ud.date_of_birth, ud.height, ud.weight, ud.gender, ud.activity_level
               FROM users u
               LEFT JOIN user_details ud ON u.id = ud.user_id
               WHERE u.id = ?
               LIMIT 1`,
              [internalUserId]
            );

            if (!dbResult) {
              throw new NotFoundError("User data not found.");
            }

            // Get only summary subscription info
            const subscriptionInfo =
              await SubscriptionService.getUserSubscription(internalUserId);
            const result = toCamelCase(dbResult);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (result as Record<string, any>).subscription = {
              status: subscriptionInfo.subscription_status,
              hasStripeCustomer: !!subscriptionInfo.stripe_customer_id,
              currentPeriodEnd:
                subscriptionInfo.subscription?.current_period_end || null,
            };

            // Add profile completion flag based on date of birth
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (result as Record<string, any>).isProfileComplete = !!dbResult.date_of_birth;

            // Do NOT include any detailed billing or payment info here
            return result;
          } catch (error) {
            return handleError(error, context);
          }
        },
        {
          response: UserSchemas.userDetailsResponse,
          detail: {
            summary: "Get current authenticated user's profile and settings",
            tags: ["User"],
          },
        }
      )

      // PUT /settings Handler - Update user settings
      .put(
        "/settings",
        async (context: any) => {
          try {
            const { db, user, body, request } = context as UserRouteContext;

            if (!user?.clerkUserId) {
              throw new AuthenticationError("Unauthorized");
            }

            if (!body) {
              throw new Error("Request body is required");
            }

            // Get internal user ID from Clerk ID
            const internalUserId = getInternalUserId(
              db,
              user.clerkUserId,
              user.email
            );

            if (!internalUserId) {
              throw new NotFoundError(
                "User not found. Please sign out and sign in again."
              );
            }

            // Get correlation ID from request headers if available
            const correlationId =
              request.headers.get("x-correlation-id") || undefined;

            loggerHelpers.apiRequest("PUT", "/user/settings", internalUserId, {
              correlationId,
            });

            const {
              firstName,
              lastName,
              email,
              dateOfBirth,
              height,
              weight,
              gender,
              activityLevel,
            } = body as {
              firstName?: string;
              lastName?: string;
              email?: string;
              dateOfBirth?: string;
              height?: number;
              weight?: number;
              gender?: "male" | "female";
              activityLevel?: number;
            };

            return await withTransaction(db, async () => {
              // Check for current weight before updates
              let currentWeight: number | null = null;
              const currentDetails = safeQuery<{ weight: number | null }>(
                db,
                "SELECT weight FROM user_details WHERE user_id = ?",
                [internalUserId]
              );
              if (currentDetails) {
                currentWeight = currentDetails.weight;
              }

              // Check if email is already in use
              if (email !== undefined) {
                const existingEmail = safeQuery<{ id: number }>(
                  db,
                  "SELECT id FROM users WHERE email = ? AND id != ?",
                  [email, internalUserId]
                );
                if (existingEmail) {
                  throw new ConflictError(
                    "Email address is already in use by another account."
                  );
                }
              }

              // Update users table
              const userUpdateFields: string[] = [];
              const userParams: (string | number)[] = [];

              if (firstName !== undefined) {
                userUpdateFields.push("first_name = ?");
                userParams.push(firstName);
              }
              if (lastName !== undefined) {
                userUpdateFields.push("last_name = ?");
                userParams.push(lastName);
              }
              if (email !== undefined) {
                userUpdateFields.push("email = ?");
                userParams.push(email);
              }

              if (userUpdateFields.length > 0) {
                userParams.push(internalUserId);
                safeExecute(
                  db,
                  `UPDATE users SET ${userUpdateFields.join(
                    ", "
                  )} WHERE id = ?`,
                  userParams
                );
              }

              // Upsert user_details
              safeExecute(
                db,
                `INSERT INTO user_details (
                   user_id, date_of_birth, height, weight, gender, activity_level, updated_at
                 )
                 VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                 ON CONFLICT(user_id) DO UPDATE SET
                   date_of_birth = COALESCE(excluded.date_of_birth, user_details.date_of_birth),
                   height = COALESCE(excluded.height, user_details.height),
                   weight = COALESCE(excluded.weight, user_details.weight),
                   gender = COALESCE(excluded.gender, user_details.gender),
                   activity_level = COALESCE(excluded.activity_level, user_details.activity_level),
                   updated_at = CURRENT_TIMESTAMP`,
                [
                  internalUserId,
                  nullify(dateOfBirth),
                  nullify(height),
                  nullify(weight),
                  nullify(gender),
                  nullify(activityLevel),
                ]
              );

              // Log weight change if weight is provided and different
              const newWeightProvided = weight !== undefined && weight !== null;
              const weightHasChanged =
                newWeightProvided && weight !== currentWeight;

              if (weightHasChanged) {
                const logTimestamp = new Date().toISOString(); // Use full timestamp
                const logId = generateId();

                safeExecute(
                  db,
                  "INSERT INTO weight_log (id, user_id, timestamp, weight) VALUES (?, ?, ?, ?)",
                  [logId, internalUserId, logTimestamp, weight]
                );

                loggerHelpers.dbQuery("INSERT", "weight_log", internalUserId, 1);
              }

              return {
                success: true,
                message: "Settings updated successfully",
              };
            });
          } catch (error) {
            return handleError(error, context);
          }
        },
        {
          body: UserSchemas.userSettingsUpdate,
          response: {
            200: t.Object({ success: t.Boolean(), message: t.String() }),
            400: t.Object({ code: t.String(), message: t.String() }),
          },
          detail: {
            summary: "Update user profile and settings",
            tags: ["User"],
          },
        }
      )

      // POST /complete-profile Handler - Complete user profile
      .post(
        "/complete-profile",
        async (context: any) => {
          try {
            const { db, user, body, request } = context as UserRouteContext;

            if (!user?.clerkUserId) {
              throw new AuthenticationError("Unauthorized");
            }

            if (!body) {
              throw new Error("Request body is required");
            }

            // Get internal user ID from Clerk ID
            const internalUserId = getInternalUserId(
              db,
              user.clerkUserId,
              user.email
            );

            if (!internalUserId) {
              throw new NotFoundError(
                "User not found. Please sign out and sign in again."
              );
            }

            // Get correlation ID from request headers if available
            const correlationId =
              request.headers.get("x-correlation-id") || undefined;

            loggerHelpers.apiRequest(
              "POST",
              "/user/complete-profile",
              internalUserId,
              {
                correlationId,
              }
            );

            const { dateOfBirth, height, weight, gender, activityLevel } = body as {
              dateOfBirth?: string;
              height?: number;
              weight?: number;
              gender?: "male" | "female";
              activityLevel?: number;
            };

            return await withTransaction(db, async () => {
              // Upsert user_details
              safeExecute(
                db,
                `INSERT INTO user_details (
                   user_id, date_of_birth, height, weight, gender, activity_level, updated_at
                 )
                 VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                 ON CONFLICT(user_id) DO UPDATE SET
                   date_of_birth = COALESCE(excluded.date_of_birth, user_details.date_of_birth),
                   height = COALESCE(excluded.height, user_details.height),
                   weight = COALESCE(excluded.weight, user_details.weight),
                   gender = COALESCE(excluded.gender, user_details.gender),
                   activity_level = COALESCE(excluded.activity_level, user_details.activity_level),
                   updated_at = CURRENT_TIMESTAMP`,
                [
                  internalUserId,
                  nullify(dateOfBirth),
                  nullify(height),
                  nullify(weight),
                  nullify(gender),
                  nullify(activityLevel),
                ]
              );

              // Always insert weight log if weight is provided
              if (weight !== undefined && weight !== null) {
                const logTimestamp = new Date().toISOString(); // Use full timestamp
                const logId = generateId();

                safeExecute(
                  db,
                  "INSERT INTO weight_log (id, user_id, timestamp, weight) VALUES (?, ?, ?, ?)",
                  [logId, internalUserId, logTimestamp, weight]
                );

                loggerHelpers.dbQuery("INSERT", "weight_log", internalUserId, 1);
              }

              return { success: true, message: "Profile details updated." };
            });
          } catch (error) {
            return handleError(error, context);
          }
        },
        {
          body: UserSchemas.profileCompletion,
          response: {
            200: t.Object({ success: t.Boolean(), message: t.String() }),
          },
          detail: {
            summary:
              "Add or update specific user details (e.g., during onboarding)",
            tags: ["User"],
          },
        }
      )

      /**
       * PUT /password - Change user password
       * 
       * @deprecated This endpoint is deprecated and will be removed in v2.0.0.
       * Clerk-authenticated users should use Clerk's password management instead.
       * This endpoint only works for legacy users who haven't migrated to Clerk auth.
       * 
       * @see https://clerk.com/docs/custom-flows/passwords for Clerk password management
       */
      .put(
        "/password",
        async (context: any) => {
          try {
            const { db, user, body } = context as UserRouteContext;

            // Log deprecation warning
            logger.warn(
              { operation: "deprecated_endpoint", endpoint: "/api/user/password" },
              "DEPRECATED: /api/user/password endpoint called. This will be removed in v2.0.0."
            );

            if (!user?.clerkUserId) {
              throw new AuthenticationError("Unauthorized");
            }

            // Get internal user ID from Clerk ID
            const internalUserId = getInternalUserId(
              db,
              user.clerkUserId,
              user.email
            );

            if (!internalUserId) {
              throw new NotFoundError(
                "User not found. Please sign out and sign in again."
              );
            }

            if (!body) {
              throw new Error("Request body is required");
            }

            const { currentPassword, newPassword } = body as {
              currentPassword: string;
              newPassword: string;
            };

            return await withTransaction(db, async () => {
              const dbUser = safeQuery<{ password?: string }>(
                db,
                "SELECT password FROM users WHERE id = ?",
                [internalUserId]
              );

              // Note: Clerk users may not have a password in our DB
              if (!dbUser?.password || dbUser.password === "clerk-auth") {
                throw new AuthenticationError(
                  "Password change not available for Clerk-authenticated users. Please use Clerk's password management."
                );
              }

              const isPasswordValid = await verifyPassword(
                currentPassword,
                dbUser.password
              );

              if (!isPasswordValid) {
                throw new AuthenticationError("Invalid current password.");
              }

              const hashedNewPassword = await hashPassword(newPassword);

              safeExecute(db, "UPDATE users SET password = ? WHERE id = ?", [
                hashedNewPassword,
                internalUserId,
              ]);

              return {
                success: true,
                message: "Password updated successfully.",
              };
            });
          } catch (error) {
            return handleError(error, context);
          }
        },
        {
          body: UserSchemas.changePassword,
          response: {
            200: t.Object({ success: t.Boolean(), message: t.String() }),
          },
          detail: {
            summary: "[DEPRECATED] Change the current user's password - Will be removed in v2.0.0",
            description:
              "This endpoint is deprecated and will be removed in v2.0.0. " +
              "Clerk-authenticated users should use Clerk's password management instead. " +
              "This endpoint only works for legacy users who haven't migrated to Clerk auth.",
            tags: ["User", "Deprecated"],
          },
        }
      )
  );
