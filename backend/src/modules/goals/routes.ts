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
  user_id: string;
  date: string; // YYYY-MM-DD
  weight: number;
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
            const query =
              "SELECT id, date, weight FROM weight_log WHERE user_id = ? ORDER BY date DESC";
            // Type assertion needed as .all() returns any[] by default
            const logs = db.prepare(query).all(user.userId) as Omit<
              WeightLogFromDB,
              "user_id" | "created_at" // Adjust Omit if needed based on DB type
            >[];

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
          /* ... */
        }) => {
          // Use a transaction
          const transaction = db.transaction(() => {
            const { date, weight } = body;
            const newId = generateId(); // Generate a unique ID

            // 1. Always INSERT a new weight_log entry
            // Use simple INSERT now, no ON CONFLICT
            const insertWeightLogQuery = `
              INSERT INTO weight_log (id, user_id, date, weight)
              VALUES (?, ?, ?, ?);
            `;
            db.prepare(insertWeightLogQuery).run(
              newId,
              user.userId,
              date,
              weight
            );
            console.log(
              `[POST /goals/weight-log] INSERTED new weight log for user ${user.userId} on ${date} with weight ${weight}`
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
              date: date,
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
          body: GoalSchemas.addWeightLogBody, // Validate request body
          response: GoalSchemas.addWeightLogResponse, // Format response
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
        }: AuthenticatedContext & { params: { id: string } }) => {
          const transaction = db.transaction(() => {
            const { id } = params;

            // 1. Delete the specified entry
            const deleteQuery =
              "DELETE FROM weight_log WHERE id = ? AND user_id = ?";
            const deleteResult = db.prepare(deleteQuery).run(id, user.userId);

            if (deleteResult.changes === 0) {
              // No row was deleted, either ID doesn't exist or doesn't belong to user
              // Use standard Error if NotFoundError is unavailable
              throw new Error(
                "Weight log entry not found or not owned by user."
              );
            }

            // 2. Find the new latest weight log entry for the user
            // Order by date DESC, then created_at DESC to get the true latest
            const findLatestQuery = `
              SELECT weight FROM weight_log
              WHERE user_id = ?
              ORDER BY date DESC, created_at DESC
              LIMIT 1
            `;
            const latestEntry = db.prepare(findLatestQuery).get(user.userId) as
              | { weight: number }
              | undefined;

            // 3. Update user_details.weight
            const newWeight = latestEntry?.weight ?? null; // Set to null if no entries remain
            const updateUserDetailQuery = `
              UPDATE user_details SET weight = ?, updated_at = CURRENT_TIMESTAMP
              WHERE user_id = ?
            `;
            db.prepare(updateUserDetailQuery).run(newWeight, user.userId);
            console.log(
              `[DELETE /goals/weight-log/:id] Updated user_details weight for user ${user.userId} to ${newWeight}`
            );

            return { success: true }; // Indicate successful deletion and update
          });

          try {
            transaction(); // Execute transaction
            set.status = 200; // OK
            return { success: true };
          } catch (error: any) {
            // Check error message or type for not found
            if (error.message?.includes("not found")) {
              set.status = 404;
              return { code: "NOT_FOUND", message: error.message };
            }
            console.error(
              "[DELETE /goals/weight-log/:id] TRANSACTION ERROR:",
              error
            );
            set.status = 500;
            return {
              code: "INTERNAL_SERVER_ERROR",
              message: error.message || "Failed to delete weight log entry",
            };
          }
        },
        {
          // Define possible responses using t
          response: {
            200: t.Object({ success: t.Boolean() }),
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
