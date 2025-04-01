// src/modules/goals/routes.ts
import { Elysia } from "elysia"; // Removed unused 't' import
import { db } from "../../db";
// Import the simplified schemas
import { GoalSchemas } from "./schemas";
import type { AuthenticatedContext } from "../../middleware/auth";

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
  adjusted_calorie_intake: number | null;
  calculated_weeks: number | null;
  weekly_change: number | null;
  daily_deficit: number | null;
  created_at: string; // Assuming DATETIME maps to string from DB driver
  updated_at: string;
};

type MacroTargetFromDB = {
  id: number;
  user_id: number;
  target_calories: number | null;
  macro_distribution: string; // JSON string from DB
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
          try {
            const query = "SELECT * FROM weight_goals WHERE user_id = ?";
            // Bun's get() might return undefined if no row found
            const weightGoalsResult = db.prepare(query).get(user.userId) as
              | WeightGoalFromDB
              | undefined;

            // Use strict check for undefined
            if (weightGoalsResult === undefined) {
              // Return null if no goals found, matching the response schema t.Nullable(...)
              return null;
            }

            // Type assertion is safe after the check
            const weightGoals = weightGoalsResult;

            // Map snake_case from DB to camelCase for API response
            return {
              currentWeight: weightGoals.current_weight,
              targetWeight: weightGoals.target_weight,
              weightGoal: weightGoals.weight_goal,
              startDate: weightGoals.start_date,
              targetDate: weightGoals.target_date,
              adjustedCalorieIntake: weightGoals.adjusted_calorie_intake,
              calculatedWeeks: weightGoals.calculated_weeks,
              weeklyChange: weightGoals.weekly_change,
              dailyDeficit: weightGoals.daily_deficit,
            };
          } catch (error) {
            console.error("Error fetching weight goals:", error);
            set.status = 500;
            // Use throw for global handler
            throw new Error("Failed to fetch weight goals");
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
            // Destructure camelCase from validated body (now typed correctly)
            const {
              currentWeight,
              targetWeight,
              weightGoal,
              startDate,
              targetDate,
              adjustedCalorieIntake,
              calculatedWeeks,
              weeklyChange,
              dailyDeficit,
            } = body;

            // Use UPSERT logic (INSERT ON CONFLICT DO UPDATE)
            // Map camelCase body fields to snake_case DB columns in query params
            const upsertQuery = `
                INSERT INTO weight_goals (
                    user_id, current_weight, target_weight, weight_goal, start_date, target_date,
                    adjusted_calorie_intake, calculated_weeks, weekly_change, daily_deficit, updated_at
                ) VALUES (
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP
                )
                ON CONFLICT(user_id) DO UPDATE SET
                    current_weight = excluded.current_weight,
                    target_weight = excluded.target_weight,
                    weight_goal = excluded.weight_goal,
                    start_date = excluded.start_date,
                    target_date = excluded.target_date,
                    adjusted_calorie_intake = excluded.adjusted_calorie_intake,
                    calculated_weeks = excluded.calculated_weeks,
                    weekly_change = excluded.weekly_change,
                    daily_deficit = excluded.daily_deficit,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING *; -- Return the inserted/updated row
            `;

            // Execute UPSERT, passing parameters in correct order
            const savedGoalResult = db
              .prepare(upsertQuery)
              .get(
                user.userId,
                currentWeight,
                targetWeight,
                weightGoal,
                startDate,
                targetDate,
                adjustedCalorieIntake,
                calculatedWeeks,
                weeklyChange,
                dailyDeficit
              ) as WeightGoalFromDB | undefined;

            // Check if UPSERT succeeded (it should return the row)
            if (savedGoalResult === undefined) {
              set.status = 500;
              throw new Error(
                "Failed to save weight goals or retrieve result."
              );
            }
            // Type assertion is safe after check
            const savedGoal = savedGoalResult;

            // Map snake_case from DB result back to camelCase for response
            set.status = 200; // OK
            return {
              currentWeight: savedGoal.current_weight,
              targetWeight: savedGoal.target_weight,
              weightGoal: savedGoal.weight_goal,
              startDate: savedGoal.start_date,
              targetDate: savedGoal.target_date,
              adjustedCalorieIntake: savedGoal.adjusted_calorie_intake,
              calculatedWeeks: savedGoal.calculated_weeks,
              weeklyChange: savedGoal.weekly_change,
              dailyDeficit: savedGoal.daily_deficit,
            };
          } catch (error) {
            console.error("Error saving weight goals:", error);
            // Ensure status is set before throwing for the global handler
            if (!set.status || set.status === 200) {
              // Avoid overwriting specific error statuses
              set.status = 500;
            }
            // Use throw for global handler
            throw new Error("Failed to save weight goals");
          }
        },
        {
          body: GoalSchemas.updateWeightGoalBody, // Apply body schema (camelCase)
          response: GoalSchemas.updateWeightGoalResponse, // Apply response schema (camelCase)
          detail: {
            summary: "Save or update the user's weight goals",
            tags: ["Goals"],
          },
        }
      )

      // --- Get Macro Targets ---
      .get(
        "/macros",
        ({ user, set, db }: AuthenticatedContext) => {
          try {
            const query = "SELECT * FROM macro_targets WHERE user_id = ?";
            const macroTargetsResult = db.prepare(query).get(user.userId) as
              | MacroTargetFromDB
              | undefined;

            // Use strict check for undefined
            if (macroTargetsResult === undefined) {
              return null; // Return null if not found
            }
            // Type assertion is safe after check
            const macroTargets = macroTargetsResult;

            // Safely parse the JSON stored in macro_distribution column
            let macroDistributionParsed = null; // Default to null
            try {
              // Use default empty object string if DB value is null/empty
              const jsonString = macroTargets.macro_distribution || "{}";
              macroDistributionParsed = JSON.parse(jsonString);
              // Optional: Add validation here to ensure parsed object matches MacroDistributionSchema structure
            } catch (parseError) {
              console.error(
                "Error parsing macro_distribution JSON:",
                parseError
              );
              // Keep macroDistributionParsed as null if parsing fails
              // Consider logging or throwing a 500 if parsing is critical
              // set.status = 500; throw new Error("Failed to parse macro distribution data.");
            }

            // Return the formatted response (camelCase)
            return {
              targetCalories: macroTargets.target_calories,
              macroDistribution: macroDistributionParsed,
            };
          } catch (error) {
            console.error("Error fetching macro targets:", error);
            set.status = 500;
            throw new Error("Failed to fetch macro targets"); // Use throw
          }
        },
        {
          response: GoalSchemas.getMacroTargetResponse, // Apply response schema
          detail: {
            summary: "Get the user's macro targets",
            tags: ["Goals"],
          },
        }
      )

      // --- Save/Update Macro Targets (UPSERT) ---
      .put(
        "/macros",
        // Define handler type with context and typed body (camelCase)
        ({
          user,
          body,
          set,
          db,
        }: AuthenticatedContext & {
          body: typeof GoalSchemas.updateMacroTargetBody.static;
        }) => {
          try {
            // Destructure camelCase from validated body (now typed correctly)
            const { targetCalories, macroDistribution } = body;

            // Convert macro_distribution object to a JSON string for storage, handle null/undefined
            // Ensure the object structure matches MacroDistributionSchema before stringifying
            const macroDistributionJson = macroDistribution
              ? JSON.stringify(macroDistribution)
              : "{}";

            // UPSERT logic
            const upsertQuery = `
                INSERT INTO macro_targets (user_id, target_calories, macro_distribution, updated_at)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(user_id) DO UPDATE SET
                    target_calories = excluded.target_calories,
                    macro_distribution = excluded.macro_distribution,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING *;
            `;

            // Execute UPSERT
            const savedTargetResult = db
              .prepare(upsertQuery)
              .get(user.userId, targetCalories, macroDistributionJson) as
              | MacroTargetFromDB
              | undefined;

            if (savedTargetResult === undefined) {
              set.status = 500;
              throw new Error(
                "Failed to save macro targets or retrieve result."
              );
            }
            // Type assertion is safe after check
            const savedTarget = savedTargetResult;

            // Parse distribution back for response consistency
            let macroDistributionParsed = null;
            try {
              macroDistributionParsed = JSON.parse(
                savedTarget.macro_distribution || "{}"
              );
            } catch (parseError) {
              console.error(
                "Error parsing saved macro_distribution JSON:",
                parseError
              );
              macroDistributionParsed = null; // Or handle differently
            }

            set.status = 200; // OK
            // Return camelCase response
            return {
              targetCalories: savedTarget.target_calories,
              macroDistribution: macroDistributionParsed,
            };
          } catch (error) {
            console.error("Error saving macro targets:", error);
            if (!set.status || set.status === 200) {
              set.status = 500;
            }
            throw new Error("Failed to save macro targets"); // Use throw
          }
        },
        {
          body: GoalSchemas.updateMacroTargetBody, // Apply body schema (camelCase)
          response: GoalSchemas.updateMacroTargetResponse, // Apply response schema (camelCase)
          detail: {
            summary: "Save or update the user's macro targets",
            tags: ["Goals"],
          },
        }
      )

      // --- Reset Goals ---
      .post(
        "/reset",
        ({ user, set, db }: AuthenticatedContext) => {
          try {
            // Use transaction for atomicity
            db.transaction(() => {
              db.prepare("DELETE FROM weight_goals WHERE user_id = ?").run(
                user.userId
              );
              db.prepare("DELETE FROM macro_targets WHERE user_id = ?").run(
                user.userId
              );
            })(); // Immediately invoke transaction

            set.status = 200; // OK
            return { success: true };
          } catch (error) {
            console.error("Error resetting goals:", error);
            set.status = 500;
            throw new Error("Failed to reset goals"); // Use throw
          }
        },
        {
          response: GoalSchemas.resetResponse, // Apply response schema
          detail: {
            summary: "Reset all goals (weight & macro) for the user",
            tags: ["Goals"],
          },
        }
      )
  );
