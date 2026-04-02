import { Elysia, t } from "elysia";
import { getMacroDensitySummary } from "./service";
import { requireAuth } from "../../middleware/clerk-guards";
import type { AuthenticatedRouteContextWithUser } from "../../types";

type ReportingQuery = {
  startDate?: string;
  endDate?: string;
  groupBy?: "day" | "week" | "month";
};

type ReportingRouteContext = AuthenticatedRouteContextWithUser<
  Record<string, never>,
  Record<string, string>,
  ReportingQuery
>;

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
  .use(requireAuth)
  .get(
    "/nutrient-density-summary",
    async (rawContext: unknown) => {
      const context = rawContext as ReportingRouteContext;
      const { authenticatedUser, query, db } = context;
      const internalUserId = authenticatedUser.userId;

      if (internalUserId === null) {
        throw new Error("Authenticated user ID is required");
      }

      // Accepts: startDate, endDate, groupBy (e.g., day, week, month)
      const { startDate, endDate, groupBy } = query ?? {};
      
      // Only allow 'day', 'week' or 'month' for groupBy
      const groupByValue =
        groupBy === "day" || groupBy === "week" || groupBy === "month" ? groupBy : undefined;
      
      const summary = await getMacroDensitySummary({
        db,
        userId: internalUserId.toString(),
        startDate,
        endDate,
        groupBy: groupByValue,
      });
      
      return summary;
    },
    {
      query: t.Object({
        startDate: t.Optional(t.String()),
        endDate: t.Optional(t.String()),
        groupBy: t.Optional(t.Union([t.Literal("day"), t.Literal("week"), t.Literal("month")])),
      }),
      response: NutrientDensitySummaryResponseSchema,
      detail: {
        summary: "Get nutrient density summary for reporting",
        tags: ["Reporting"],
      },
    }
  );
