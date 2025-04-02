// src/modules/macros/routes.ts
import { Elysia, t } from "elysia"; // Import t for schemas
import { db } from "../../db";
// Import schemas from this module, now including macro target schemas
import { MacroSchemas } from "./schemas";
import type { AuthenticatedContext } from "../../middleware/auth";
// Import the specific type for percentages if needed
import type { MacroTargetPercentages } from "./schemas";

// --- Database Result Types (snake_case) ---

// For macro_targets table - updated to use dedicated percentage fields
type MacroTargetFromDB = {
  id: number;
  user_id: number;
  protein_percentage: number;
  carbs_percentage: number;
  fats_percentage: number;
  locked_macros: string; // JSON array string
  created_at: string; // Assuming DATETIME maps to string from DB driver
  updated_at: string;
};

// For macro_entries table
type MacroEntryFromDB = {
  id: number;
  user_id: number;
  protein: number; // REAL
  carbs: number; // REAL
  fats: number; // REAL
  meal_type: string;
  meal_name: string | null;
  entry_date: string;
  entry_time: string;
  created_at: string | Date; // Driver might return Date object
};

// --- API Response Type (camelCase) ---

// For individual macro entries (matches MacroSchemas.macroEntryResponse)
type MacroEntryApiResponse = {
  id: number;
  protein: number;
  carbs: number;
  fats: number;
  mealType: string; // camelCase
  mealName: string | null; // camelCase
  entry_date: string;
  entry_time: string;
  created_at: string | Date;
};

/**
 * Gets the current date in YYYY-MM-DD format based on the server's local timezone.
 */
const getLocalDate = (): string => {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  const adjustedDate = new Date(date.getTime() - offset * 60 * 1000);
  return adjustedDate.toISOString().split("T")[0];
};

export const macroRoutes = (app: Elysia) =>
  app.group("/api/macros", (group) =>
    group
      .decorate("db", db)
      // No derive needed here, authMiddleware handles context

      // === TARGET PERCENTAGES ENDPOINTS (Moved from /goals) ===

      // --- Get Macro Target (Percentages Only) ---
      .get(
        "/target",
        ({ user, set, db }: AuthenticatedContext) => {
          console.log(
            `[GET /macros/target] Fetching target for user ID: ${user.userId}`
          );
          try {
            const query = "SELECT * FROM macro_targets WHERE user_id = ?";
            const macroTargetResult = db.prepare(query).get(user.userId) as
              | MacroTargetFromDB
              | undefined;
            console.log(
              "[GET /macros/target] Raw DB result:",
              macroTargetResult
            );

            // If no row exists or is null, apply default values
            if (!macroTargetResult) {
              console.log(
                "[GET /macros/target] No macro target row found, using defaults."
              );
              return {
                macroTarget: {
                  proteinPercentage: 30,
                  carbsPercentage: 40,
                  fatsPercentage: 30,
                  lockedMacros: [],
                },
              };
            }

            const macroTarget = macroTargetResult;
            let lockedMacros: string[] = [];
            try {
              lockedMacros = JSON.parse(macroTarget.locked_macros || "[]");
            } catch (error) {
              console.error(
                "[GET /macros/target] Error parsing locked_macros:",
                error
              );
            }
            const macroTargetData = {
              proteinPercentage: macroTarget.protein_percentage,
              carbsPercentage: macroTarget.carbs_percentage,
              fatsPercentage: macroTarget.fats_percentage,
              lockedMacros: Array.isArray(lockedMacros) ? lockedMacros : [],
            };

            return {
              macroTarget: macroTargetData,
            };
          } catch (error) {
            console.error("[GET /macros/target] CAUGHT ERROR:", error);
            set.status = 500;
            throw new Error("Failed to fetch macro targets");
          }
        },
        {
          response: MacroSchemas.getMacroTargetResponse,
          detail: {
            summary: "Get the user's macro target percentages",
            tags: ["Macros", "Goals"],
          },
        }
      )

      // --- Save/Update Macro Target (Percentages Only) ---
      .put(
        "/target",
        ({
          user,
          body,
          set,
          db,
        }: AuthenticatedContext & {
          body: typeof MacroSchemas.updateMacroTargetBody.static;
        }) => {
          console.log(
            `[PUT /macros/target] Saving target for user ID: ${user.userId}`
          );
          try {
            const { macroTarget } = body;

            // If macroTarget is null, use default values
            const proteinPercentage = macroTarget?.proteinPercentage ?? 30;
            const carbsPercentage = macroTarget?.carbsPercentage ?? 40;
            const fatsPercentage = macroTarget?.fatsPercentage ?? 30;

            // Convert locked macros to JSON string
            const lockedMacrosJson = JSON.stringify(
              macroTarget?.lockedMacros || []
            );

            console.log("[PUT /macros/target] Values to save:", {
              protein_percentage: proteinPercentage,
              carbs_percentage: carbsPercentage,
              fats_percentage: fatsPercentage,
              locked_macros: lockedMacrosJson,
            });

            // Update query to use individual percentage fields
            const upsertQuery = `
                INSERT INTO macro_targets (
                  user_id, 
                  protein_percentage,
                  carbs_percentage, 
                  fats_percentage,
                  locked_macros,
                  updated_at
                )
                VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(user_id) DO UPDATE SET
                    protein_percentage = excluded.protein_percentage,
                    carbs_percentage = excluded.carbs_percentage,
                    fats_percentage = excluded.fats_percentage,
                    locked_macros = excluded.locked_macros,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING protein_percentage, carbs_percentage, fats_percentage, locked_macros;
            `;

            const savedResult = db
              .prepare(upsertQuery)
              .get(
                user.userId,
                proteinPercentage,
                carbsPercentage,
                fatsPercentage,
                lockedMacrosJson
              ) as
              | Pick<
                  MacroTargetFromDB,
                  | "protein_percentage"
                  | "carbs_percentage"
                  | "fats_percentage"
                  | "locked_macros"
                >
              | undefined;

            console.log("[PUT /macros/target] Raw DB result:", savedResult);

            if (savedResult === undefined) {
              set.status = 500;
              throw new Error(
                "Failed to save macro targets or retrieve result."
              );
            }

            // Parse locked_macros from saved result
            let lockedMacros: string[] = [];
            try {
              lockedMacros = JSON.parse(savedResult.locked_macros || "[]");
              if (!Array.isArray(lockedMacros)) {
                lockedMacros = [];
              }
            } catch (error) {
              console.error(
                "[PUT /macros/target] Error parsing saved locked_macros:",
                error
              );
            }

            // Format response in camelCase
            const macroTargetResponse = {
              proteinPercentage: savedResult.protein_percentage,
              carbsPercentage: savedResult.carbs_percentage,
              fatsPercentage: savedResult.fats_percentage,
              lockedMacros: lockedMacros,
            };

            set.status = 200;
            console.log("[PUT /macros/target] Returning:", {
              macroTarget: macroTargetResponse,
            });
            return { macroTarget: macroTargetResponse };
          } catch (error) {
            console.error("[PUT /macros/target] CAUGHT ERROR:", error);
            if (!set.status || set.status < 400) set.status = 500;
            throw new Error("Failed to save macro targets");
          }
        },
        {
          body: MacroSchemas.updateMacroTargetBody,
          response: MacroSchemas.updateMacroTargetResponse,
          detail: {
            summary: "Save or update the user's macro target percentages",
            tags: ["Macros", "Goals"],
          },
        }
      )

      // === DAILY MACRO ENTRY ENDPOINTS ===

      // --- Get Today's Macro Totals ---
      .get(
        "/today",
        ({ db, user, set }: AuthenticatedContext) => {
          try {
            const todayDate = getLocalDate();
            const query = `
                SELECT COALESCE(SUM(protein), 0) AS protein, COALESCE(SUM(carbs), 0) AS carbs, COALESCE(SUM(fats), 0) AS fats
                FROM macro_entries WHERE user_id = ? AND entry_date = ?
            `;
            const result = db.prepare(query).get(user.userId, todayDate) as {
              protein: number;
              carbs: number;
              fats: number;
            };
            if (!result) {
              return { protein: 0, carbs: 0, fats: 0, calories: 0 };
            }
            const calories = Math.round(
              result.protein * 4 + result.carbs * 4 + result.fats * 9
            );
            return { ...result, calories };
          } catch (error) {
            console.error(
              `Error fetching today's macros for user ${user.userId}:`,
              error
            );
            set.status = 500;
            throw new Error("Failed to fetch today's macro totals.");
          }
        },
        {
          response: MacroSchemas.macroTotals,
          detail: {
            summary: "Get total macros consumed by the user today",
            tags: ["Macros"],
          },
        }
      )

      // --- Get Macro History ---
      .get(
        "/history",
        ({ db, user, set }: AuthenticatedContext) => {
          try {
            const query = `SELECT id, protein, carbs, fats, meal_type, meal_name, entry_date, entry_time, created_at FROM macro_entries WHERE user_id = ? ORDER BY entry_date DESC, entry_time DESC, created_at DESC`;
            const historyResult = db
              .prepare(query)
              .all(user.userId) as MacroEntryFromDB[];

            // Map snake_case DB results to camelCase API response
            const historyMapped: MacroEntryApiResponse[] = historyResult.map(
              (entry) => ({
                id: entry.id,
                protein: entry.protein,
                carbs: entry.carbs,
                fats: entry.fats,
                mealType: entry.meal_type, // Map
                mealName: entry.meal_name, // Map
                entry_date: entry.entry_date, // Keep snake_case to match schema
                entry_time: entry.entry_time, // Keep snake_case to match schema
                created_at: entry.created_at,
              })
            );
            return historyMapped;
          } catch (error) {
            console.error(
              `Error fetching macro history for user ${user.userId}:`,
              error
            );
            set.status = 500;
            throw new Error("Failed to fetch macro history.");
          }
        },
        {
          response: t.Array(MacroSchemas.macroEntryResponse),
          detail: {
            summary: "Get all macro entries recorded by the user",
            tags: ["Macros"],
          },
        }
      )

      // --- Add New Macro Entry ---
      .post(
        "/",
        ({
          db,
          user,
          body,
          set,
        }: AuthenticatedContext & {
          body: typeof MacroSchemas.macroEntryCreate.static;
        }) => {
          // Destructure body - Assuming schema uses camelCase for mealType/mealName
          const {
            protein,
            carbs,
            fats,
            mealType,
            mealName,
            entry_date,
            entry_time,
          } = body;
          try {
            // Use snake_case columns in query
            const query = `
                INSERT INTO macro_entries (user_id, protein, carbs, fats, meal_type, meal_name, entry_date, entry_time)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                RETURNING id, protein, carbs, fats, meal_type, meal_name, entry_date, entry_time, created_at
            `;
            const result = db.prepare(query).get(
              user.userId,
              protein,
              carbs,
              fats,
              mealType, // Map camelCase mealType to snake_case meal_type column
              mealName ?? "", // Map camelCase mealName to snake_case meal_name column
              entry_date,
              entry_time
            ) as MacroEntryFromDB | undefined;

            if (result === undefined) {
              set.status = 500;
              throw new Error(
                "Failed to create macro entry or retrieve confirmation."
              );
            }

            // Map snake_case result to camelCase response
            const apiResponse: MacroEntryApiResponse = {
              id: result.id,
              protein: result.protein,
              carbs: result.carbs,
              fats: result.fats,
              mealType: result.meal_type, // Map
              mealName: result.meal_name, // Map
              entry_date: result.entry_date,
              entry_time: result.entry_time,
              created_at: result.created_at,
            };
            return apiResponse;
          } catch (error) {
            if (
              error instanceof Error &&
              error.message.includes("CHECK constraint failed")
            ) {
              set.status = 400;
              throw new Error(`Invalid input: ${error.message}`);
            }
            console.error(
              `Error adding macro entry for user ${user.userId}:`,
              error
            );
            set.status = 500;
            throw new Error("Failed to add macro entry.");
          }
        },
        {
          // Ensure body/response schemas use camelCase for mealType/mealName
          body: MacroSchemas.macroEntryCreate,
          response: MacroSchemas.macroEntryResponse,
          detail: {
            summary: "Add a new macro entry for the user",
            tags: ["Macros"],
          },
        }
      )

      // --- Delete Macro Entry ---
      .delete(
        "/:id",
        ({
          db,
          user,
          params,
          set,
        }: AuthenticatedContext & {
          params: typeof MacroSchemas.macroIdParam.static;
        }) => {
          try {
            const query =
              "DELETE FROM macro_entries WHERE id = ? AND user_id = ?";
            const result = db.prepare(query).run(params.id, user.userId);
            if (result.changes === 0) {
              set.status = 404;
              throw new Error(
                `Macro entry with ID ${params.id} not found or access denied.`
              );
            }
            set.status = 200;
            return {
              success: true,
              message: `Macro entry ${params.id} deleted.`,
            };
          } catch (error) {
            if (error instanceof Error && set.status === 404) throw error;
            console.error(
              `Error deleting macro entry ${params.id} for user ${user.userId}:`,
              error
            );
            set.status = 500;
            throw new Error("Failed to delete macro entry.");
          }
        },
        {
          params: MacroSchemas.macroIdParam,
          response: {
            200: t.Object({ success: t.Boolean(), message: t.String() }),
          },
          detail: {
            summary: "Delete a specific macro entry",
            tags: ["Macros"],
          },
        }
      )

      // --- Update Macro Entry ---
      .put(
        "/:id",
        ({
          db,
          user,
          params,
          body,
          set,
        }: AuthenticatedContext & {
          params: typeof MacroSchemas.macroIdParam.static;
          body: typeof MacroSchemas.macroEntryUpdate.static;
        }) => {
          const { id } = params;
          const updates: Record<string, any> = {};
          // Assume body uses camelCase keys (mealType, mealName) based on schema
          if (body.protein !== undefined) updates.protein = body.protein;
          if (body.carbs !== undefined) updates.carbs = body.carbs;
          if (body.fats !== undefined) updates.fats = body.fats;
          if (body.mealType !== undefined) updates.meal_type = body.mealType; // Map to snake_case
          if (body.mealName !== undefined) updates.meal_name = body.mealName; // Map to snake_case
          if (body.entry_date !== undefined)
            updates.entry_date = body.entry_date;
          if (body.entry_time !== undefined)
            updates.entry_time = body.entry_time;

          const fieldsToUpdate = Object.keys(updates);
          if (fieldsToUpdate.length === 0) {
            set.status = 400;
            throw new Error("No valid fields provided for update.");
          }

          const setClause = fieldsToUpdate
            .map((field) => `${field} = ?`)
            .join(", ");
          const queryParams = [...Object.values(updates), id, user.userId];

          try {
            const query = `
                UPDATE macro_entries SET ${setClause}
                WHERE id = ? AND user_id = ?
                RETURNING id, protein, carbs, fats, meal_type, meal_name, entry_date, entry_time, created_at
            `;
            const result = db.prepare(query).get(...queryParams) as
              | MacroEntryFromDB
              | undefined;

            if (result === undefined) {
              const existsCheck =
                "SELECT id FROM macro_entries WHERE id = ? AND user_id = ?";
              const exists = db.prepare(existsCheck).get(id, user.userId);
              if (!exists) {
                set.status = 404;
                throw new Error(
                  `Macro entry with ID ${id} not found or access denied.`
                );
              } else {
                set.status = 500;
                throw new Error(
                  "Failed to update macro entry (update returned no data)."
                );
              }
            }

            // Map snake_case result to camelCase response
            const apiResponse: MacroEntryApiResponse = {
              id: result.id,
              protein: result.protein,
              carbs: result.carbs,
              fats: result.fats,
              mealType: result.meal_type, // Map
              mealName: result.meal_name, // Map
              entry_date: result.entry_date,
              entry_time: result.entry_time,
              created_at: result.created_at,
            };
            return apiResponse;
          } catch (error) {
            if (
              error instanceof Error &&
              (set.status === 404 || set.status === 400)
            )
              throw error;
            if (
              error instanceof Error &&
              error.message.includes("CHECK constraint failed")
            ) {
              set.status = 400;
              throw new Error(`Invalid input: ${error.message}`);
            }
            console.error(
              `Error updating macro entry ${id} for user ${user.userId}:`,
              error
            );
            set.status = 500;
            throw new Error("Failed to update macro entry.");
          }
        },
        {
          params: MacroSchemas.macroIdParam,
          // Ensure body/response schemas use camelCase for mealType/mealName
          body: MacroSchemas.macroEntryUpdate,
          response: MacroSchemas.macroEntryResponse,
          detail: {
            summary: "Update a specific macro entry",
            tags: ["Macros"],
          },
        }
      )
  );
