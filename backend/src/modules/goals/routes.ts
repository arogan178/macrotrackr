// src/modules/goals/routes.ts
import { Elysia } from "elysia";
import { db } from "../../db";
// Import the simplified schemas
import { GoalSchemas } from "./schemas";
import type { AuthenticatedContext } from "../../middleware/auth";
// Import the specific type for percentages if needed
import type { MacroTargetPercentages } from "../macros/schemas";

// Define types for DB results (snake_case) for clarity and type safety
// These should match the columns defined in src/db/schema.ts
type WeightGoalFromDB = {
  id: number;
  user_id: number;
  current_weight: number | null;
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

// Updated DB type: removed target_calories
type MacroTargetFromDB = {
  id: number;
  user_id: number;
  // target_calories: number | null; // *** REMOVED ***
  macro_target: string; // JSON string column (renamed column)
  created_at: string;
  updated_at: string;
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
        // Use AuthenticatedContext for type safety in handler signature
        ({ user, set, db }: AuthenticatedContext) => {
          console.log(
            `[GET /goals/weight] Handler started for user ${user.userId}`
          ); // LOGGING
          try {
            // Select using renamed column calorie_target, daily_change
            const query =
              "SELECT id, user_id, current_weight, target_weight, weight_goal, start_date, target_date, calorie_target, calculated_weeks, weekly_change, daily_change, created_at, updated_at FROM weight_goals WHERE user_id = ?";
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
              currentWeight: dbGoal.current_weight,
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
        // Define handler type with context and typed body (camelCase from schema)
        ({
          user,
          body,
          set,
          db,
        }: AuthenticatedContext & {
          body: typeof GoalSchemas.updateWeightGoalBody.static;
        }) => {
          try {
            // Destructure camelCase, using renamed field
            const {
              currentWeight,
              targetWeight,
              weightGoal,
              startDate,
              targetDate,
              calorieTarget, // RENAMED
              calculatedWeeks,
              weeklyChange,
              dailyChange, // RENAMED dailyChange
            } = body;

            // UPSERT logic for weight_goals table
            // Use renamed calorie_target and daily_change columns
            const upsertQuery = `
                INSERT INTO weight_goals (
                    user_id, current_weight, target_weight, weight_goal, start_date, target_date,
                    calorie_target, calculated_weeks, weekly_change, daily_change, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(user_id) DO UPDATE SET
                    current_weight = excluded.current_weight, target_weight = excluded.target_weight,
                    weight_goal = excluded.weight_goal, start_date = excluded.start_date, target_date = excluded.target_date,
                    calorie_target = excluded.calorie_target, -- RENAMED
                    calculated_weeks = excluded.calculated_weeks, weekly_change = excluded.weekly_change,
                    daily_change = excluded.daily_change, updated_at = CURRENT_TIMESTAMP -- RENAMED
                RETURNING *;
            `;
            const savedGoalResult = db.prepare(upsertQuery).get(
              user.userId,
              currentWeight,
              targetWeight,
              weightGoal,
              startDate,
              targetDate,
              calorieTarget, // RENAMED
              calculatedWeeks,
              weeklyChange,
              dailyChange // RENAMED
            ) as WeightGoalFromDB | undefined;

            if (savedGoalResult === undefined) {
              set.status = 500;
              throw new Error(
                "Failed to save weight goals or retrieve result."
              );
            }
            const savedGoal = savedGoalResult;

            // Map response to camelCase, using renamed field
            set.status = 200;
            return {
              currentWeight: savedGoal.current_weight,
              targetWeight: savedGoal.target_weight,
              weightGoal: savedGoal.weight_goal,
              startDate: savedGoal.start_date,
              targetDate: savedGoal.target_date,
              calorieTarget: savedGoal.calorie_target, // RENAMED
              calculatedWeeks: savedGoal.calculated_weeks,
              weeklyChange: savedGoal.weekly_change,
              dailyChange: savedGoal.daily_change, // RENAMED
            };
          } catch (error) {
            console.error("[PUT /goals/weight] CAUGHT ERROR:", error); // LOGGING
            if (!set.status || set.status < 400) set.status = 500;
            throw new Error("Failed to save weight goals");
          }
        },
        {
          body: GoalSchemas.updateWeightGoalBody,
          response: GoalSchemas.updateWeightGoalResponse,
          detail: {
            summary: "Save or update the user's weight goals",
            tags: ["Goals"],
          },
        }
      )

      // --- Get Macro Targets (Percentages Only) ---
      .get(
        "/macros",
        ({ user, set, db }: AuthenticatedContext) => {
          try {
            console.log(
              `[GET /goals/macros] Handler started for user ${user.userId}`
            ); // LOGGING
            // Select only relevant columns (macro_target)
            const query =
              "SELECT macro_target FROM macro_targets WHERE user_id = ?";
            console.log("[GET /goals/macros] Preparing query..."); // LOGGING
            const statement = db.prepare(query);
            console.log("[GET /goals/macros] Executing query..."); // LOGGING
            const macroTargetsResult = statement.get(user.userId) as
              | Pick<MacroTargetFromDB, "macro_target">
              | undefined;
            console.log(
              "[GET /goals/macros] Query result:",
              macroTargetsResult
            ); // LOGGING

            // Use strict check for undefined or null
            if (!macroTargetsResult) {
              console.log(
                "[GET /goals/macros] No macro target row found, returning null."
              ); // LOGGING
              return null; // Return null if not found
            }

            let macroTargetParsed: MacroTargetPercentages | null = null;
            const jsonString = macroTargetsResult.macro_target || "{}";
            console.log(
              "[GET /goals/macros] Raw macro_target JSON:",
              jsonString
            ); // LOGGING

            try {
              const parsedJson = JSON.parse(jsonString);
              // Check if parsed object is empty or lacks required properties
              if (
                Object.keys(parsedJson).length === 0 ||
                typeof parsedJson.proteinPercentage !== "number" ||
                typeof parsedJson.carbsPercentage !== "number" ||
                typeof parsedJson.fatsPercentage !== "number"
              ) {
                console.log(
                  "[GET /goals/macros] Parsed JSON is empty or invalid, setting target to null."
                );
                macroTargetParsed = null;
              } else {
                macroTargetParsed = parsedJson as MacroTargetPercentages;
              }
            } catch (parseError) {
              console.error(
                "[GET /goals/macros] Error parsing macro_target JSON:",
                parseError
              );
              macroTargetParsed = null; // Set to null on parse error
            }

            console.log("[GET /goals/macros] Returning:", {
              macroTarget: macroTargetParsed,
            }); // LOGGING
            return { macroTarget: macroTargetParsed }; // Return { macroTarget: <object | null> }
          } catch (error) {
            console.error("[GET /goals/macros] CAUGHT ERROR:", error); // LOGGING
            set.status = 500;
            throw new Error("Failed to fetch macro targets");
          }
        },
        {
          response: GoalSchemas.getMacroTargetResponse,
          detail: {
            summary: "Get the user's macro target percentages",
            tags: ["Goals"],
          },
        } // Schema updated
      )

      // --- Save/Update Macro Targets (Percentages Only) ---
      .put(
        "/macros",
        ({
          user,
          body,
          set,
          db,
        }: AuthenticatedContext & {
          body: typeof GoalSchemas.updateMacroTargetBody.static;
        }) => {
          try {
            const { macroTarget } = body; // Body only has macroTarget now
            const macroTargetJson = macroTarget
              ? JSON.stringify(macroTarget)
              : "{}";
            // UPSERT logic - only update macro_target column
            const upsertQuery = `
                    INSERT INTO macro_targets (user_id, macro_target, updated_at)
                    VALUES (?, ?, CURRENT_TIMESTAMP)
                    ON CONFLICT(user_id) DO UPDATE SET
                        macro_target = excluded.macro_target,
                        updated_at = CURRENT_TIMESTAMP
                    RETURNING macro_target; -- Only return the saved JSON blob
                `;
            const savedTargetResult = db
              .prepare(upsertQuery)
              .get(user.userId, macroTargetJson) as
              | Pick<MacroTargetFromDB, "macro_target">
              | undefined;

            if (savedTargetResult === undefined) {
              set.status = 500;
              throw new Error(
                "Failed to save macro targets or retrieve result."
              );
            }

            let macroTargetParsed = null;
            try {
              const parsedJson = JSON.parse(
                savedTargetResult.macro_target || "{}"
              );
              if (
                Object.keys(parsedJson).length === 0 ||
                typeof parsedJson.proteinPercentage !== "number" /* ... etc */
              ) {
                macroTargetParsed = null;
              } else {
                macroTargetParsed = parsedJson as MacroTargetPercentages;
              }
            } catch (parseError) {
              console.error(
                "[PUT /goals/macros] Error parsing saved macro_target JSON:",
                parseError
              );
            }

            set.status = 200;
            return { macroTarget: macroTargetParsed }; // Return only the macroTarget object
          } catch (error) {
            console.error("[PUT /goals/macros] CAUGHT ERROR:", error); // LOGGING
            if (!set.status || set.status < 400) set.status = 500;
            throw new Error("Failed to save macro targets");
          }
        },
        {
          body: GoalSchemas.updateMacroTargetBody,
          response: GoalSchemas.updateMacroTargetResponse,
          detail: {
            summary: "Save or update the user's macro target percentages",
            tags: ["Goals"],
          },
        } // Schemas updated
      )

      // --- Reset Goals ---
      .post(
        "/reset",
        ({ user, set, db }: AuthenticatedContext) => {
          try {
            db.transaction(() => {
              db.prepare("DELETE FROM weight_goals WHERE user_id = ?").run(
                user.userId
              );
              db.prepare("DELETE FROM macro_targets WHERE user_id = ?").run(
                user.userId
              ); // Correct table name
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
  );
