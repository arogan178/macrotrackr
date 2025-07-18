import { Elysia } from "elysia";
import { getMacroDensitySummary } from "./service";
import { toCamelCase } from "../../lib/responses";

export const reportingRoutes = new Elysia({ prefix: "/api/reporting" }).get(
  "/nutrient-density-summary",
  async (ctx) => {
    // Accepts: startDate, endDate, groupBy (e.g., week, month)
    const { startDate, endDate, groupBy } = (ctx.query ?? {}) as Record<
      string,
      string
    >;
    // Only allow 'week' or 'month' for groupBy
    const groupByValue =
      groupBy === "week" || groupBy === "month" ? groupBy : undefined;
    const summary = await getMacroDensitySummary({
      userId: (ctx.store as { userId: string }).userId,
      startDate,
      endDate,
      groupBy: groupByValue,
    });
    return toCamelCase(summary);
  }
);
