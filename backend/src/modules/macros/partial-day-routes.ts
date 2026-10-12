import { Elysia } from "elysia";

import { safeExecute, safeQueryAll } from "../../lib/data/database";
import {
  AuthenticationError,
  AuthorizationError,
} from "../../lib/http/errors";
import { publishUserSyncEvent } from "../../lib/sync/eventBus";
import { checkProStatus } from "../../middleware/clerk-guards";
import { MacroSchemas } from "./schemas";
import { freeHistoryCutoffDate, type MacrosRouteContext } from "./service";

function requireUserId(context: MacrosRouteContext): number {
  const userId = context.authenticatedUser.userId;
  if (!userId) {
    throw new AuthenticationError("Authentication required.");
  }
  return userId;
}

// A day is complete unless listed here. Expenditure estimates skip partial days.
export const macroPartialDayRoutes = new Elysia()
  .get(
    "/partial-days",
    async (rawContext: unknown) => {
      const context = rawContext as MacrosRouteContext;
      const { db, query } = context;
      const userId = requireUserId(context);
      const isPro = await checkProStatus(userId);
      const cutoff = freeHistoryCutoffDate();
      const startDate = query.startDate as string;
      const fromDate = isPro || startDate > cutoff ? startDate : cutoff;

      const rows = safeQueryAll<{ entry_date: string }>(
        db,
        `SELECT entry_date FROM partial_days
         WHERE user_id = ? AND entry_date >= ? AND entry_date <= ?
         ORDER BY entry_date`,
        [userId, fromDate, query.endDate as string],
      );
      return { dates: rows.map((row) => row.entry_date) };
    },
    {
      query: MacroSchemas.partialDaysQuery,
      response: MacroSchemas.partialDaysResponse,
      detail: {
        summary: "List the days in a range the user marked as partly logged",
        tags: ["Macros"],
      },
    },
  )
  .put(
    "/partial-days/:date",
    async (rawContext: unknown) => {
      const context = rawContext as MacrosRouteContext;
      const { db, params, body } = context;
      const userId = requireUserId(context);
      const date = params?.date as string;
      const partial = (body as { partial: boolean }).partial;

      if (date < freeHistoryCutoffDate() && !(await checkProStatus(userId))) {
        throw new AuthorizationError(
          "Days older than the free history window need Pro.",
        );
      }

      const result = partial
        ? safeExecute(
            db,
            "INSERT OR IGNORE INTO partial_days (user_id, entry_date) VALUES (?, ?)",
            [userId, date],
          )
        : safeExecute(
            db,
            "DELETE FROM partial_days WHERE user_id = ? AND entry_date = ?",
            [userId, date],
          );

      if (result.changes > 0) {
        publishUserSyncEvent(userId, "macros");
      }
      return { date, partial };
    },
    {
      params: MacroSchemas.partialDayParam,
      body: MacroSchemas.partialDayBody,
      response: MacroSchemas.partialDayResponse,
      detail: {
        summary: "Mark or unmark a day as partly logged",
        tags: ["Macros"],
      },
    },
  );
