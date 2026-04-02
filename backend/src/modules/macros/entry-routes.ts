import { t } from "elysia";
import {
  safeExecute,
  safeQuery,
  safeQueryAll,
  type MacroEntryRow,
} from "../../lib/database";
import { getLocalDate } from "../../lib/dates";
import {
  AuthenticationError,
  BadRequestError,
  DatabaseError,
  NotFoundError,
} from "../../lib/errors";
import {
  mutationSuccessWithId,
} from "../../lib/mutation-contract";
import { checkProStatus, FREE_TIER_LIMITS } from "../../middleware/clerk-guards";
import { MacroSchemas } from "./schemas";
import {
  type MacroEntryResponse,
  normalizeMacroEntryRow,
  type MacrosRouteContext,
} from "./service";

export const registerMacroEntryRoutes = (group: any) =>
  group
    .get(
      "/totals",
      async (context: any) => {
        const { db, query } = context as MacrosRouteContext;
        const internalUserId = context.authenticatedUser.userId;
        let startDate = query?.startDate;
        let endDate = query?.endDate;

        if (!startDate && !endDate) {
          startDate = endDate = getLocalDate();
        }

        if (startDate && !endDate) endDate = startDate;
        if (endDate && !startDate) startDate = endDate;

        if (!startDate || !endDate) {
          throw new BadRequestError("Date range is required");
        }

        const result = safeQuery<{
          protein: number;
          carbs: number;
          fats: number;
        }>(
          db,
          `SELECT COALESCE(SUM(protein), 0) AS protein,
                  COALESCE(SUM(carbs), 0) AS carbs,
                  COALESCE(SUM(fats), 0) AS fats
           FROM macro_entries WHERE user_id = ? AND entry_date >= ? AND entry_date <= ?`,
          [internalUserId, startDate, endDate],
        );

        if (!result) {
          return { protein: 0, carbs: 0, fats: 0, calories: 0 };
        }

        return {
          ...result,
          calories: Math.round(result.protein * 4 + result.carbs * 4 + result.fats * 9),
        };
      },
      {
        query: t.Object({
          startDate: t.Optional(t.String()),
          endDate: t.Optional(t.String()),
        }),
        response: MacroSchemas.macroTotals,
        detail: {
          summary: "Get total macros consumed by the user for a date range (or today)",
          tags: ["Macros"],
        },
      },
    )
    .get(
      "/history",
      async (context: any) => {
        const { db, query } = context as MacrosRouteContext;
        const internalUserId = context.authenticatedUser.userId;

        if (!internalUserId) {
          throw new AuthenticationError("Authentication required.");
        }

        const userId = internalUserId as number;
        const limit = Math.max(1, Math.min(Number(query?.limit) || 20, 100));
        const offset = Math.max(0, Number(query?.offset) || 0);
        const startDate = query?.startDate;
        const endDate = query?.endDate;

        const isProUser = await checkProStatus(userId);
        const retentionDays = FREE_TIER_LIMITS.DATA_RETENTION_DAYS;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
        const cutoffDateString = cutoffDate.toISOString().split("T")[0] as string;

        const buildWhereClause = (includeRetentionCutoff: boolean) => {
          const clauses = ["user_id = ?"];
          const parameters: (number | string)[] = [userId];

          if (startDate) {
            clauses.push("entry_date >= ?");
            parameters.push(startDate);
          }

          if (endDate) {
            clauses.push("entry_date <= ?");
            parameters.push(endDate);
          }

          if (includeRetentionCutoff) {
            clauses.push("entry_date >= ?");
            parameters.push(cutoffDateString);
          }

          return {
            where: clauses.join(" AND "),
            parameters,
          };
        };

        const visibleWhere = buildWhereClause(!isProUser);
        const totalWhere = buildWhereClause(false);

        const countResult = safeQuery<{ count: number }>(
          db,
          `SELECT COUNT(*) as count FROM macro_entries WHERE ${visibleWhere.where}`,
          visibleWhere.parameters,
        );
        const visibleTotal = countResult?.count || 0;

        const totalAvailableResult = safeQuery<{ count: number }>(
          db,
          `SELECT COUNT(*) as count FROM macro_entries WHERE ${totalWhere.where}`,
          totalWhere.parameters,
        );
        const totalAvailable = totalAvailableResult?.count || 0;

        const historyQuery = `SELECT id, protein, carbs, fats, meal_type, meal_name, entry_date, entry_time, ingredients, created_at
           FROM macro_entries
           WHERE ${visibleWhere.where}
           ORDER BY entry_date DESC, entry_time DESC, created_at DESC
           LIMIT ? OFFSET ?`;
        const historyParams = [...visibleWhere.parameters, limit, offset];

        const historyResult = safeQueryAll<MacroEntryRow & { ingredients: string }>(
          db,
          historyQuery,
          historyParams,
        );

        const response: {
          entries: MacroEntryResponse[];
          total: number;
          limit: number;
          offset: number;
          hasMore: boolean;
          limits?: {
            totalAvailable: number;
            visibleCount: number;
            isRestricted: boolean;
            upgradePrompt?: string;
          };
        } = {
          entries: historyResult.map((entry) => normalizeMacroEntryRow(entry)),
          total: visibleTotal,
          limit,
          offset,
          hasMore: offset + limit < visibleTotal,
        };

        if (!isProUser && totalAvailable > visibleTotal) {
          const hiddenCount = totalAvailable - visibleTotal;
          response.limits = {
            totalAvailable,
            visibleCount: visibleTotal,
            isRestricted: true,
            upgradePrompt: `${hiddenCount} older ${hiddenCount === 1 ? "entry" : "entries"} available with Pro`,
          };
        }

        return response;
      },
      {
        query: t.Object({
          limit: t.Optional(t.Numeric()),
          offset: t.Optional(t.Numeric()),
          startDate: t.Optional(t.String()),
          endDate: t.Optional(t.String()),
        }),
        response: t.Object({
          entries: t.Array(MacroSchemas.macroEntryResponse),
          total: t.Numeric(),
          limit: t.Numeric(),
          offset: t.Numeric(),
          hasMore: t.Boolean(),
          limits: t.Optional(
            t.Object({
              totalAvailable: t.Numeric(),
              visibleCount: t.Numeric(),
              isRestricted: t.Boolean(),
              upgradePrompt: t.Optional(t.String()),
            }),
          ),
        }),
        detail: {
          summary: "Get paginated macro entries recorded by the user",
          tags: ["Macros"],
        },
      },
    )
    .post(
      "/",
      async (context: any) => {
        const { db, body } = context as MacrosRouteContext;
        const internalUserId = context.authenticatedUser.userId;

        if (!body) {
          throw new BadRequestError("Request body is required");
        }

        const {
          protein,
          carbs,
          fats,
          mealType,
          mealName,
          entryDate,
          entryTime,
          ingredients,
        } = body as {
          protein: number;
          carbs: number;
          fats: number;
          mealType: string;
          mealName?: string;
          entryDate: string;
          entryTime: string;
          ingredients?: unknown[];
        };

        const ingredientsJson = ingredients ? JSON.stringify(ingredients) : null;

        const result = safeQuery<MacroEntryRow>(
          db,
          `INSERT INTO macro_entries (user_id, protein, carbs, fats, meal_type, meal_name, entry_date, entry_time, ingredients)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           RETURNING id, protein, carbs, fats, meal_type, meal_name, entry_date, entry_time, ingredients, created_at`,
          [
            internalUserId,
            protein,
            carbs,
            fats,
            mealType,
            mealName ?? "",
            entryDate,
            entryTime,
            ingredientsJson,
          ],
        );

        if (!result) {
          throw new DatabaseError("Failed to create macro entry or retrieve confirmation.");
        }

        return normalizeMacroEntryRow(result);
      },
      {
        body: MacroSchemas.macroEntryCreate,
        response: MacroSchemas.macroEntryResponse,
        detail: {
          summary: "Add a new macro entry for the user",
          tags: ["Macros"],
        },
      },
    )
    .delete(
      "/:id",
      async (context: any) => {
        const { db, params } = context as MacrosRouteContext;
        const internalUserId = context.authenticatedUser.userId;

        const entryId = params?.id;
        if (!entryId) {
          throw new NotFoundError("Macro entry ID is required");
        }

        const result = safeExecute(
          db,
          "DELETE FROM macro_entries WHERE id = ? AND user_id = ?",
          [entryId, internalUserId],
        );

        if (result.changes === 0) {
          throw new NotFoundError(
            `Macro entry with ID ${entryId} not found or access denied.`,
          );
        }

        return mutationSuccessWithId(Number(entryId));
      },
      {
        params: MacroSchemas.macroIdParam,
        response: {
          200: MacroSchemas.deleteMacroEntryResponse,
        },
        detail: {
          summary: "Delete a specific macro entry",
          tags: ["Macros"],
        },
      },
    )
    .put(
      "/:id",
      async (context: any) => {
        const { db, params, body } = context as MacrosRouteContext;
        const internalUserId = context.authenticatedUser.userId;

        if (!body) {
          throw new BadRequestError("Request body is required");
        }

        const entryId = params?.id;
        if (!entryId) {
          throw new NotFoundError("Macro entry ID is required");
        }

        const updates: Record<string, unknown> = {};
        if (body.protein !== undefined) updates.protein = body.protein;
        if (body.carbs !== undefined) updates.carbs = body.carbs;
        if (body.fats !== undefined) updates.fats = body.fats;
        if (body.mealType !== undefined) updates.meal_type = body.mealType;
        if (body.mealName !== undefined) updates.meal_name = body.mealName;
        if (body.entryDate !== undefined) updates.entry_date = body.entryDate;
        if (body.entryTime !== undefined) updates.entry_time = body.entryTime;
        if (body.ingredients !== undefined) {
          updates.ingredients = JSON.stringify(body.ingredients);
        }

        const fieldsToUpdate = Object.keys(updates);
        if (fieldsToUpdate.length === 0) {
          throw new BadRequestError("No valid fields provided for update.");
        }

        const setClause = fieldsToUpdate.map((field) => `${field} = ?`).join(", ");
        const queryParams = [...Object.values(updates), entryId, internalUserId];

        const result = safeQuery<MacroEntryRow>(
          db,
          `UPDATE macro_entries SET ${setClause}
           WHERE id = ? AND user_id = ?
           RETURNING id, protein, carbs, fats, meal_type, meal_name, entry_date, entry_time, ingredients, created_at`,
          queryParams,
        );

        if (!result) {
          const exists = safeQuery<{ id: number }>(
            db,
            "SELECT id FROM macro_entries WHERE id = ? AND user_id = ?",
            [entryId, internalUserId],
          );

          if (!exists) {
            throw new NotFoundError(
              `Macro entry with ID ${entryId} not found or access denied.`,
            );
          }

          throw new DatabaseError("Failed to update macro entry (update returned no data).");
        }

        return normalizeMacroEntryRow(result);
      },
      {
        params: MacroSchemas.macroIdParam,
        body: MacroSchemas.macroEntryUpdate,
        response: MacroSchemas.macroEntryResponse,
        detail: {
          summary: "Update a specific macro entry",
          tags: ["Macros"],
        },
      },
    );
