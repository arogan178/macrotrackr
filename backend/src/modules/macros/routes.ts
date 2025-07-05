// src/modules/macros/routes.ts
import { Elysia, t } from "elysia";
import { db } from "../../db";
import { MacroSchemas } from "./schemas";
import type { AuthenticatedContext } from "../../middleware/auth";
import { safeQuery, safeExecute, safeQueryAll } from "../../lib/database";
import { NotFoundError } from "../../lib/errors";
import { getLocalDate } from "../../lib/dates";
import { loggerHelpers } from "../../lib/logger";
import { toCamelCase } from "../../lib/responses";

// Database result types (snake_case)
type MacroTargetFromDB = {
  id: number;
  user_id: number;
  protein_percentage: number;
  carbs_percentage: number;
  fats_percentage: number;
  locked_macros: string; // JSON array string
  created_at: string;
  updated_at: string;
};

type MacroEntryFromDB = {
  id: number;
  user_id: number;
  protein: number;
  carbs: number;
  fats: number;
  meal_type: string;
  meal_name: string | null;
  entry_date: string;
  entry_time: string;
  created_at: string | Date;
};

export const macroRoutes = (app: Elysia) =>
  app.group("/api/macros", (group) =>
    group
      .decorate("db", db)

      // GET /target - Get macro target percentages
      .get(
        "/target",
        async (context: any) => {
          const { user, db } = context as AuthenticatedContext;

          loggerHelpers.apiRequest("GET", "/macros/target", user.userId, {
            correlationId: (context.request as any)?.correlationId,
          });

          const macroTargetResult = safeQuery<MacroTargetFromDB>(
            db,
            "SELECT * FROM macro_targets WHERE user_id = ?",
            [user.userId]
          );

          // If no row exists, return defaults
          if (!macroTargetResult) {
            loggerHelpers.dbQuery("SELECT", "macro_targets", user.userId, 0);
            return {
              macroTarget: {
                proteinPercentage: 30,
                carbsPercentage: 40,
                fatsPercentage: 30,
                lockedMacros: [],
              },
            };
          }

          let lockedMacros: string[] = [];
          try {
            lockedMacros = JSON.parse(macroTargetResult.locked_macros || "[]");
          } catch (error) {
            console.error(
              "[GET /macros/target] Error parsing locked_macros:",
              error
            );
            lockedMacros = [];
          }

          const macroTargetData = {
            proteinPercentage: macroTargetResult.protein_percentage,
            carbsPercentage: macroTargetResult.carbs_percentage,
            fatsPercentage: macroTargetResult.fats_percentage,
            lockedMacros: Array.isArray(lockedMacros)
              ? lockedMacros.filter(
                  (item): item is "protein" | "carbs" | "fats" =>
                    ["protein", "carbs", "fats"].includes(item)
                )
              : [],
          };

          return { macroTarget: macroTargetData };
        },
        {
          response: MacroSchemas.getMacroTargetResponse,
          detail: {
            summary: "Get the user's macro target percentages",
            tags: ["Macros", "Goals"],
          },
        }
      )

      // PUT /target - Save/Update macro target percentages
      .put(
        "/target",
        async (context: any) => {
          const { user, db, body } = context as AuthenticatedContext & {
            body: typeof MacroSchemas.updateMacroTargetBody.static;
          };

          loggerHelpers.apiRequest("PUT", "/macros/target", user.userId, {
            correlationId: (context.request as any)?.correlationId,
          });

          const { macroTarget } = body;

          // Use default values if macroTarget is null
          const proteinPercentage = macroTarget?.proteinPercentage ?? 30;
          const carbsPercentage = macroTarget?.carbsPercentage ?? 40;
          const fatsPercentage = macroTarget?.fatsPercentage ?? 30;
          const lockedMacrosJson = JSON.stringify(
            macroTarget?.lockedMacros || []
          );

          // Upsert macro targets
          const savedResult = safeQuery<{
            protein_percentage: number;
            carbs_percentage: number;
            fats_percentage: number;
            locked_macros: string;
          }>(
            db,
            `INSERT INTO macro_targets (
               user_id, protein_percentage, carbs_percentage, fats_percentage, locked_macros, updated_at
             )
             VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
             ON CONFLICT(user_id) DO UPDATE SET
               protein_percentage = excluded.protein_percentage,
               carbs_percentage = excluded.carbs_percentage,
               fats_percentage = excluded.fats_percentage,
               locked_macros = excluded.locked_macros,
               updated_at = CURRENT_TIMESTAMP
             RETURNING protein_percentage, carbs_percentage, fats_percentage, locked_macros`,
            [
              user.userId,
              proteinPercentage,
              carbsPercentage,
              fatsPercentage,
              lockedMacrosJson,
            ]
          );

          if (!savedResult) {
            throw new Error("Failed to save macro targets");
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
            lockedMacros = [];
          }

          const macroTargetResponse = {
            proteinPercentage: savedResult.protein_percentage,
            carbsPercentage: savedResult.carbs_percentage,
            fatsPercentage: savedResult.fats_percentage,
            lockedMacros: lockedMacros.filter(
              (item): item is "protein" | "carbs" | "fats" =>
                ["protein", "carbs", "fats"].includes(item)
            ),
          };

          loggerHelpers.dbQuery("UPSERT", "macro_targets", user.userId, 1);
          return { macroTarget: macroTargetResponse };
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

      // GET /today - Get today's macro totals
      .get(
        "/today",
        async (context: any) => {
          const { db, user } = context as AuthenticatedContext;

          const todayDate = getLocalDate();
          const result = safeQuery<{
            protein: number;
            carbs: number;
            fats: number;
          }>(
            db,
            `SELECT COALESCE(SUM(protein), 0) AS protein, 
                    COALESCE(SUM(carbs), 0) AS carbs, 
                    COALESCE(SUM(fats), 0) AS fats
             FROM macro_entries WHERE user_id = ? AND entry_date = ?`,
            [user.userId, todayDate]
          );

          if (!result) {
            return { protein: 0, carbs: 0, fats: 0, calories: 0 };
          }

          const calories = Math.round(
            result.protein * 4 + result.carbs * 4 + result.fats * 9
          );

          return { ...result, calories };
        },
        {
          response: MacroSchemas.macroTotals,
          detail: {
            summary: "Get total macros consumed by the user today",
            tags: ["Macros"],
          },
        }
      )

      // GET /history - Get macro history
      .get(
        "/history",
        async (context: any) => {
          const { db, user } = context as AuthenticatedContext;

          const historyResult = safeQueryAll<MacroEntryFromDB>(
            db,
            `SELECT id, protein, carbs, fats, meal_type, meal_name, entry_date, entry_time, created_at 
             FROM macro_entries 
             WHERE user_id = ? 
             ORDER BY entry_date DESC, entry_time DESC, created_at DESC`,
            [user.userId]
          );

          return historyResult.map(toCamelCase);
        },
        {
          response: t.Array(MacroSchemas.macroEntryResponse),
          detail: {
            summary: "Get all macro entries recorded by the user",
            tags: ["Macros"],
          },
        }
      )

      // POST / - Add new macro entry
      .post(
        "/",
        async (context: any) => {
          const { db, user, body } = context as AuthenticatedContext & {
            body: typeof MacroSchemas.macroEntryCreate.static;
          };

          const {
            protein,
            carbs,
            fats,
            mealType,
            mealName,
            entryDate,
            entryTime,
          } = body;

          const result = safeQuery<MacroEntryFromDB>(
            db,
            `INSERT INTO macro_entries (user_id, protein, carbs, fats, meal_type, meal_name, entry_date, entry_time)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)
             RETURNING id, protein, carbs, fats, meal_type, meal_name, entry_date, entry_time, created_at`,
            [
              user.userId,
              protein,
              carbs,
              fats,
              mealType,
              mealName ?? "",
              entryDate,
              entryTime,
            ]
          );

          if (!result) {
            throw new Error(
              "Failed to create macro entry or retrieve confirmation."
            );
          }

          return toCamelCase(result);
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

      // DELETE /:id - Delete macro entry
      .delete(
        "/:id",
        async (context: any) => {
          const { db, user, params } = context as AuthenticatedContext & {
            params: typeof MacroSchemas.macroIdParam.static;
          };

          const result = safeExecute(
            db,
            "DELETE FROM macro_entries WHERE id = ? AND user_id = ?",
            [params.id, user.userId]
          );

          if (result.changes === 0) {
            throw new NotFoundError(
              `Macro entry with ID ${params.id} not found or access denied.`
            );
          }

          return {
            success: true,
            message: `Macro entry ${params.id} deleted.`,
          };
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

      // PUT /:id - Update macro entry
      .put(
        "/:id",
        async (context: any) => {
          const { db, user, params, body } = context as AuthenticatedContext & {
            params: typeof MacroSchemas.macroIdParam.static;
            body: typeof MacroSchemas.macroEntryUpdate.static;
          };

          const { id } = params;
          const updates: Record<string, any> = {};

          // Build update object with proper snake_case mapping
          if (body.protein !== undefined) updates.protein = body.protein;
          if (body.carbs !== undefined) updates.carbs = body.carbs;
          if (body.fats !== undefined) updates.fats = body.fats;
          if (body.mealType !== undefined) updates.meal_type = body.mealType;
          if (body.mealName !== undefined) updates.meal_name = body.mealName;
          if (body.entryDate !== undefined) updates.entry_date = body.entryDate;
          if (body.entryTime !== undefined) updates.entry_time = body.entryTime;

          const fieldsToUpdate = Object.keys(updates);
          if (fieldsToUpdate.length === 0) {
            throw new Error("No valid fields provided for update.");
          }

          const setClause = fieldsToUpdate
            .map((field) => `${field} = ?`)
            .join(", ");
          const queryParams = [...Object.values(updates), id, user.userId];

          const result = safeQuery<MacroEntryFromDB>(
            db,
            `UPDATE macro_entries SET ${setClause}
             WHERE id = ? AND user_id = ?
             RETURNING id, protein, carbs, fats, meal_type, meal_name, entry_date, entry_time, created_at`,
            queryParams
          );

          if (!result) {
            // Check if entry exists to provide better error message
            const exists = safeQuery<{ id: number }>(
              db,
              "SELECT id FROM macro_entries WHERE id = ? AND user_id = ?",
              [id, user.userId]
            );

            if (!exists) {
              throw new NotFoundError(
                `Macro entry with ID ${id} not found or access denied.`
              );
            } else {
              throw new Error(
                "Failed to update macro entry (update returned no data)."
              );
            }
          }

          return toCamelCase(result);
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
