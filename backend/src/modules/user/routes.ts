// src/modules/user/routes.ts
import { Elysia, t } from "elysia";
import { db } from "../../db";
import { UserSchemas } from "./schemas";
import type { AuthenticatedContext } from "../../middleware/auth";
import { generateId } from "../../utils/id-generator";
import { safeQuery, safeExecute, withTransaction } from "../../lib/database";
import { NotFoundError, ConflictError } from "../../lib/errors";
import { toCamelCase, handleError } from "../../lib/responses";
import { getLocalDate } from "../../lib/dates";

// Helper function
const nullify = <T>(value: T | undefined | null): T | null =>
  value === undefined || value === null ? null : value;

// Combined user data query result type
type UserWithDetailsResult = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string | Date;
  date_of_birth: string | null;
  height: number | null;
  weight: number | null;
  gender: "male" | "female" | null;
  activity_level: number | null;
};

export const userRoutes = (app: Elysia) =>
  app.group("/api/user", (group) =>
    group
      .decorate("db", db)

      // GET /me - Get current user details
      .get(
        "/me",
        async (context: any) => {
          try {
            const { db, user } = context as AuthenticatedContext;

            console.log(
              `[GET /user/me] Fetching details for user ID: ${user.userId}`
            );

            const dbResult = safeQuery<UserWithDetailsResult>(
              db,
              `SELECT u.id, u.email, u.first_name, u.last_name, u.created_at,
                      ud.date_of_birth, ud.height, ud.weight, ud.gender, ud.activity_level
               FROM users u
               LEFT JOIN user_details ud ON u.id = ud.user_id
               WHERE u.id = ?`,
              [user.userId]
            );

            if (!dbResult) {
              throw new NotFoundError("User data not found.");
            }

            // Convert to camelCase API response
            return toCamelCase(dbResult);
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
            const { db, user, body } = context as AuthenticatedContext & {
              body: typeof UserSchemas.userSettingsUpdate.static;
            };

            console.log(
              `[PUT /user/settings] Updating settings for user ID: ${user.userId}`
            );

            const {
              firstName,
              lastName,
              email,
              dateOfBirth,
              height,
              weight,
              gender,
              activityLevel,
            } = body;

            return await withTransaction(db, async () => {
              // Check for current weight before updates
              let currentWeight: number | null = null;
              const currentDetails = safeQuery<{ weight: number | null }>(
                db,
                "SELECT weight FROM user_details WHERE user_id = ?",
                [user.userId]
              );
              if (currentDetails) {
                currentWeight = currentDetails.weight;
              }

              // Check if email is already in use
              if (email !== undefined) {
                const existingEmail = safeQuery<{ id: number }>(
                  db,
                  "SELECT id FROM users WHERE email = ? AND id != ?",
                  [email, user.userId]
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
                userParams.push(user.userId);
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
                  user.userId,
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
                const logDate = getLocalDate();
                const logId = generateId();

                safeExecute(
                  db,
                  "INSERT INTO weight_log (id, user_id, date, weight) VALUES (?, ?, ?, ?)",
                  [logId, user.userId, logDate, weight]
                );

                console.log(
                  `[PUT /user/settings] Weight log entry created: ${weight}kg on ${logDate}`
                );
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
            const { db, user, body } = context as AuthenticatedContext & {
              body: typeof UserSchemas.profileCompletion.static;
            };

            console.log(
              `[POST /user/complete-profile] Completing profile for user ID: ${user.userId}`
            );

            const { dateOfBirth, height, weight, activityLevel } = body;

            return await withTransaction(db, async () => {
              // Upsert user_details
              safeExecute(
                db,
                `INSERT INTO user_details (
                   user_id, date_of_birth, height, weight, activity_level, updated_at
                 )
                 VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                 ON CONFLICT(user_id) DO UPDATE SET
                   date_of_birth = COALESCE(excluded.date_of_birth, user_details.date_of_birth),
                   height = COALESCE(excluded.height, user_details.height),
                   weight = COALESCE(excluded.weight, user_details.weight),
                   activity_level = COALESCE(excluded.activity_level, user_details.activity_level),
                   updated_at = CURRENT_TIMESTAMP`,
                [
                  user.userId,
                  nullify(dateOfBirth),
                  nullify(height),
                  nullify(weight),
                  nullify(activityLevel),
                ]
              );

              // Always insert weight log if weight is provided
              if (weight !== undefined && weight !== null) {
                const logDate = getLocalDate();
                const logId = generateId();

                safeExecute(
                  db,
                  "INSERT INTO weight_log (id, user_id, date, weight) VALUES (?, ?, ?, ?)",
                  [logId, user.userId, logDate, weight]
                );

                console.log(
                  `[POST /user/complete-profile] Weight log entry created: ${weight}kg on ${logDate}`
                );
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
  );
