// src/modules/goals/routes.ts
import { Elysia, t } from "elysia";
import { db } from "@/db";
import { GoalSchemas } from "./schemas";
import type { AuthenticatedContext } from "@/middleware/auth";
import { generateId } from "@/utils/id-generator";

// Define types for DB results (snake_case) for clarity and type safety
// These should match the columns defined in src/db/schema.ts
type WeightGoalFromDB = {
  id: number;
  user_id: number;
  starting_weight: number | null;
  target_weight: number | null;
  weight_goal: "lose" | "maintain" | "gain" | null;
  start_date: string | null;
  target_date: string | null;
  calorie_target: number | null; // RENAMED
  calculated_weeks: number | null;
  weekly_change: number | null;
  daily_change: number | null; // RENAMED
  created_at: string; // Assuming DATETIME maps to string from DB driver
  updated_at: string;
};

// Type for Weight Log entry from DB
type WeightLogFromDB = {
  id: string;
  user_id: string; // Keep as string if that's how it's consistently used
  timestamp: string; // Changed from date to timestamp
  weight: number;
  created_at: string; // Added created_at if it's selected
};

export const goalRoutes = (app: Elysia) =>
  app.group("/api/goals", (group) =>
    group
      .decorate("db", db)
      // --- Get Weight Goals ---
      .get(
        "/weight",
        ({ user, set, db }: AuthenticatedContext) => {
          console.log(
            `[GET /goals/weight] Handler started for user ${user.userId}`
          ); // LOGGING
          try {
            // Select using renamed column calorie_target, daily_change
            const query =
              "SELECT id, user_id, starting_weight, target_weight, weight_goal, start_date, target_date, calorie_target, calculated_weeks, weekly_change, daily_change, created_at, updated_at FROM weight_goals WHERE user_id = ?";
            console.log("[GET /goals/weight] Preparing query..."); // LOGGING
            const statement = db.prepare(query);
            console.log("[GET /goals/weight] Executing query..."); // LOGGING
            // Use type assertion here, result can be null or undefined from .get()
            const weightGoalsResult = statement.get(user.userId) as
              | WeightGoalFromDB
              | undefined
              | null;
            console.log("[GET /goals/weight] Query result:", weightGoalsResult); // LOGGING

            // *** UPDATED CHECK to handle both null and undefined ***
            if (!weightGoalsResult) {
              console.log(
                "[GET /goals/weight] No weight goals found, returning null."
              ); // LOGGING
              return null; // Return null if not found (matches schema)
            }
            // If we reach here, weightGoalsResult is not null/undefined
            const dbGoal = weightGoalsResult;

            console.log("[GET /goals/weight] Mapping result to camelCase..."); // LOGGING
            // Map snake_case from DB to camelCase for API response
            const apiResponse = {
              startingWeight: dbGoal.starting_weight,
              targetWeight: dbGoal.target_weight,
              weightGoal: dbGoal.weight_goal,
              startDate: dbGoal.start_date,
              targetDate: dbGoal.target_date,
              calorieTarget: dbGoal.calorie_target, // RENAMED
              calculatedWeeks: dbGoal.calculated_weeks,
              weeklyChange: dbGoal.weekly_change,
              dailyChange: dbGoal.daily_change, // RENAMED
            };
            console.log(
              "[GET /goals/weight] Returning mapped response:",
              apiResponse
            ); // LOGGING
            return apiResponse;
          } catch (error) {
            // Log the specific error occurring within this handler
            console.error("[GET /goals/weight] CAUGHT ERROR:", error); // LOGGING
            set.status = 500;
            throw new Error("Failed to fetch weight goals"); // Throw generic error for global handler
          }
        },
        {
          response: GoalSchemas.getWeightGoalResponse,
          detail: {
            summary: "Get the user's weight goals",
            tags: ["Goals"],
          },
        }
      )

      // --- CREATE Weight Goals ---
      .post(
        "/weight",
        ({
          user,
          body,
          set,
          db,
        }: AuthenticatedContext & {
          body: typeof GoalSchemas.createWeightGoalBody.static;
        }) => {
          const transaction = db.transaction(() => {
            // Check if a goal already exists
            const existingGoalQuery =
              "SELECT id FROM weight_goals WHERE user_id = ?";
            const existingGoal = db.prepare(existingGoalQuery).get(user.userId);

            // Use a standard Error for conflict if ConflictError is not available
            if (existingGoal) {
              throw new Error(
                "Weight goal already exists for this user. Use PUT to update."
              );
            }

            // Destructure payload - includes startingWeight from body
            const {
              startingWeight, // Use startingWeight from the request body
              targetWeight,
              weightGoal,
              startDate,
              targetDate,
              calorieTarget,
              calculatedWeeks,
              weeklyChange,
              dailyChange,
            } = body;

            console.log(
              `[POST /goals/weight - CREATE] Using starting weight from request body: ${startingWeight} for user ${user.userId}`
            );

            const insertQuery = `
              INSERT INTO weight_goals (
                  user_id, starting_weight, target_weight, weight_goal, start_date, target_date,
                  calorie_target, calculated_weeks, weekly_change, daily_change, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
              RETURNING *;
            `;
            const savedGoalResult = db.prepare(insertQuery).get(
              user.userId,
              startingWeight, // Use starting weight from body
              targetWeight,
              weightGoal,
              startDate,
              targetDate,
              calorieTarget,
              calculatedWeeks,
              weeklyChange,
              dailyChange
            ) as WeightGoalFromDB | undefined;

            if (!savedGoalResult) {
              // This case should ideally be caught by DB constraints or earlier checks
              throw new Error("Failed to create weight goals.");
            }

            return savedGoalResult;
          });

          try {
            const savedGoal = transaction();
            set.status = 201; // 201 Created
            // Map response
            return {
              startingWeight: savedGoal.starting_weight,
              targetWeight: savedGoal.target_weight,
              weightGoal: savedGoal.weight_goal,
              startDate: savedGoal.start_date,
              targetDate: savedGoal.target_date,
              calorieTarget: savedGoal.calorie_target,
              calculatedWeeks: savedGoal.calculated_weeks,
              weeklyChange: savedGoal.weekly_change,
              dailyChange: savedGoal.daily_change,
            };
          } catch (error: any) {
            // Check error message or type for conflict
            if (error.message?.includes("already exists")) {
              set.status = 409; // Conflict
              return { code: "CONFLICT", message: error.message };
            }
            console.error("[POST /goals/weight] TRANSACTION ERROR:", error);
            set.status = 500;
            return {
              code: "INTERNAL_SERVER_ERROR",
              message: error.message || "Failed to create weight goals",
            };
          }
        },
        {
          body: GoalSchemas.createWeightGoalBody, // Use create schema
          response: {
            // Define possible responses
            201: GoalSchemas.weightGoalResponse, // Success create
            409: t.Object({ code: t.String(), message: t.String() }), // Conflict
            500: t.Object({ code: t.String(), message: t.String() }), // Server error
          },
          detail: {
            summary:
              "Create a new weight goal for the user. Requires 'startingWeight' in the body.",
            tags: ["Goals"],
          },
        }
      )

      // --- UPDATE Weight Goals ---
      .put(
        "/weight",
        ({
          user,
          body,
          set,
          db,
        }: AuthenticatedContext & {
          body: typeof GoalSchemas.updateWeightGoalBody.static;
        }) => {
          const transaction = db.transaction(() => {
            // Destructure payload (NO startingWeight here)
            const {
              targetWeight,
              weightGoal,
              startDate,
              targetDate,
              calorieTarget,
              calculatedWeeks,
              weeklyChange,
              dailyChange,
            } = body;

            // Check if a goal exists to update
            const existingGoalQuery =
              "SELECT id, starting_weight FROM weight_goals WHERE user_id = ?";
            const existingGoal = db
              .prepare(existingGoalQuery)
              .get(user.userId) as
              | { id: number; starting_weight: number | null }
              | undefined;

            // Use a standard Error for not found if NotFoundError is not available
            if (!existingGoal) {
              throw new Error(
                "Weight goal not found for this user. Use POST to create."
              );
            }

            const effectiveStartingWeight = existingGoal.starting_weight; // Keep existing starting weight
            console.log(
              `[PUT /goals/weight - UPDATE] Updating goal for user ${user.userId}. Starting weight remains ${effectiveStartingWeight}`
            );

            // IMPORTANT: Do NOT update starting_weight
            const updateQuery = `
              UPDATE weight_goals SET
                  target_weight = ?, weight_goal = ?, start_date = ?, target_date = ?,
                  calorie_target = ?, calculated_weeks = ?, weekly_change = ?, daily_change = ?,
                  updated_at = CURRENT_TIMESTAMP
              WHERE user_id = ?
              RETURNING *;
            `;
            const savedGoalResult = db.prepare(updateQuery).get(
              targetWeight,
              weightGoal,
              startDate,
              targetDate,
              calorieTarget,
              calculatedWeeks,
              weeklyChange,
              dailyChange,
              user.userId // WHERE clause parameter
            ) as WeightGoalFromDB | undefined;

            if (!savedGoalResult) {
              // Should be caught by the NotFoundError check earlier, but good practice
              throw new Error(
                "Failed to update weight goals or retrieve result."
              );
            }

            // Ensure the response reflects the *unchanged* starting weight
            savedGoalResult.starting_weight = effectiveStartingWeight;

            return savedGoalResult;
          });

          try {
            const savedGoal = transaction();
            set.status = 200; // 200 OK for update
            // Map response
            return {
              startingWeight: savedGoal.starting_weight, // Return the actual starting_weight kept
              targetWeight: savedGoal.target_weight,
              weightGoal: savedGoal.weight_goal,
              startDate: savedGoal.start_date,
              targetDate: savedGoal.target_date,
              calorieTarget: savedGoal.calorie_target,
              calculatedWeeks: savedGoal.calculated_weeks,
              weeklyChange: savedGoal.weekly_change,
              dailyChange: savedGoal.daily_change,
            };
          } catch (error: any) {
            // Check error message or type for not found
            if (error.message?.includes("not found")) {
              set.status = 404; // Not Found
              return { code: "NOT_FOUND", message: error.message };
            }
            console.error("[PUT /goals/weight] TRANSACTION ERROR:", error);
            set.status = 500;
            return {
              code: "INTERNAL_SERVER_ERROR",
              message: error.message || "Failed to update weight goals",
            };
          }
        },
        {
          body: GoalSchemas.updateWeightGoalBody, // Use update schema
          response: {
            // Define possible responses
            200: GoalSchemas.weightGoalResponse, // Success update
            404: t.Object({ code: t.String(), message: t.String() }), // Not Found
            500: t.Object({ code: t.String(), message: t.String() }), // Server error
          },
          detail: {
            summary:
              "Update the user's existing weight goal. Does not change starting weight.",
            tags: ["Goals"],
          },
        }
      )

      // --- Reset Goals (DELETE /weight) ---
      .delete(
        "/weight",
        // Destructure context directly
        ({ user, set, db }: AuthenticatedContext) => {
          try {
            db.transaction(() => {
              db.prepare("DELETE FROM weight_goals WHERE user_id = ?").run(
                user.userId
              );
            })();
            set.status = 200;
            return { success: true };
          } catch (error) {
            console.error("[POST /goals/reset] CAUGHT ERROR:", error); // LOGGING
            set.status = 500;
            throw new Error("Failed to reset goals");
          }
        },
        {
          response: GoalSchemas.resetResponse,
          detail: {
            summary: "Reset all goals (weight & macro) for the user",
            tags: ["Goals"],
          },
        }
      )

      // --- Get Weight Log History ---
      .get(
        "/weight-log",
        // Destructure context directly
        ({ user, set, db }: AuthenticatedContext) => {
          try {
            // Use 'timestamp' instead of 'date'
            const query =
              "SELECT id, timestamp, weight FROM weight_log WHERE user_id = ? ORDER BY timestamp DESC";
            // Type assertion needed as .all() returns any[] by default
            const logs = db.prepare(query).all(user.userId) as Omit<
              WeightLogFromDB,
              "user_id" | "created_at" // Adjust Omit if needed based on DB type
            >;

            // Schema expects an array, even if empty. `all` returns an empty array if no rows match.
            return logs;
          } catch (error) {
            console.error("[GET /goals/weight-log] CAUGHT ERROR:", error);
            set.status = 500;
            throw new Error("Failed to fetch weight log history");
          }
        },
        {
          response: GoalSchemas.getWeightLogResponse, // Use the new schema
          detail: {
            summary: "Get the user's weight log history",
            tags: ["Goals", "Weight Log"],
          },
        }
      )

      // --- Add Weight Log Entry ---
      .post(
        "/weight-log",
        ({
          user,
          body,
          set,
          db,
        }: AuthenticatedContext & {
          body: typeof GoalSchemas.addWeightLogBody.static; // Schema needs update
        }) => {
          // Use a transaction
          const transaction = db.transaction(() => {
            // Use 'timestamp' from body
            const { timestamp, weight } = body;
            const newId = generateId(); // Generate a unique ID

            // Use 'timestamp' in INSERT query
            const insertWeightLogQuery = `
              INSERT INTO weight_log (id, user_id, timestamp, weight)
              VALUES (?, ?, ?, ?);
            `;
            db.prepare(insertWeightLogQuery).run(
              newId,
              user.userId,
              timestamp, // Use timestamp
              weight
            );
            console.log(
              `[POST /goals/weight-log] INSERTED new weight log for user ${user.userId} at ${timestamp} with weight ${weight}`
            );

            // We still need the ID we just inserted
            const finalId = newId;

            // 2. Update user_details.weight to this new weight
            const updateUserDetailQuery = `
              UPDATE user_details SET weight = ?, updated_at = CURRENT_TIMESTAMP
              WHERE user_id = ?
            `;
            db.prepare(updateUserDetailQuery).run(weight, user.userId);

            // Construct the response object matching the schema
            return {
              id: finalId,
              userId: user.userId.toString(), // Ensure userId is string as per schema
              timestamp: timestamp, // Use timestamp
              weight: weight,
            };
          });

          try {
            const responseEntry = transaction(); // Execute transaction
            set.status = 201; // Created (or 200 OK if updated)
            return responseEntry;
          } catch (error: any) {
            console.error("[POST /goals/weight-log] TRANSACTION ERROR:", error);
            set.status = 500;
            throw new Error(error.message || "Failed to add weight log entry");
          }
        },
        {
          body: GoalSchemas.addWeightLogBody, // Schema needs update
          response: GoalSchemas.addWeightLogResponse, // Schema needs update
          detail: {
            summary: "Add/Update a weight log entry and update user details",
            tags: ["Goals", "Weight Log"],
          },
        }
      )

      // --- Delete Weight Log Entry ---
      .delete(
        "/weight-log/:id",
        ({
          user,
          params,
          set,
          db,
        }: AuthenticatedContext & {
          params: typeof GoalSchemas.deleteWeightLogParams.static;
        }) => {
          const transaction = db.transaction(() => {
            const entryIdToDelete = params.id;

            // 1. Verify the entry exists and belongs to the user
            const findEntryQuery = `
              SELECT id FROM weight_log WHERE id = ? AND user_id = ?
            `;
            const deletedEntry = db
              .prepare(findEntryQuery)
              .get(entryIdToDelete, user.userId) as { id: string } | undefined;

            if (!deletedEntry) {
              set.status = 404; // Use set.status inside transaction
              throw new Error("Weight log entry not found or access denied.");
            }

            // 2. Delete the specific weight log entry
            const deleteQuery = "DELETE FROM weight_log WHERE id = ?";
            const deleteResult = db.prepare(deleteQuery).run(entryIdToDelete);
            console.log(
              `[DELETE /goals/weight-log/:id] Deleted entry ${entryIdToDelete} for user ${user.userId}. Changes: ${deleteResult.changes}`
            );

            if (deleteResult.changes === 0) {
              // Should not happen if findEntryQuery succeeded, but good practice
              set.status = 404;
              throw new Error(
                "Failed to delete entry, might have been deleted already."
              );
            }

            // 3. Find the NEW latest weight log entry AFTER deletion
            const findLatestQuery = `
              SELECT weight, timestamp FROM weight_log
              WHERE user_id = ?
              ORDER BY timestamp DESC, id DESC
              LIMIT 1
            `;
            const latestEntry = db.prepare(findLatestQuery).get(user.userId) as
              | { weight: number; timestamp: string }
              | null // Explicitly type as potentially null
              | undefined;
            console.log(
              `[DELETE /goals/weight-log/:id] Found latest remaining entry:`,
              latestEntry
            );

            // 4. Update user_details.weight ONLY IF other entries remain
            // Change the check to handle null correctly
            if (latestEntry) {
              // This checks for both null and undefined
              // An entry still exists, update user_details with its weight
              const newLatestWeight = latestEntry.weight;
              const updateUserDetailQuery = `
                UPDATE user_details SET weight = ?, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = ?
              `;
              db.prepare(updateUserDetailQuery).run(
                newLatestWeight,
                user.userId
              );
              console.log(
                `[DELETE /goals/weight-log/:id] Updated user_details.weight to ${newLatestWeight} for user ${user.userId}`
              );
            } else {
              // No entries remain (latestEntry is null or undefined).
              // DO NOT update user_details.weight.
              console.log(
                `[DELETE /goals/weight-log/:id] No remaining entries for user ${user.userId}. user_details.weight NOT updated.`
              );
            }

            // Return success with the ID of the deleted item
            return { success: true, id: deletedEntry.id }; // Ensure deletedEntry is defined from step 1
          });

          try {
            const result = transaction();
            set.status = 200;
            return result;
          } catch (error: any) {
            console.error(
              `[DELETE /goals/weight-log/:id] Transaction error for user ${user.userId}, entry ${params.id}:`,
              error
            );
            // Use status set within transaction if available (e.g., 404)
            if (set.status && set.status !== 200) {
              return {
                code: set.status === 404 ? "NOT_FOUND" : "TRANSACTION_ERROR",
                message: error.message,
              };
            } else {
              // Default to 500 if no specific status was set
              set.status = 500;
              return {
                code: "INTERNAL_SERVER_ERROR",
                message: error.message || "Failed to delete weight log entry",
              };
            }
          }
        },
        {
          params: GoalSchemas.deleteWeightLogParams, // Validate URL parameter
          response: {
            200: GoalSchemas.deleteWeightLogResponse, // Use the specific success response schema
            404: t.Object({ code: t.String(), message: t.String() }),
            500: t.Object({ code: t.String(), message: t.String() }),
          },
          detail: {
            summary:
              "Delete a specific weight log entry and update user details",
            tags: ["Goals", "Weight Log"],
          },
        }
      )
  );
