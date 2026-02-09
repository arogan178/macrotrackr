import { Elysia, t } from "elysia";
import { getMacroDensitySummary } from "./service";
import { toCamelCase } from "../../lib/responses";
import { db } from "../../db";
import { authMiddleware } from "../../middleware/auth";
import type { AuthenticatedContext } from "../../middleware/auth";

// Response schema for nutrient density summary
const NutrientDensityItemSchema = t.Object({
  period: t.String(),
  protein: t.Number(),
  carbs: t.Number(),
  fats: t.Number(),
  calories: t.Number(),
  count: t.Number(),
});

const NutrientDensitySummaryResponseSchema = t.Array(NutrientDensityItemSchema);

export const reportingRoutes = new Elysia({ prefix: "/api/reporting" })
  .decorate("db", db)
  .use(authMiddleware)
  .get(
    "/nutrient-density-summary",
    async (context: any) => {
      const { user, query } = context as AuthenticatedContext & { query?: Record<string, string | undefined> };
      
      // Accepts: startDate, endDate, groupBy (e.g., week, month)
      const { startDate, endDate, groupBy } = query ?? {};
      
      // Only allow 'week' or 'month' for groupBy
      const groupByValue =
        groupBy === "week" || groupBy === "month" ? groupBy : undefined;
      
      const summary = await getMacroDensitySummary({
        userId: user.userId.toString(),
        startDate,
        endDate,
        groupBy: groupByValue,
      });
      
      return toCamelCase(summary);
    },
    {
      query: t.Object({
        startDate: t.Optional(t.String()),
        endDate: t.Optional(t.String()),
        groupBy: t.Optional(t.Union([t.Literal("week"), t.Literal("month")])),
      }),
      response: NutrientDensitySummaryResponseSchema,
      detail: {
        summary: "Get nutrient density summary for reporting",
        tags: ["Reporting"],
      },
    }
  );
