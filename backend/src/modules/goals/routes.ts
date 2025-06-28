// src/modules/goals/routes.ts
import { Elysia, t } from "elysia";
import { db } from "../../db";
import { GoalSchemas } from "./schemas";
import type { AuthenticatedContext } from "../../middleware/auth";
import { safeQuery, safeExecute } from "../../lib/database";
import { NotFoundError } from "../../lib/errors";
import { generateId } from "../../utils/id-generator";

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
        async (context: any) => {
          const { user, db } = context as AuthenticatedContext;

          console.log(
            `[GET /goals/weight] Handler started for user ${user.userId}`
          );

          const weightGoalsResult = safeQuery<WeightGoalFromDB>(
            db,
            "SELECT id, user_id, starting_weight, target_weight, weight_goal, start_date, target_date, calorie_target, calculated_weeks, weekly_change, daily_change, created_at, updated_at FROM weight_goals WHERE user_id = ?",
            [user.userId]
          );

          if (!weightGoalsResult) {
            console.log(
              "[GET /goals/weight] No weight goals found, returning null."
            );
            return null; // Return null if not found (matches schema)
          }

          console.log("[GET /goals/weight] Mapping result to camelCase...");
          // Map snake_case from DB to camelCase for API response
          const apiResponse = {
            startingWeight: weightGoalsResult.starting_weight,
            targetWeight: weightGoalsResult.target_weight,
            weightGoal: weightGoalsResult.weight_goal,
            startDate: weightGoalsResult.start_date,
            targetDate: weightGoalsResult.target_date,
            calorieTarget: weightGoalsResult.calorie_target,
            calculatedWeeks: weightGoalsResult.calculated_weeks,
            weeklyChange: weightGoalsResult.weekly_change,
            dailyChange: weightGoalsResult.daily_change,
          };

          console.log(
            "[GET /goals/weight] Returning mapped response:",
            apiResponse
          );
          return apiResponse;
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
        async (context: any) => {
          const { user, body, db } = context as AuthenticatedContext & {
            body: typeof GoalSchemas.createWeightGoalBody.static;
          };

          const transaction = db.transaction(() => {
            // Check if a goal already exists
            const existingGoal = safeQuery<{ id: number }>(
              db,
              "SELECT id FROM weight_goals WHERE user_id = ?",
              [user.userId]
            );

            if (existingGoal) {
              throw new Error(
                "Weight goal already exists for this user. Use PUT to update."
              );
            }

            // Destructure payload - includes startingWeight from body
            const {
              startingWeight,
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

            const savedGoalResult = safeQuery<WeightGoalFromDB>(
              db,
              `INSERT INTO weight_goals (
                  user_id, starting_weight, target_weight, weight_goal, start_date, target_date,
                  calorie_target, calculated_weeks, weekly_change, daily_change, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
              RETURNING *`,
              [
                user.userId,
                startingWeight,
                targetWeight,
                weightGoal,
                startDate,
                targetDate,
                calorieTarget,
                calculatedWeeks,
                weeklyChange,
                dailyChange,
              ]
            );

            if (!savedGoalResult) {
              throw new Error("Failed to create weight goals.");
            }

            return savedGoalResult;
          });

          const savedGoal = transaction();

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
        async (context: any) => {
          const { user, body, db } = context as AuthenticatedContext & {
            body: typeof GoalSchemas.updateWeightGoalBody.static;
          };

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
            const existingGoal = safeQuery<{
              id: number;
              starting_weight: number | null;
            }>(
              db,
              "SELECT id, starting_weight FROM weight_goals WHERE user_id = ?",
              [user.userId]
            );

            if (!existingGoal) {
              throw new NotFoundError(
                "Weight goal not found for this user. Use POST to create."
              );
            }

            const effectiveStartingWeight = existingGoal.starting_weight;
            console.log(
              `[PUT /goals/weight - UPDATE] Updating goal for user ${user.userId}. Starting weight remains ${effectiveStartingWeight}`
            );

            // IMPORTANT: Do NOT update starting_weight
            const savedGoalResult = safeQuery<WeightGoalFromDB>(
              db,
              `UPDATE weight_goals SET
                  target_weight = ?, weight_goal = ?, start_date = ?, target_date = ?,
                  calorie_target = ?, calculated_weeks = ?, weekly_change = ?, daily_change = ?,
                  updated_at = CURRENT_TIMESTAMP
              WHERE user_id = ?
              RETURNING *`,
              [
                targetWeight,
                weightGoal,
                startDate,
                targetDate,
                calorieTarget,
                calculatedWeeks,
                weeklyChange,
                dailyChange,
                user.userId,
              ]
            );

            if (!savedGoalResult) {
              throw new Error(
                "Failed to update weight goals or retrieve result."
              );
            }

            // Ensure the response reflects the *unchanged* starting weight
            savedGoalResult.starting_weight = effectiveStartingWeight;

            return savedGoalResult;
          });

          const savedGoal = transaction();

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
        async (context: any) => {
          const { user, db } = context as AuthenticatedContext;

          const transaction = db.transaction(() => {
            safeExecute(db, "DELETE FROM weight_goals WHERE user_id = ?", [
              user.userId,
            ]);
          });

          transaction();
          return { success: true };
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
        async (context: any) => {
          const { user, db } = context as AuthenticatedContext;

          const query =
            "SELECT id, timestamp, weight FROM weight_log WHERE user_id = ? ORDER BY timestamp DESC";

          const logs = safeQuery(db, query, [user.userId]) as Omit<
            WeightLogFromDB,
            "user_id" | "created_at"
          >[];

          return logs;
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
        async (context: any) => {
          const { user, body, db } = context as AuthenticatedContext & {
            body: typeof GoalSchemas.addWeightLogBody.static;
          };

          const { timestamp, weight } = body;
          const newId = generateId();

          const transaction = db.transaction(() => {
            const insertWeightLogQuery = `
              INSERT INTO weight_log (id, user_id, timestamp, weight)
              VALUES (?, ?, ?, ?);
            `;
            safeExecute(db, insertWeightLogQuery, [
              newId,
              user.userId,
              timestamp,
              weight,
            ]);

            const updateUserDetailQuery = `
              UPDATE user_details SET weight = ?, updated_at = CURRENT_TIMESTAMP
              WHERE user_id = ?
            `;
            safeExecute(db, updateUserDetailQuery, [weight, user.userId]);

            return {
              id: newId,
              userId: user.userId.toString(),
              timestamp: timestamp,
              weight: weight,
            };
          });

          return transaction();
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
        async (context: any) => {
          const { user, params, db } = context as AuthenticatedContext & {
            params: typeof GoalSchemas.deleteWeightLogParams.static;
          };

          const entryIdToDelete = params.id;

          const transaction = db.transaction(() => {
            const findEntryQuery = `
              SELECT id FROM weight_log WHERE id = ? AND user_id = ?
            `;
            const deletedEntryResult = safeQuery(db, findEntryQuery, [
              entryIdToDelete,
              user.userId,
            ]) as { id: string }[];
            const deletedEntry = deletedEntryResult[0];

            if (!deletedEntry) {
              throw new NotFoundError(
                "Weight log entry not found or access denied."
              );
            }

            const deleteQuery = "DELETE FROM weight_log WHERE id = ?";
            const deleteResult = safeExecute(db, deleteQuery, [
              entryIdToDelete,
            ]);

            if (deleteResult.changes === 0) {
              throw new NotFoundError(
                "Failed to delete entry, might have been deleted already."
              );
            }

            const findLatestQuery = `
              SELECT weight, timestamp FROM weight_log
              WHERE user_id = ?
              ORDER BY timestamp DESC, id DESC
              LIMIT 1
            `;
            const latestEntryResult = safeQuery(db, findLatestQuery, [
              user.userId,
            ]) as { weight: number; timestamp: string }[];
            const latestEntry = latestEntryResult[0];

            if (latestEntry) {
              const updateUserDetailQuery = `
                UPDATE user_details SET weight = ?, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = ?
              `;
              safeExecute(db, updateUserDetailQuery, [
                latestEntry.weight,
                user.userId,
              ]);
            }

            return { success: true, id: deletedEntry.id };
          });

          return transaction();
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
