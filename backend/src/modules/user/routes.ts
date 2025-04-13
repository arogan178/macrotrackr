// src/modules/user/routes.ts
import { Elysia, t } from "elysia";
import { db } from "@/db";
import { UserSchemas } from "./schemas";
import type { AuthenticatedContext } from "@/middleware/auth";
import { generateId } from "@/utils/id-generator"; // Import ID generator from backend utils

// Helper function
const nullify = <T>(value: T | undefined | null): T | null =>
  value === undefined || value === null ? null : value;

// DB Result Type for the JOIN query in GET /me (snake_case)
type UserMeQueryResult = {
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

// API Response Type (camelCase) - Matches UserSchemas.userDetailsResponse
type UserMeApiResponse = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string | Date;
  dateOfBirth: string | null;
  height: number | null;
  weight: number | null;
  gender: "male" | "female" | null;
  activityLevel: number | null;
};

export const userRoutes = (app: Elysia) =>
  app.group("/api/user", (group) =>
    group
      .decorate("db", db)
      // GET /me Handler - (remains the same)
      .get(
        "/me",
        ({ db, user, set }: AuthenticatedContext): UserMeApiResponse | null => {
          console.log(
            `[GET /user/me] Fetching details for user ID: ${user.userId}`
          );
          try {
            const query = `
                SELECT
                    u.id, u.email, u.first_name, u.last_name, u.created_at,
                    ud.date_of_birth, ud.height, ud.weight, ud.gender, ud.activity_level
                FROM users u
                LEFT JOIN user_details ud ON u.id = ud.user_id
                WHERE u.id = ?
            `;
            const dbResult = db.prepare(query).get(user.userId) as
              | UserMeQueryResult
              | undefined;
            console.log("[GET /user/me] Raw DB result:", dbResult);

            if (dbResult === undefined) {
              console.log("[GET /user/me] User not found in DB.");
              set.status = 404;
              throw new Error("User data not found.");
            }

            // Map DB result (snake_case) to API response (camelCase)
            const apiResponse: UserMeApiResponse = {
              id: dbResult.id,
              email: dbResult.email,
              firstName: dbResult.first_name,
              lastName: dbResult.last_name,
              createdAt: dbResult.created_at,
              dateOfBirth: dbResult.date_of_birth,
              height: dbResult.height,
              weight: dbResult.weight,
              gender: dbResult.gender,
              activityLevel: dbResult.activity_level,
            };
            console.log("[GET /user/me] Mapped API response:", apiResponse);

            return apiResponse;
          } catch (error) {
            console.error("[GET /user/me] Handler error:", error);
            if (error instanceof Error && set.status === 404) throw error;
            set.status = 500;
            throw new Error("Failed to fetch user details");
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

      // PUT /settings Handler - Ensure conditional INSERT for weight log
      .put(
        "/settings",
        ({
          db,
          user,
          body,
          set,
        }: AuthenticatedContext & {
          body: typeof UserSchemas.userSettingsUpdate.static;
        }) => {
          const {
            firstName,
            lastName,
            email,
            dateOfBirth,
            height,
            weight, // Get weight from body
            gender,
            activityLevel,
          } = body;

          try {
            // Define the transaction content
            const transactionLogic = () => {
              // --- START: Fetch current weight BEFORE update ---
              let currentWeightInDb: number | null = null;
              const currentDetails = db
                .prepare("SELECT weight FROM user_details WHERE user_id = ?")
                .get(user.userId) as { weight: number | null } | undefined;
              if (currentDetails) {
                currentWeightInDb = currentDetails.weight;
              }
              console.log(
                `[PUT /user/settings] Current weight in DB for user ${user.userId}: ${currentWeightInDb}`
              );
              // --- END: Fetch current weight BEFORE update ---

              // 1. Update users table
              const userUpdateFields: string[] = [];
              const userParams: (string | number | null)[] = [];
              if (firstName !== undefined) {
                userUpdateFields.push("first_name = ?");
                userParams.push(firstName);
              }
              if (lastName !== undefined) {
                userUpdateFields.push("last_name = ?");
                userParams.push(lastName);
              }
              if (email !== undefined) {
                const existing = db
                  .prepare("SELECT id FROM users WHERE email = ? AND id != ?")
                  .get(email, user.userId);
                if (existing) {
                  set.status = 400;
                  throw new Error(
                    "Email address is already in use by another account."
                  );
                }
                userUpdateFields.push("email = ?");
                userParams.push(email);
              }
              if (userUpdateFields.length > 0) {
                userParams.push(user.userId);
                db.prepare(
                  `UPDATE users SET ${userUpdateFields.join(", ")} WHERE id = ?`
                ).run(...userParams);
              }

              // 2. Update or Insert user_details table (UPSERT)
              const detailsUpsertQuery = `
                  INSERT INTO user_details (
                      user_id, date_of_birth, height, weight, gender, activity_level, updated_at
                  )
                  VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                  ON CONFLICT(user_id) DO UPDATE SET
                      date_of_birth = COALESCE(excluded.date_of_birth, user_details.date_of_birth),
                      height = COALESCE(excluded.height, user_details.height),
                      weight = COALESCE(excluded.weight, user_details.weight),
                      gender = COALESCE(excluded.gender, user_details.gender),
                      activity_level = COALESCE(excluded.activity_level, user_details.activity_level),
                      updated_at = CURRENT_TIMESTAMP;
              `;
              db.prepare(detailsUpsertQuery).run(
                user.userId,
                nullify(dateOfBirth),
                nullify(height),
                nullify(weight), // Use weight from body
                nullify(gender),
                nullify(activityLevel)
              );

              // 3. Conditionally INSERT a new weight log entry
              const newWeightProvided = weight !== undefined && weight !== null;
              const weightHasChanged =
                newWeightProvided && weight !== currentWeightInDb;

              if (weightHasChanged) {
                const logDate = new Date().toISOString().split("T")[0]; // Today's date
                const logId = generateId();
                const insertWeightLogQuery = `
                    INSERT INTO weight_log (id, user_id, date, weight)
                    VALUES (?, ?, ?, ?);
                `;
                db.prepare(insertWeightLogQuery).run(
                  logId,
                  user.userId,
                  logDate,
                  weight // Use the new weight from the body
                );
                console.log(
                  `[PUT /user/settings] Weight changed. Inserted new weight log for user ${user.userId}.`
                );
              } else if (newWeightProvided) {
                console.log(
                  `[PUT /user/settings] Weight provided but not changed. No weight log entry added for user ${user.userId}.`
                );
              } else {
                console.log(
                  `[PUT /user/settings] Weight not provided or null. No weight log entry added for user ${user.userId}.`
                );
              }

              // If transaction reaches here without error
              return {
                success: true,
                message: "Settings updated successfully.",
              };
            };

            // Execute the transaction
            const result = db.transaction(transactionLogic)();
            set.status = 200;
            return result; // Return the success object from the transaction
          } catch (error) {
            console.error(
              "[PUT /user/settings] Handler/Transaction error:",
              error
            );

            // Determine status code and error message
            let statusCode = 500;
            let errorCode = "INTERNAL_SERVER_ERROR";
            let errorMessage =
              "Failed to update settings due to an internal error.";

            if (error instanceof Error) {
              // Check if status was set to 400 inside the transaction (e.g., email conflict)
              if (set.status === 400) {
                statusCode = 400;
                errorCode = "VALIDATION_ERROR"; // Or a more specific code if available
                errorMessage = error.message; // Use the specific error message
              } else {
                // Keep default 500 for other errors
                errorMessage = error.message || errorMessage; // Use error message if available
              }
            } else {
              // Handle non-Error throws if necessary
              errorMessage = "An unexpected error occurred.";
            }

            // Set the response status
            set.status = statusCode;

            // Return a formatted error object matching UserSchemas.errorResponse
            // Ensure UserSchemas.errorResponse has 'code' and 'message' fields
            return {
              code: errorCode,
              message: errorMessage,
            };
          }
        },
        {
          body: UserSchemas.userSettingsUpdate,
          response: {
            // Define responses for known success/error cases
            200: t.Object({ success: t.Boolean(), message: t.String() }),
            400: t.Object({ code: t.String(), message: t.String() }), // For email conflict etc.
            // No explicit 500 schema needed here, as we manually return
            // an object matching errorResponse in the catch block.
          },
          detail: {
            summary: "Update user profile and settings",
            tags: ["User"],
          },
        }
      )

      // POST /complete-profile Handler - Changed to always INSERT weight log
      .post(
        "/complete-profile",
        ({
          db,
          user,
          body,
          set,
        }: AuthenticatedContext & {
          body: typeof UserSchemas.profileCompletion.static;
        }) => {
          const { dateOfBirth, height, weight, activityLevel } = body; // Get weight from body

          // Use a transaction for atomicity
          const transaction = db.transaction(() => {
            // 1. Upsert user_details
            const stmt = db.prepare(`
                  INSERT INTO user_details (
                      user_id, date_of_birth, height, weight, activity_level, updated_at
                  )
                  VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                  ON CONFLICT(user_id) DO UPDATE SET
                      date_of_birth = COALESCE(excluded.date_of_birth, user_details.date_of_birth),
                      height = COALESCE(excluded.height, user_details.height),
                      weight = COALESCE(excluded.weight, user_details.weight),
                      activity_level = COALESCE(excluded.activity_level, user_details.activity_level),
                      updated_at = CURRENT_TIMESTAMP;
              `);
            stmt.run(
              user.userId,
              nullify(dateOfBirth),
              nullify(height),
              nullify(weight), // Use weight from body
              nullify(activityLevel)
            );

            // 2. Always INSERT a new weight log entry if weight was provided
            if (weight !== undefined && weight !== null) {
              const logDate = new Date().toISOString().split("T")[0]; // Today's date
              const logId = generateId();
              // Use simple INSERT now, no ON CONFLICT
              const insertWeightLogQuery = `
                  INSERT INTO weight_log (id, user_id, date, weight)
                  VALUES (?, ?, ?, ?);
              `;
              db.prepare(insertWeightLogQuery).run(
                logId,
                user.userId,
                logDate,
                weight
              );
              console.log(
                `[POST /user/complete-profile] INSERTED new weight log for user ${user.userId} on ${logDate} with weight ${weight}`
              );
            }
          });

          try {
            transaction(); // Execute transaction
            set.status = 200;
            return { success: true, message: "Profile details updated." };
          } catch (error) {
            console.error(
              `Error completing profile for user ${user.userId}:`,
              error
            );
            set.status = 500;
            throw new Error("Failed to update profile details");
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
