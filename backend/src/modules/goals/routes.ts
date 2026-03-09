// src/modules/goals/routes.ts
import type { Database } from "bun:sqlite";
import { Elysia, t } from "elysia";
import { db } from "../../db";
import { GoalSchemas } from "./schemas";
import type { AuthenticatedRouteContext } from "../../types";
import {
  safeQuery,
  safeExecute,
  safeQueryAll,
  withTransaction,
  type WeightGoalRow,
  type WeightLogRow,
} from "../../lib/database";
import { NotFoundError } from "../../lib/errors";
import { generateId } from "../../utils/id-generator";
import { loggerHelpers } from "../../lib/logger";

type GoalsRouteContext = AuthenticatedRouteContext<Record<string, unknown>>;

/**
 * Helper function to get the current weight from the latest weight log entry
 * Falls back to starting weight if no weight log entries exist
 */
function getCurrentWeight(
  db: Database,
  userId: number,
  startingWeight: number | null
): number | null {
  const latestLogEntry = safeQuery<{ weight: number }>(
    db,
    "SELECT weight FROM weight_log WHERE user_id = ? ORDER BY timestamp DESC LIMIT 1",
    [userId]
  );

  if (latestLogEntry) {
    return latestLogEntry.weight;
  }

  // Fallback to starting weight if no log entries
  return startingWeight;
}

export const goalRoutes = (app: Elysia) =>
  app.group("/api/goals", (group) =>
    group
      .decorate("db", db)
      // --- Get Weight Goals ---
      .get(
        "/weight",
        async (context: any) => {
          const { internalUserId, db, request } = context as GoalsRouteContext;

          // Get correlation ID from request headers if available
          const correlationId = request.headers.get("x-correlation-id") || undefined;

          loggerHelpers.apiRequest("GET", "/goals/weight", internalUserId ?? undefined, {
            correlationId,
          });

          const weightGoalsResult = safeQuery<WeightGoalRow>(
            db,
            "SELECT id, user_id, starting_weight, target_weight, weight_goal, start_date, target_date, calorie_target, calculated_weeks, weekly_change, daily_change, created_at, updated_at FROM weight_goals WHERE user_id = ?",
            [internalUserId]
          );

          if (!weightGoalsResult) {
            loggerHelpers.dbQuery("SELECT", "weight_goals", internalUserId ?? undefined, 0);
            return null; // Return null if not found (matches schema)
          }

          // Get current weight from weight log (or fallback to starting weight)
          const currentWeight = getCurrentWeight(
            db,
            internalUserId!,
            weightGoalsResult.starting_weight
          );

          // Map snake_case from DB to camelCase for API response
          const apiResponse = {
            startingWeight: weightGoalsResult.starting_weight,
            currentWeight: currentWeight,
            targetWeight: weightGoalsResult.target_weight,
            weightGoal: weightGoalsResult.weight_goal,
            startDate: weightGoalsResult.start_date,
            targetDate: weightGoalsResult.target_date,
            calorieTarget: weightGoalsResult.calorie_target,
            calculatedWeeks: weightGoalsResult.calculated_weeks,
            weeklyChange: weightGoalsResult.weekly_change,
            dailyChange: weightGoalsResult.daily_change,
          };

          loggerHelpers.dbQuery("SELECT", "weight_goals", internalUserId ?? undefined, 1);
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
          const { internalUserId, body, db, request } = context as GoalsRouteContext;

          if (!body) {
            throw new Error("Request body is required");
          }

          context.set.status = 201;

          const savedGoal = withTransaction(db, () => {
            // Check if a goal already exists
            const existingGoal = safeQuery<{ id: number }>(
              db,
              "SELECT id FROM weight_goals WHERE user_id = ?",
              [internalUserId]
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
            } = body as {
              startingWeight: number;
              targetWeight: number;
              weightGoal: "lose" | "maintain" | "gain";
              startDate: string;
              targetDate: string;
              calorieTarget: number;
              calculatedWeeks: number;
              weeklyChange: number;
              dailyChange: number;
            };

            // Get correlation ID from request headers if available
            const correlationId = request.headers.get("x-correlation-id") || undefined;

            loggerHelpers.apiRequest("POST", "/goals/weight", internalUserId ?? undefined, {
              correlationId,
            });

            const savedGoalResult = safeQuery<WeightGoalRow>(
              db,
              `INSERT INTO weight_goals (
                  user_id, starting_weight, target_weight, weight_goal, start_date, target_date,
                  calorie_target, calculated_weeks, weekly_change, daily_change, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
              RETURNING *`,
              [
                internalUserId,
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

          // Get current weight from weight log (or fallback to starting weight)
          const currentWeight = getCurrentWeight(
            db,
            internalUserId!,
            savedGoal.starting_weight
          );

          // Map response
          return {
            startingWeight: savedGoal.starting_weight,
            currentWeight: currentWeight,
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
          const { internalUserId, body, db, request } = context as GoalsRouteContext;

          if (!body) {
            throw new Error("Request body is required");
          }

          const savedGoal = withTransaction(db, () => {
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
            } = body as {
              targetWeight: number;
              weightGoal: "lose" | "maintain" | "gain";
              startDate: string;
              targetDate: string;
              calorieTarget: number;
              calculatedWeeks: number;
              weeklyChange: number;
              dailyChange: number;
            };

            // Check if a goal exists to update
            const existingGoal = safeQuery<{
              id: number;
              starting_weight: number | null;
            }>(
              db,
              "SELECT id, starting_weight FROM weight_goals WHERE user_id = ?",
              [internalUserId]
            );

            if (!existingGoal) {
              throw new NotFoundError(
                "Weight goal not found for this user. Use POST to create."
              );
            }

            const effectiveStartingWeight = existingGoal.starting_weight;

            // Get correlation ID from request headers if available
            const correlationId = request.headers.get("x-correlation-id") || undefined;

            loggerHelpers.apiRequest("PUT", "/goals/weight", internalUserId ?? undefined, {
              correlationId,
            });

            // IMPORTANT: Do NOT update starting_weight
            const savedGoalResult = safeQuery<WeightGoalRow>(
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
                internalUserId,
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

          // Get current weight from weight log (or fallback to starting weight)
          const currentWeight = getCurrentWeight(
            db,
            internalUserId!,
            savedGoal.starting_weight
          );

          // Map response
          return {
            startingWeight: savedGoal.starting_weight,
            currentWeight: currentWeight,
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
          const { internalUserId, db } = context as GoalsRouteContext;

          withTransaction(db, () => {
            safeExecute(db, "DELETE FROM weight_goals WHERE user_id = ?", [
              internalUserId,
            ]);
          });

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
          const { internalUserId, db } = context as GoalsRouteContext;

          const query =
            "SELECT id, timestamp, weight FROM weight_log WHERE user_id = ? ORDER BY timestamp DESC";

          const logs = safeQueryAll<Pick<WeightLogRow, "id" | "timestamp" | "weight">>(
            db,
            query,
            [internalUserId]
          );

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
          const { internalUserId, body, db } = context as GoalsRouteContext;

          if (!body) {
            throw new Error("Request body is required");
          }

          const { timestamp, weight } = body as {
            timestamp: string;
            weight: number;
          };
          const newId = generateId();

          return withTransaction(db, () => {
            const insertWeightLogQuery = `
              INSERT INTO weight_log (id, user_id, timestamp, weight)
              VALUES (?, ?, ?, ?);
            `;
            safeExecute(db, insertWeightLogQuery, [
              newId,
              internalUserId,
              timestamp,
              weight,
            ]);

            const updateUserDetailQuery = `
              UPDATE user_details SET weight = ?, updated_at = CURRENT_TIMESTAMP
              WHERE user_id = ?
            `;
            safeExecute(db, updateUserDetailQuery, [weight, internalUserId]);

            return {
              id: newId,
              userId: String(internalUserId),
              timestamp: timestamp,
              weight: weight,
            };
          });
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
          const { internalUserId, params, db } = context as GoalsRouteContext;

          const entryIdToDelete = params?.id;
          if (!entryIdToDelete) {
            throw new NotFoundError("Weight log entry ID is required");
          }

          return withTransaction(db, () => {
            const findEntryQuery = `
              SELECT id FROM weight_log WHERE id = ? AND user_id = ?
            `;
            const deletedEntryResult = safeQueryAll<{ id: string }>(
              db,
              findEntryQuery,
              [entryIdToDelete, internalUserId]
            );
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
            const latestEntryResult = safeQueryAll<{ weight: number; timestamp: string }>(
              db,
              findLatestQuery,
              [internalUserId]
            );
            const latestEntry = latestEntryResult[0];

            if (latestEntry) {
              const updateUserDetailQuery = `
                UPDATE user_details SET weight = ?, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = ?
              `;
              safeExecute(db, updateUserDetailQuery, [
                latestEntry.weight,
                internalUserId,
              ]);
            }

            return { success: true, id: deletedEntry.id };
          });
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
