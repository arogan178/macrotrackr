import { Elysia, t } from "elysia";
import {
  safeExecute,
  safeQuery,
  safeQueryAll,
  withTransaction,
  type MacroEntryRow,
} from "../../lib/data/database";
import { getLocalDate } from "../../lib/utils/dates";
import {
  AuthenticationError,
  BadRequestError,
  DatabaseError,
  NotFoundError,
} from "../../lib/http/errors";
import { mutationSuccessWithId } from "../../lib/http/mutation-contract";
import { publishUserSyncEvent } from "../../lib/sync/eventBus";
import { captureProductEvent } from "../../lib/analytics/product-analytics";
import {
  checkProStatus,
  FREE_TIER_LIMITS,
} from "../../middleware/clerk-guards";
import { generateId } from "../../utils/id-generator";
import {
  isImportFormat,
  normalizeDate,
  normalizeTime,
  parseImportFile,
} from "@shared/importer";
import { MacroSchemas } from "./schemas";
import {
  type MacroEntryResponse,
  normalizeMacroEntryRow,
  type MacrosRouteContext,
} from "./service";

interface TrackingProgress {
  distinctDays: number;
  entryCount: number;
  hasEntryForDate?: number;
}

const ENTRY_COLUMNS =
  "id, protein, carbs, fats, meal_type, meal_name, entry_date, entry_time, ingredients, client_id, client_updated_at, created_at";

function entryUpdatesFromBody(body: Record<string, unknown>) {
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

  if (Object.keys(updates).length === 0) {
    throw new BadRequestError("No valid fields provided for update.");
  }
  return updates;
}

function setClauseFor(updates: Record<string, unknown>) {
  return {
    setClause: Object.keys(updates)
      .map((field) => `${field} = ?`)
      .join(", "),
    values: Object.values(updates) as Array<string | number | null>,
  };
}

export const macroEntryRoutes = new Elysia()
    .get(
      "/totals",
      async (rawContext: unknown) => {
        const context = rawContext as MacrosRouteContext;
        const { db, query } = context;
        const internalUserId = context.authenticatedUser.userId;
        let { startDate, endDate } = query;

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
          calories: Math.round(
            result.protein * 4 + result.carbs * 4 + result.fats * 9,
          ),
        };
      },
      {
        query: t.Object({
          startDate: t.Optional(t.String()),
          endDate: t.Optional(t.String()),
        }),
        response: MacroSchemas.macroTotals,
        detail: {
          summary:
            "Get total macros consumed by the user for a date range (or today)",
          tags: ["Macros"],
        },
      },
    )
    .get(
      "/history",
      async (rawContext: unknown) => {
        const context = rawContext as MacrosRouteContext;
        const { db, query } = context;
        const internalUserId = context.authenticatedUser.userId;

        if (!internalUserId) {
          throw new AuthenticationError("Authentication required.");
        }

        const userId = internalUserId;
        const limit = Math.max(1, Math.min(Number(query.limit ?? 20), 100));
        const offset = Math.max(0, Number(query.offset ?? 0));
        const startDate = query.startDate;
        const endDate = query.endDate;

        // The delete-account export must hand over every entry, not just the free window.
        const isRestricted =
          query.fullExport !== "true" && !(await checkProStatus(userId));
        const visibleDays = FREE_TIER_LIMITS.FREE_VISIBLE_HISTORY_DAYS;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - visibleDays);
        const cutoffDateString = cutoffDate
          .toISOString()
          .split("T")[0] as string;

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

        const visibleWhere = buildWhereClause(isRestricted);
        const totalWhere = buildWhereClause(false);

        const countResult = safeQuery<{ count: number }>(
          db,
          `SELECT COUNT(*) as count FROM macro_entries WHERE ${visibleWhere.where}`,
          visibleWhere.parameters,
        );
        const visibleTotal = countResult?.count ?? 0;

        const totalAvailableResult = safeQuery<{ count: number }>(
          db,
          `SELECT COUNT(*) as count FROM macro_entries WHERE ${totalWhere.where}`,
          totalWhere.parameters,
        );
        const totalAvailable = totalAvailableResult?.count ?? 0;

        const historyQuery = `SELECT ${ENTRY_COLUMNS}
           FROM macro_entries
           WHERE ${visibleWhere.where}
           ORDER BY entry_date DESC, entry_time DESC, created_at DESC
           LIMIT ? OFFSET ?`;
        const historyParams = [...visibleWhere.parameters, limit, offset];

        const historyResult = safeQueryAll<
          MacroEntryRow & { ingredients: string }
        >(db, historyQuery, historyParams);

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

        if (isRestricted && totalAvailable > visibleTotal) {
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
          fullExport: t.Optional(t.Literal("true")),
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
      async (rawContext: unknown) => {
        const context = rawContext as MacrosRouteContext;
        const { db, body } = context;
        const internalUserId = context.authenticatedUser.userId;

        if (internalUserId === null) {
          throw new AuthenticationError("Authentication required.");
        }

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
          clientId,
          clientUpdatedAt,
        } = body as {
          protein: number;
          carbs: number;
          fats: number;
          mealType: string;
          mealName?: string;
          entryDate: string;
          entryTime: string;
          ingredients?: unknown[];
          clientId?: string;
          clientUpdatedAt?: number;
        };
        const entryClientId = clientId ?? crypto.randomUUID();

        const ingredientsJson = ingredients
          ? JSON.stringify(ingredients)
          : null;

        const { result, created, trackedThirdDay, wasFirstMeal } =
          withTransaction(db, () => {
            const progress = safeQuery<TrackingProgress>(
              db,
              `SELECT COUNT(*) AS entryCount,
                      COUNT(DISTINCT entry_date) AS distinctDays,
                      MAX(CASE WHEN entry_date = ? THEN 1 ELSE 0 END) AS hasEntryForDate
                 FROM macro_entries
                WHERE user_id = ?`,
              [entryDate, internalUserId],
            ) ?? { distinctDays: 0, entryCount: 0, hasEntryForDate: 0 };

            const inserted = safeQuery<MacroEntryRow>(
              db,
              `INSERT INTO macro_entries (user_id, protein, carbs, fats, meal_type, meal_name, entry_date, entry_time, ingredients, client_id, client_updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
               ON CONFLICT(user_id, client_id) DO NOTHING
               RETURNING ${ENTRY_COLUMNS}`,
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
                entryClientId,
                clientUpdatedAt ?? null,
              ],
            );

            return {
              result:
                inserted ??
                safeQuery<MacroEntryRow>(
                  db,
                  `SELECT ${ENTRY_COLUMNS} FROM macro_entries WHERE user_id = ? AND client_id = ?`,
                  [internalUserId, entryClientId],
                ),
              created: inserted !== undefined,
              trackedThirdDay:
                progress.distinctDays === 2 && progress.hasEntryForDate !== 1,
              wasFirstMeal: progress.entryCount === 0,
            };
          });

        if (!result) {
          throw new DatabaseError(
            "Failed to create macro entry or retrieve confirmation.",
          );
        }

        if (!created) {
          return normalizeMacroEntryRow(result);
        }

        publishUserSyncEvent(internalUserId, "macros");

        if (wasFirstMeal) {
          void captureProductEvent({
            distinctId: internalUserId,
            event: "first_meal_logged",
            properties: { entryMethod: "manual" },
          });
        }
        if (trackedThirdDay) {
          void captureProductEvent({
            distinctId: internalUserId,
            event: "third_tracked_day",
            properties: { distinctDays: 3 },
          });
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
    .post(
      "/import",
      async (rawContext: unknown) => {
        const context = rawContext as MacrosRouteContext;
        const { db, body } = context;
        const internalUserId = context.authenticatedUser.userId;

        if (!internalUserId) {
          throw new AuthenticationError("Authentication required.");
        }

        if (!body) {
          throw new BadRequestError("Request body is required.");
        }

        const payload = body as {
          source?: string;
          entries?: Array<{
            protein: number;
            carbs: number;
            fats: number;
            mealType: "breakfast" | "lunch" | "dinner" | "snack";
            mealName?: string;
            entryDate: string;
            entryTime?: string;
            ingredients?: unknown[];
          }>;
          weightLogs?: Array<{
            timestamp: string;
            weight: number;
          }>;
          rawData?: string;
        };

        let importSource = isImportFormat(payload.source)
          ? payload.source
          : "unknown";
        let entries = payload.entries ?? [];
        let weightLogs = payload.weightLogs ?? [];

        if (
          entries.length === 0 &&
          weightLogs.length === 0 &&
          payload.rawData
        ) {
          const parsed = parseImportFile(
            payload.rawData,
            isImportFormat(payload.source) ? payload.source : undefined,
          );
          importSource = parsed.format;
          entries = parsed.entries;
          weightLogs = parsed.weightLogs;
        }

        if (entries.length === 0 && weightLogs.length === 0) {
          throw new BadRequestError(
            "No valid macro entries or weight logs found in import payload.",
          );
        }

        const dates = new Set<string>();

        const activation = withTransaction(db, () => {
          const progressBefore = safeQuery<TrackingProgress>(
            db,
            `SELECT COUNT(*) AS entryCount,
                    COUNT(DISTINCT entry_date) AS distinctDays
               FROM macro_entries
              WHERE user_id = ?`,
            [internalUserId],
          ) ?? { distinctDays: 0, entryCount: 0 };

          if (entries.length > 0) {
            const insertMacroStmt = db.prepare(
              `INSERT INTO macro_entries (user_id, protein, carbs, fats, meal_type, meal_name, entry_date, entry_time, ingredients, client_id)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            );

            for (const entry of entries) {
              const ingredientsJson = entry.ingredients
                ? JSON.stringify(entry.ingredients)
                : null;
              const date = normalizeDate(entry.entryDate) ?? entry.entryDate;
              dates.add(date);
              const time = normalizeTime(entry.entryTime, entry.mealType);
              insertMacroStmt.run(
                internalUserId,
                Math.max(0, entry.protein),
                Math.max(0, entry.carbs),
                Math.max(0, entry.fats),
                entry.mealType,
                entry.mealName ?? "",
                date,
                time,
                ingredientsJson,
                crypto.randomUUID(),
              );
            }
          }

          if (weightLogs.length > 0) {
            const insertWeightStmt = db.prepare(
              `INSERT INTO weight_log (id, user_id, timestamp, weight)
               VALUES (?, ?, ?, ?)`,
            );

            for (const wl of weightLogs) {
              const date = normalizeDate(wl.timestamp) ?? wl.timestamp;
              const dateOnly = date.split("T")[0];
              if (dateOnly) {
                dates.add(dateOnly);
              }
              const id = generateId("wl");
              insertWeightStmt.run(id, internalUserId, date, wl.weight);
            }
          }

          const progressAfter =
            safeQuery<TrackingProgress>(
              db,
              `SELECT COUNT(*) AS entryCount,
                    COUNT(DISTINCT entry_date) AS distinctDays
               FROM macro_entries
              WHERE user_id = ?`,
              [internalUserId],
            ) ?? progressBefore;

          return {
            trackedThirdDay:
              progressBefore.distinctDays < 3 &&
              progressAfter.distinctDays >= 3,
            wasFirstMeal:
              progressBefore.entryCount === 0 && progressAfter.entryCount > 0,
          };
        });

        publishUserSyncEvent(internalUserId, "macros");
        if (weightLogs.length > 0) {
          publishUserSyncEvent(internalUserId, "goals");
        }

        void captureProductEvent({
          distinctId: internalUserId,
          event: "import_completed",
          properties: {
            importSource,
            mealCount: entries.length,
            weightLogCount: weightLogs.length,
          },
        });
        if (activation.wasFirstMeal) {
          void captureProductEvent({
            distinctId: internalUserId,
            event: "first_meal_logged",
            properties: { entryMethod: "import", importSource },
          });
        }
        if (activation.trackedThirdDay) {
          void captureProductEvent({
            distinctId: internalUserId,
            event: "third_tracked_day",
            properties: { distinctDays: 3 },
          });
        }

        const sortedDates = Array.from(dates).sort();
        const dateRange =
          sortedDates.length > 0 &&
          sortedDates[0] &&
          sortedDates[sortedDates.length - 1]
            ? {
                start: sortedDates[0],
                end: sortedDates[sortedDates.length - 1]!,
              }
            : null;

        return {
          success: true,
          importedCount: {
            macros: entries.length,
            weightLogs: weightLogs.length,
          },
          dateRange,
          message: `Successfully imported ${entries.length} macro ${
            entries.length === 1 ? "entry" : "entries"
          }${
            weightLogs.length > 0
              ? ` and ${weightLogs.length} weight ${
                  weightLogs.length === 1 ? "record" : "records"
                }`
              : ""
          }.`,
        };
      },
      {
        body: MacroSchemas.importDataPayload,
        response: MacroSchemas.importDataResponse,
        detail: {
          summary: "Bulk import macro entries and weight records",
          tags: ["Macros"],
        },
      },
    )
    .delete(
      "/:id",
      async (rawContext: unknown) => {
        const context = rawContext as MacrosRouteContext;
        const { db, params } = context;
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

        publishUserSyncEvent(internalUserId, "macros");

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
      async (rawContext: unknown) => {
        const context = rawContext as MacrosRouteContext;
        const { db, params, body } = context;
        const internalUserId = context.authenticatedUser.userId;

        if (!body) {
          throw new BadRequestError("Request body is required");
        }

        const entryId = params?.id;
        if (!entryId) {
          throw new NotFoundError("Macro entry ID is required");
        }

        // Stamped so a stale offline edit queued earlier cannot overwrite this one.
        const { setClause, values } = setClauseFor({
          ...entryUpdatesFromBody(body),
          client_updated_at: Date.now(),
        });

        const result = safeQuery<MacroEntryRow>(
          db,
          `UPDATE macro_entries SET ${setClause}
           WHERE id = ? AND user_id = ?
           RETURNING ${ENTRY_COLUMNS}`,
          [...values, Number(entryId), internalUserId],
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

          throw new DatabaseError(
            "Failed to update macro entry (update returned no data).",
          );
        }

        publishUserSyncEvent(internalUserId, "macros");

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
    )
    .put(
      "/by-client-id/:clientId",
      async (rawContext: unknown) => {
        const context = rawContext as MacrosRouteContext;
        const { db, params, body } = context;
        const internalUserId = context.authenticatedUser.userId;

        if (!body) {
          throw new BadRequestError("Request body is required");
        }

        const clientId = params?.clientId as string;
        const clientUpdatedAt = body.clientUpdatedAt as number;
        const { setClause, values } = setClauseFor({
          ...entryUpdatesFromBody(body),
          client_updated_at: clientUpdatedAt,
        });

        const updated = safeQuery<MacroEntryRow>(
          db,
          `UPDATE macro_entries SET ${setClause}
           WHERE user_id = ? AND client_id = ?
             AND (client_updated_at IS NULL OR client_updated_at < ?)
           RETURNING ${ENTRY_COLUMNS}`,
          [...values, internalUserId, clientId, clientUpdatedAt],
        );

        if (updated) {
          publishUserSyncEvent(internalUserId, "macros");
          return normalizeMacroEntryRow(updated);
        }

        // A replayed or out-of-order edit is ignored and the current row returned.
        const existing = safeQuery<MacroEntryRow>(
          db,
          `SELECT ${ENTRY_COLUMNS} FROM macro_entries WHERE user_id = ? AND client_id = ?`,
          [internalUserId, clientId],
        );
        if (!existing) {
          throw new NotFoundError(
            `Macro entry with client ID ${clientId} not found or access denied.`,
          );
        }
        return normalizeMacroEntryRow(existing);
      },
      {
        params: MacroSchemas.macroClientIdParam,
        body: MacroSchemas.macroEntryClientUpdate,
        response: MacroSchemas.macroEntryResponse,
        detail: {
          summary:
            "Apply a device edit to a macro entry unless a newer one already landed",
          tags: ["Macros"],
        },
      },
    )
    .delete(
      "/by-client-id/:clientId",
      async (rawContext: unknown) => {
        const context = rawContext as MacrosRouteContext;
        const { db, params } = context;
        const internalUserId = context.authenticatedUser.userId;
        const clientId = params?.clientId as string;

        const result = safeExecute(
          db,
          "DELETE FROM macro_entries WHERE user_id = ? AND client_id = ?",
          [internalUserId, clientId],
        );

        if (result.changes > 0) {
          publishUserSyncEvent(internalUserId, "macros");
        }

        return { success: true, clientId };
      },
      {
        params: MacroSchemas.macroClientIdParam,
        response: {
          200: MacroSchemas.deleteMacroEntryByClientIdResponse,
        },
        detail: {
          summary:
            "Delete a macro entry by its device id, succeeding if it is already gone",
          tags: ["Macros"],
        },
      },
    );
