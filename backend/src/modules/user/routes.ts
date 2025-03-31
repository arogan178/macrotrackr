// src/modules/user/routes.ts
import { Elysia } from "elysia"; // Removed named Error imports
import { db } from "../../db";
import { UserSchemas } from "./schemas";
import type { AuthenticatedContext } from "../../middleware/auth"; // Import context type

// Helper function to convert undefined values from request body to null for DB storage
const nullify = <T>(value: T | undefined): T | null =>
  value === undefined ? null : value;

export const userRoutes = (app: Elysia) =>
  app.group("/api/user", (group) =>
    group
      // Apply middleware/decorators needed for this group
      .decorate("db", db)
      // All routes in this group require authentication.
      // The 'authMiddleware' applied in index.ts ensures 'user' exists in context.
      // We cast the context type here for convenience within handlers.
      .derive((context) => context as AuthenticatedContext) // Cast includes 'set'

      // --- Get Current User Details ---
      .get(
        "/me",
        ({ db, user, set }) => {
          // Added 'set'
          try {
            // Fetch user base info and details
            const userDataQuery = `
                        SELECT
                            u.id, u.email, u.first_name, u.last_name, u.created_at,
                            ud.date_of_birth, ud.height, ud.weight, ud.gender, ud.activity_level
                        FROM users u
                        LEFT JOIN user_details ud ON u.id = ud.user_id
                        WHERE u.id = ?
                    `;
            const userData = db.prepare(userDataQuery).get(user.userId);

            if (!userData) {
              // This should technically not happen if JWT is valid and user exists
              set.status = 404; // Not Found
              throw new Error("User data not found.");
            }

            // Fetch macro distribution settings
            const macroDistQuery = `
                        SELECT protein_percentage, carbs_percentage, fats_percentage, locked_macros
                        FROM macro_distribution
                        WHERE user_id = ?
                    `;
            const macroDistData = db
              .prepare(macroDistQuery)
              .get(user.userId) as {
              protein_percentage: number;
              carbs_percentage: number;
              fats_percentage: number;
              locked_macros: string; // JSON string from DB
            } | null;

            // Parse macro distribution or set to null if not found
            const macroDistribution = macroDistData
              ? {
                  proteinPercentage: macroDistData.protein_percentage,
                  carbsPercentage: macroDistData.carbs_percentage,
                  fatsPercentage: macroDistData.fats_percentage,
                  // Safely parse JSON string, default to empty array on error/null
                  locked_macros: JSON.parse(
                    macroDistData.locked_macros || "[]"
                  ),
                }
              : null; // Return null if no settings exist

            return {
              ...userData, // Spread basic user and details fields
              macro_distribution: macroDistribution, // Add parsed distribution settings
            };
          } catch (error) {
            // Re-throw if it's the specific 404 error we threw
            if (error instanceof Error && set.status === 404) throw error;
            console.error(
              `Error fetching details for user ${user.userId}:`,
              error
            );
            set.status = 500; // Internal Server Error
            throw new Error("Failed to fetch user details.");
          }
        },
        {
          response: UserSchemas.userDetailsResponse, // Validate the response structure
          detail: {
            summary: "Get current authenticated user's profile and settings",
            tags: ["User"],
          },
        }
      )

      // --- Update User Settings ---
      .put(
        "/settings",
        ({ db, user, body, set }) => {
          // Added 'set'
          const {
            first_name,
            last_name,
            email,
            date_of_birth,
            height,
            weight,
            gender,
            activity_level,
            macro_distribution,
          } = body;

          // Use a transaction for atomic updates across multiple tables
          const transaction = db.transaction(() => {
            // 1. Update users table (if relevant fields provided)
            const userUpdateFields: string[] = [];
            const userParams: (string | number | null)[] = [];

            if (first_name !== undefined) {
              userUpdateFields.push("first_name = ?");
              userParams.push(first_name);
            }
            if (last_name !== undefined) {
              userUpdateFields.push("last_name = ?");
              userParams.push(last_name);
            }
            if (email !== undefined) {
              // Check if the new email is already taken by another user
              const existing = db
                .prepare("SELECT id FROM users WHERE email = ? AND id != ?")
                .get(email, user.userId);
              if (existing) {
                set.status = 400; // Bad Request (or 409 Conflict)
                throw new Error(
                  "Email address is already in use by another account."
                );
              }
              userUpdateFields.push("email = ?");
              userParams.push(email);
            }

            if (userUpdateFields.length > 0) {
              userParams.push(user.userId); // Add user ID for WHERE clause
              db.prepare(
                `UPDATE users SET ${userUpdateFields.join(", ")} WHERE id = ?`
              ).run(...userParams);
            }

            // 2. Update or Insert user_details table (UPSERT logic)
            // Use COALESCE in the SET clause to only update fields that are explicitly provided in the request body.
            // Fields not provided in the request will retain their existing values in the DB.
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
                            updated_at = CURRENT_TIMESTAMP
                        WHERE user_id = excluded.user_id;
                    `;
            db.prepare(detailsUpsertQuery).run(
              user.userId,
              nullify(date_of_birth), // Convert undefined to null
              nullify(height),
              nullify(weight),
              nullify(gender),
              nullify(activity_level)
            );

            // 3. Update or Insert macro_distribution if provided in the body
            if (macro_distribution !== undefined) {
              // Schema validation already ensures sum=100 and ranges, but double check here if needed
              if (
                macro_distribution.proteinPercentage +
                  macro_distribution.carbsPercentage +
                  macro_distribution.fatsPercentage !==
                100
              ) {
                set.status = 400; // Bad Request
                throw new Error(
                  "Macro percentages must sum up to exactly 100."
                );
              }

              const distUpsertQuery = `
                            INSERT INTO macro_distribution (
                                user_id, protein_percentage, carbs_percentage, fats_percentage, locked_macros, updated_at
                            )
                            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                            ON CONFLICT(user_id) DO UPDATE SET
                                protein_percentage = excluded.protein_percentage,
                                carbs_percentage = excluded.carbs_percentage,
                                fats_percentage = excluded.fats_percentage,
                                locked_macros = excluded.locked_macros,
                                updated_at = CURRENT_TIMESTAMP
                            WHERE user_id = excluded.user_id;
                        `;
              db.prepare(distUpsertQuery).run(
                user.userId,
                macro_distribution.proteinPercentage,
                macro_distribution.carbsPercentage,
                macro_distribution.fatsPercentage,
                JSON.stringify(macro_distribution.locked_macros || []) // Store as JSON string
              );
            }
            // If macro_distribution is explicitly set to null in the request, handle deletion/reset if desired
            // else if (macro_distribution === null) {
            //     db.prepare("DELETE FROM macro_distribution WHERE user_id = ?").run(user.userId);
            // }
          }); // End of transaction definition

          try {
            transaction(); // Execute the transaction
            return { success: true, message: "Settings updated successfully." };
          } catch (error) {
            // Re-throw specific errors from transaction
            if (
              error instanceof Error &&
              (set.status === 400 || set.status === 409)
            )
              throw error;
            console.error(
              `Error updating settings for user ${user.userId}:`,
              error
            );
            set.status = 500; // Internal Server Error
            throw new Error("Failed to update settings due to a server issue.");
          }
        },
        {
          body: UserSchemas.userSettingsUpdate, // Validate request body
          detail: {
            summary: "Update user profile and settings",
            tags: ["User"],
          },
        }
      )

      // --- Complete Profile (Simplified settings update) ---
      // This might be redundant if the main /settings endpoint handles partial updates well.
      // Kept for potential specific UI flows.
      .post(
        "/complete-profile",
        ({ db, user, body, set }) => {
          // Added 'set'
          const { dateOfBirth, height, weight, activityLevel } = body;

          try {
            // Use UPSERT logic similar to /settings update, only for provided fields
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
                            updated_at = CURRENT_TIMESTAMP
                        WHERE user_id = excluded.user_id;
                    `);
            stmt.run(
              user.userId,
              nullify(dateOfBirth),
              nullify(height),
              nullify(weight),
              nullify(activityLevel)
            );
            return { success: true, message: "Profile details updated." };
          } catch (error) {
            console.error(
              `Error completing profile for user ${user.userId}:`,
              error
            );
            set.status = 500; // Internal Server Error
            throw new Error("Failed to update profile details.");
          }
        },
        {
          body: UserSchemas.profileCompletion, // Validate request body
          detail: {
            summary:
              "Add or update specific user details (e.g., during onboarding)",
            tags: ["User"],
          },
        }
      )
  );
