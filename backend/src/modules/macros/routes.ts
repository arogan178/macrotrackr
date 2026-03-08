// src/modules/macros/routes.ts
import { Elysia, t } from "elysia";
import { db } from "../../db";
import { MacroSchemas } from "./schemas";
import type { AuthenticatedContext } from "../../types";
import {
  safeQuery,
  safeExecute,
  safeQueryAll,
  type MacroTargetRow,
  type MacroEntryRow,
} from "../../lib/database";
import { BadRequestError, NotFoundError } from "../../lib/errors";
import { getLocalDate } from "../../lib/dates";
import { loggerHelpers } from "../../lib/logger";
import { toCamelCase } from "../../lib/responses";

import {
  buildFoodSearchCacheKey,
  normalizeFoodSearchQuery,
  OpenFoodFactsApiClient,
} from "../../lib/openfoodfacts-api-client";
import { cacheService } from "../../lib/cache-service";
import type { Database } from "bun:sqlite";
import { checkProStatus, FREE_TIER_LIMITS } from "../../middleware/clerk-guards";

// Import types from API client
import type { FoodProductResult } from "../../lib/openfoodfacts-api-client";

// Cache service interface
interface CacheService {
  get: <T>(key: string) => T | null | undefined;
  set: <T>(key: string, value: T) => void;
}

// Extended macros context type for route handlers
// Extends AuthenticatedContext with module-specific properties
interface MacrosRouteContext extends AuthenticatedContext {
  body?: Record<string, unknown>;
  params?: Record<string, string>;
  query: Record<string, string | undefined>;
  db: Database;
  openFoodFactsApiClient?: {
    search: (query: string) => Promise<FoodProductResult[]>;
  };
  cacheService?: CacheService;
}

export const macroRoutes = (app: Elysia) =>
  app.group("/api/macros", (group) =>
    group
      .decorate("openFoodFactsApiClient", new OpenFoodFactsApiClient())
      .decorate("cacheService", cacheService)

      // GET /search - Search for food
      .get(
        "/search",
        async (context: any) => {
          const { query, openFoodFactsApiClient, cacheService: cache } = context as MacrosRouteContext;

          const rawSearchQuery = query?.q;
          if (!rawSearchQuery) {
            throw new BadRequestError("Search query is required");
          }

          const searchQuery = normalizeFoodSearchQuery(rawSearchQuery);
          if (searchQuery.length < 2) {
            throw new BadRequestError("Search query must be at least 2 characters long");
          }

          const cacheKey = buildFoodSearchCacheKey(searchQuery);
          
          if (cache) {
            const cachedResult = cache.get<FoodProductResult[]>(cacheKey);
            if (cachedResult) {
              return cachedResult;
            }
          }

          if (!openFoodFactsApiClient) {
            throw new BadRequestError("Food API client not available");
          }

          const results = await openFoodFactsApiClient.search(searchQuery);
          
          if (cache) {
            cache.set(cacheKey, results);
          }
          
          return results;
        },
        {
          query: MacroSchemas.foodSearchQuery,
          response: MacroSchemas.foodSearchResponse,
          detail: {
            summary: "Search for a food item using OpenFoodFacts API",
            tags: ["Macros"],
          },
        }
      )
      .decorate("db", db)

      // GET /target - Get macro target percentages
      .get(
        "/target",
        async (context: any) => {
          const { internalUserId, db, request } = context as MacrosRouteContext;

          // Get correlation ID from request headers if available
          const correlationId = request.headers.get("x-correlation-id") || undefined;

          loggerHelpers.apiRequest("GET", "/macros/target", internalUserId ?? undefined, {
            correlationId,
          });

          const macroTargetResult = safeQuery<MacroTargetRow>(
            db,
            "SELECT * FROM macro_targets WHERE user_id = ?",
            [internalUserId]
          );

          // If no row exists, return defaults
          if (!macroTargetResult) {
            loggerHelpers.dbQuery("SELECT", "macro_targets", internalUserId ?? undefined, 0);
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
            loggerHelpers.error(error as Error, {
              operation: "parse_locked_macros",
              path: "/macros/target",
              userId: internalUserId ?? undefined,
            });
            lockedMacros = [];
          }

          const macroTargetData = {
            proteinPercentage: macroTargetResult.protein_percentage,
            carbsPercentage: macroTargetResult.carbs_percentage,
            fatsPercentage: macroTargetResult.fats_percentage,
            lockedMacros:
              Array.isArray(lockedMacros) ?
                lockedMacros.filter(
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
          const { internalUserId, db, body, request } = context as MacrosRouteContext;

          if (!body) {
            throw new Error("Request body is required");
          }

          // Get correlation ID from request headers if available
          const correlationId = request.headers.get("x-correlation-id") || undefined;

          loggerHelpers.apiRequest("PUT", "/macros/target", internalUserId ?? undefined, {
            correlationId,
          });

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const macroTarget = (body as any).macroTarget;

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
              internalUserId,
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
            loggerHelpers.error(error as Error, {
              operation: "parse_saved_locked_macros",
              path: "/macros/target",
              userId: internalUserId ?? undefined,
            });
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

          loggerHelpers.dbQuery("UPSERT", "macro_targets", internalUserId ?? undefined, 1);
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

      // GET /totals - Get macro totals for a date range (or today if not specified)
      .get(
        "/totals",
        async (context: any) => {
          const { db, internalUserId, query } = context as MacrosRouteContext;
          let startDate = query?.startDate;
          let endDate = query?.endDate;

          // If no date range provided, default to today
          if (!startDate && !endDate) {
            startDate = endDate = getLocalDate();
          }

          // If only one date provided, use it for both
          if (startDate && !endDate) endDate = startDate;
          if (endDate && !startDate) startDate = endDate;

          if (!startDate || !endDate) {
            throw new Error("Date range is required");
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
            [internalUserId, startDate, endDate]
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
          query: t.Object({
            startDate: t.Optional(t.String()),
            endDate: t.Optional(t.String()),
          }),
          response: MacroSchemas.macroTotals,
          detail: {
            summary: "Get total macros consumed by the user for a date range (or today)",
            tags: ["Macros"],
          },
        }
      )

      // GET /history - Get macro history (paginated)
      .get(
        "/history",
        async (context: any) => {
          const { db, internalUserId, query } = context as MacrosRouteContext;

          if (!internalUserId) {
            throw new Error("User ID is required");
          }

          const userId = internalUserId as number;

          // Parse pagination params
          const limit = Math.max(1, Math.min(Number(query?.limit) || 20, 100));
          const offset = Math.max(0, Number(query?.offset) || 0);
          const startDate = query?.startDate;
          const endDate = query?.endDate;

          // Check if user is Pro
          const isProUser = await checkProStatus(userId);

          // Calculate the cutoff date for free users (60 days ago)
          const retentionDays = FREE_TIER_LIMITS.DATA_RETENTION_DAYS;
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
          const cutoffDateString = cutoffDate.toISOString().split('T')[0] as string;

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

          // Get total count (all entries for Pro, filtered for Free)
          const countResult = safeQuery<{ count: number }>(
            db,
            `SELECT COUNT(*) as count FROM macro_entries WHERE ${visibleWhere.where}`,
            visibleWhere.parameters
          );
          const visibleTotal = countResult?.count || 0;

          // Get total available (for upgrade prompt)
          const totalAvailableResult = safeQuery<{ count: number }>(
            db,
            `SELECT COUNT(*) as count FROM macro_entries WHERE ${totalWhere.where}`,
            totalWhere.parameters
          );
          const totalAvailable = totalAvailableResult?.count || 0;

          // Get paginated results
          const historyQuery = `SELECT id, protein, carbs, fats, meal_type, meal_name, entry_date, entry_time, ingredients, created_at 
             FROM macro_entries 
             WHERE ${visibleWhere.where}
             ORDER BY entry_date DESC, entry_time DESC, created_at DESC
             LIMIT ? OFFSET ?`;
          const historyParams = [...visibleWhere.parameters, limit, offset];

          const historyResult = safeQueryAll<MacroEntryRow & { ingredients: string }>(
            db,
            historyQuery,
            historyParams
          );

          // Build response with limits metadata for free users
          const response: {
            entries: any[];
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
            entries: historyResult.map((m) => {
              const camel = toCamelCase(m) as any;
              if (camel.ingredients) {
                try {
                  camel.ingredients = JSON.parse(camel.ingredients);
                } catch {
                  camel.ingredients = [];
                }
              }
              return camel;
            }),
            total: visibleTotal,
            limit,
            offset,
            hasMore: offset + limit < visibleTotal,
          };

          // Add limits metadata for free users
          if (!isProUser && totalAvailable > visibleTotal) {
            const hiddenCount = totalAvailable - visibleTotal;
            response.limits = {
              totalAvailable,
              visibleCount: visibleTotal,
              isRestricted: true,
              upgradePrompt: `${hiddenCount} older ${hiddenCount === 1 ? 'entry' : 'entries'} available with Pro`,
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
            limits: t.Optional(t.Object({
              totalAvailable: t.Numeric(),
              visibleCount: t.Numeric(),
              isRestricted: t.Boolean(),
              upgradePrompt: t.Optional(t.String()),
            })),
          }),
          detail: {
            summary: "Get paginated macro entries recorded by the user",
            tags: ["Macros"],
          },
        }
      )

      // POST / - Add new macro entry
      .post(
        "/",
        async (context: any) => {
          const { db, internalUserId, body } = context as MacrosRouteContext;

          if (!body) {
            throw new Error("Request body is required");
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
            ingredients?: any[];
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
            ]
          );

          if (!result) {
            throw new Error(
              "Failed to create macro entry or retrieve confirmation."
            );
          }

          const response = toCamelCase(result) as any;
          if (response.ingredients) {
            try {
              response.ingredients = JSON.parse(response.ingredients);
            } catch {
              response.ingredients = [];
            }
          }
          return response;
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
          const { db, internalUserId, params } = context as MacrosRouteContext;

          const entryId = params?.id;
          if (!entryId) {
            throw new NotFoundError("Macro entry ID is required");
          }

          const result = safeExecute(
            db,
            "DELETE FROM macro_entries WHERE id = ? AND user_id = ?",
            [entryId, internalUserId]
          );

          if (result.changes === 0) {
            throw new NotFoundError(
              `Macro entry with ID ${entryId} not found or access denied.`
            );
          }

          return {
            success: true,
            message: `Macro entry ${entryId} deleted.`,
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
          const { db, internalUserId, params, body } = context as MacrosRouteContext;

          if (!body) {
            throw new Error("Request body is required");
          }

          const entryId = params?.id;
          if (!entryId) {
            throw new NotFoundError("Macro entry ID is required");
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const updates: Record<string, any> = {};

          // Build update object with proper snake_case mapping
          if (body.protein !== undefined) updates.protein = body.protein;
          if (body.carbs !== undefined) updates.carbs = body.carbs;
          if (body.fats !== undefined) updates.fats = body.fats;
          if (body.mealType !== undefined) updates.meal_type = body.mealType;
          if (body.mealName !== undefined) updates.meal_name = body.mealName;
          if (body.entryDate !== undefined) updates.entry_date = body.entryDate;
          if (body.entryTime !== undefined) updates.entry_time = body.entryTime;
          if (body.ingredients !== undefined) updates.ingredients = JSON.stringify(body.ingredients);

          const fieldsToUpdate = Object.keys(updates);
          if (fieldsToUpdate.length === 0) {
            throw new Error("No valid fields provided for update.");
          }

          const setClause = fieldsToUpdate
            .map((field) => `${field} = ?`)
            .join(", ");
          const queryParams = [...Object.values(updates), entryId, internalUserId];

          const result = safeQuery<MacroEntryRow>(
            db,
            `UPDATE macro_entries SET ${setClause}
             WHERE id = ? AND user_id = ?
             RETURNING id, protein, carbs, fats, meal_type, meal_name, entry_date, entry_time, ingredients, created_at`,
            queryParams
          );

          if (!result) {
            // Check if entry exists to provide better error message
            const exists = safeQuery<{ id: number }>(
              db,
              "SELECT id FROM macro_entries WHERE id = ? AND user_id = ?",
              [entryId, internalUserId]
            );

            if (!exists) {
              throw new NotFoundError(
                `Macro entry with ID ${entryId} not found or access denied.`
              );
            } else {
              throw new Error(
                "Failed to update macro entry (update returned no data)."
              );
            }
          }

          const response = toCamelCase(result) as any;
          if (response.ingredients) {
            try {
              response.ingredients = JSON.parse(response.ingredients);
            } catch {
              response.ingredients = [];
            }
          }
          return response;
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
