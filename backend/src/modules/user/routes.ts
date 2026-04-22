// src/modules/user/routes.ts
import { Elysia, t } from "elysia";
import { UserSchemas } from "./schemas";
import type { AuthenticatedRouteContextWithUser } from "../../types";
import { generateId } from "../../utils/id-generator";
import {
  safeQuery,
  safeExecute,
  withTransactionAsync,
} from "../../lib/data/database";
import {
  AccountNotSyncedError,
  NotFoundError,
  ConflictError,
  BadRequestError,
} from "../../lib/http/errors";
import { handleError } from "../../lib/http/responses";
import { loggerHelpers, logger } from "../../lib/observability/logger";
import { getConfig } from "../../config";

type UserRouteContext =
  AuthenticatedRouteContextWithUser<Record<string, unknown>>;

const ErrorResponseSchema = t.Object({
  code: t.String(),
  message: t.String(),
  details: t.Optional(t.Unknown()),
});

// Helper function
const nullify = <T>(value: T | undefined | null): T | null => value ?? null;

// Type for user details query result
interface UserDetailsResult {
  id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  subscription_status: "free" | "pro" | "canceled" | string | null;
  date_of_birth: string | null;
  height: number | null;
  weight: number | null;
  gender: "male" | "female" | null;
  activity_level: number | null;
}

function normalizeSubscriptionStatus(
  status: string | null | undefined,
): "free" | "pro" | "canceled" {
  if (getConfig().APP_MODE === "self-hosted") {
    return "pro";
  }

  if (status === "pro" || status === "canceled") {
    return status;
  }
  return "free";
}

export const userRoutes = (app: Elysia) =>
  app.group("/api/user", (group) =>
    group
      // GET /me - Get current user details
      .get(
        "/me",
        async (rawContext: unknown) => {
          const context = rawContext as UserRouteContext;
          try {
            const { db } = context;
            const { userId: internalUserId, authProvider, providerUserId } =
              context.authenticatedUser;

            if (internalUserId === null) {
              throw new AccountNotSyncedError("Unable to resolve internal user ID.");
            }

            logger.info(
              { internalUserId, authProvider, providerUserId },
              "[/api/user/me] Found internal user",
            );

            // Fetch user details
            const dbResult = safeQuery<UserDetailsResult>(
              db,
                  `SELECT u.id, u.email, u.first_name, u.last_name, u.created_at,
                    u.subscription_status,
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

            return {
              id: dbResult.id,
              email: dbResult.email,
              firstName: dbResult.first_name ?? "",
              lastName: dbResult.last_name ?? "",
              createdAt: dbResult.created_at,
              dateOfBirth: dbResult.date_of_birth,
              height: dbResult.height,
              weight: dbResult.weight,
              gender: dbResult.gender,
              activityLevel: dbResult.activity_level,
              isProfileComplete: !!dbResult.date_of_birth,
              subscription: {
                status: normalizeSubscriptionStatus(dbResult.subscription_status),
              },
            };
          } catch (error) {
            if (error instanceof NotFoundError) {
              throw new AccountNotSyncedError(
                "Your account setup is not finished yet. Please complete your profile.",
              );
            }

            return handleError(error, context.set);
          }
        },
        {
          response: {
            200: UserSchemas.userDetailsResponse,
            401: ErrorResponseSchema,
            404: ErrorResponseSchema,
            500: ErrorResponseSchema,
          },
          detail: {
            summary: "Get current authenticated user's profile and settings",
            tags: ["User"],
          },
        }
      )

      // PUT /settings Handler - Update user settings
      .put(
        "/settings",
        async (rawContext: unknown) => {
          const context = rawContext as UserRouteContext;
          try {
            const { db, body, request } = context;
            const { userId: internalUserId } = context.authenticatedUser;

            if (internalUserId === null) {
              throw new AccountNotSyncedError("Unable to resolve internal user ID.");
            }

            if (!body) {
              throw new BadRequestError("Request body is required");
            }

            // Get correlation ID from request headers if available
            const correlationId =
              request.headers.get("x-correlation-id") ?? undefined;

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

            return await withTransactionAsync(db, async () => {
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
              const newWeightProvided = weight != null;
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
            return handleError(error, context.set);
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
        async (rawContext: unknown) => {
          const context = rawContext as UserRouteContext;
          try {
            const { db, body, request } = context;
            const { userId: internalUserId } = context.authenticatedUser;

            if (internalUserId === null) {
              throw new AccountNotSyncedError("Unable to resolve internal user ID.");
            }

            if (!body) {
              throw new BadRequestError("Request body is required");
            }

            // Get correlation ID from request headers if available
            const correlationId =
              request.headers.get("x-correlation-id") ?? undefined;

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

            return await withTransactionAsync(db, async () => {
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
              if (weight != null) {
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
                message: "Profile details updated.",
              };
            });
          } catch (error) {
            return handleError(error, context.set);
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

  );
