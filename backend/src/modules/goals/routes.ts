// src/modules/goals/routes.ts
import { Elysia, NotFoundError, t } from "elysia"; // Import NotFoundError and t
import { db } from "@/db";
// Import the simplified schemas
import { GoalSchemas } from "./schemas";
import type { AuthenticatedContext } from "@/middleware/auth";
import { generateId } from "@/utils/id-generator"; // Import ID generator

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
      // --- Removed problematic .derive call ---
      // The authMiddleware ensures 'user' is present in handlers.
      // Handler signatures will destructure the correct context provided by Elysia.

      // --- Get Weight Goals ---
      .get(
        "/weight",
        // Destructure context directly in the parameter list
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
          // Apply response schema (uses camelCase)
          response: GoalSchemas.getWeightGoalResponse, // Added schema
          detail: {
            summary: "Get the user's weight goals",
            tags: ["Goals"],
          },
        }
      )

      // --- Save/Update Weight Goals (UPSERT) ---
      .put(
        "/weight",
        ({
          user,
          body,
          set,
          db,
        }: AuthenticatedContext & {
          /* ... */
        }) => {
          const transaction = db.transaction(() => {
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

            // Check if a goal already exists for this user
            const existingGoalQuery =
              "SELECT id FROM weight_goals WHERE user_id = ?";
            const existingGoal = db
              .prepare(existingGoalQuery)
              .get(user.userId) as { id: number } | undefined;
            const isCreating = !existingGoal;

            let savedGoalResult: WeightGoalFromDB | undefined;

            if (isCreating) {
              // --- CREATION LOGIC ---
              const insertQuery = `
                INSERT INTO weight_goals (
                    user_id, starting_weight, target_weight, weight_goal, start_date, target_date,
                    calorie_target, calculated_weeks, weekly_change, daily_change, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                RETURNING *;
              `;
              savedGoalResult = db.prepare(insertQuery).get(
                user.userId,
                startingWeight, // Use startingWeight from body
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
                throw new Error("Failed to create weight goals.");
              }

              // Update user_details.weight ONLY on creation with startingWeight
              // DO NOT update weight_log here anymore
              if (startingWeight !== null && startingWeight !== undefined) {
                const updateUserDetailQuery = `
                  UPDATE user_details SET weight = ?, updated_at = CURRENT_TIMESTAMP
                  WHERE user_id = ?
                `;
                db.prepare(updateUserDetailQuery).run(
                  startingWeight,
                  user.userId
                );
                console.log(
                  `[PUT /goals/weight - CREATE] Updated user_details weight for user ${user.userId} to ${startingWeight}`
                );
              }
            } else {
              // --- UPDATE LOGIC ---
              // IMPORTANT: Do NOT update starting_weight here
              const updateQuery = `
                UPDATE weight_goals SET
                    target_weight = ?, weight_goal = ?, start_date = ?, target_date = ?,
                    calorie_target = ?, calculated_weeks = ?, weekly_change = ?, daily_change = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE user_id = ?
                RETURNING *;
              `;
              savedGoalResult = db.prepare(updateQuery).get(
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
                // This might happen if the user_id somehow doesn't exist, though unlikely
                // due to the initial check. Or if the RETURNING clause fails.
                throw new Error(
                  "Failed to update weight goals or retrieve result."
                );
              }
              // NOTE: We do NOT update user_details.weight or weight_log during a goal *update*
              // based on startingWeight, as startingWeight is immutable after creation.
            }

            return savedGoalResult; // Return the created/updated goal
          });

          try {
            const savedGoal = transaction(); // Execute the transaction

            set.status = 200;
            return {
              startingWeight: savedGoal.starting_weight, // Return the actual starting_weight from DB
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
            console.error("[PUT /goals/weight] TRANSACTION ERROR:", error); // LOGGING
            set.status = 500;
            throw new Error(error.message || "Failed to save weight goals");
          }
        },
        {
          body: GoalSchemas.updateWeightGoalBody,
          response: GoalSchemas.updateWeightGoalResponse,
          detail: {
            summary:
              "Save (create) or update the user's weight goals. Starting weight is set only on creation.",
            tags: ["Goals"],
          },
        }
      )

      // --- Reset Goals ---
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
          // Use a transaction
          const transaction = db.transaction(() => {
            const { id } = params;

            // 1. Delete the specified entry
            const deleteQuery =
              "DELETE FROM weight_log WHERE id = ? AND user_id = ?";
            const deleteResult = db.prepare(deleteQuery).run(id, user.userId);

            if (deleteResult.changes === 0) {
              // No row was deleted, either ID doesn't exist or doesn't belong to user
              throw new NotFoundError(
                "Weight log entry not found or access denied."
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
            const result = transaction(); // Execute transaction
            set.status = 200; // OK
            return result;
          } catch (error) {
            // Handle specific NotFoundError thrown above
            if (error instanceof NotFoundError) {
              set.status = 404;
              return { code: "NOT_FOUND", message: error.message };
            }
            // Handle other potential errors
            console.error(
              "[DELETE /goals/weight-log/:id] TRANSACTION ERROR:",
              error
            );
            set.status = 500;
            return {
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to delete weight log entry",
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
