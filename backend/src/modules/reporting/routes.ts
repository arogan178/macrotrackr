import { Elysia, t } from "elysia";
import { getExpenditure, getMacroDensitySummary } from "./service";
import { AuthenticationError } from "../../lib/http/errors";
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

type ExpenditureRouteContext = AuthenticatedRouteContextWithUser<
  Record<string, never>,
  Record<string, string>,
  { today: string; tzOffsetMinutes: number }
>;

const ExpenditureResponseSchema = t.Union([
  t.Object({
    status: t.Literal("measured"),
    estimate: t.Number(),
    avgIntake: t.Number(),
    usableDays: t.Number(),
    windowDays: t.Literal(21),
    trendStartKg: t.Number(),
    trendEndKg: t.Number(),
    spanDays: t.Number(),
    dailyBalance: t.Number(),
  }),
  t.Object({
    status: t.Literal("insufficient"),
    usableDays: t.Number(),
    weighInsInWindow: t.Number(),
    needs: t.Object({ loggedDays: t.Number(), weighIns: t.Number() }),
  }),
]);

export const reportingRoutes = new Elysia({ prefix: "/api/reporting" })
  .get(
    "/nutrient-density-summary",
    async (rawContext: unknown) => {
      const context = rawContext as ReportingRouteContext;
      const { authenticatedUser, query, db } = context;
      const internalUserId = authenticatedUser.userId;

      if (internalUserId === null) {
        throw new AuthenticationError("Authentication required. Please sign in.");
      }

      // Accepts: startDate, endDate, groupBy (e.g., day, week, month)
      const { startDate, endDate, groupBy } = query;
      
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
  )
  .get(
    "/expenditure",
    (rawContext: unknown) => {
      const context = rawContext as ExpenditureRouteContext;
      const { authenticatedUser, query, db } = context;
      if (authenticatedUser.userId === null) {
        throw new AuthenticationError("Authentication required. Please sign in.");
      }

      // Derived numbers only, so every plan gets it: no free history window.
      return getExpenditure({
        db,
        userId: authenticatedUser.userId,
        today: query.today,
        tzOffsetMinutes: query.tzOffsetMinutes,
      });
    },
    {
      query: t.Object({
        today: t.String({
          format: "date",
          pattern: "^\\d{4}-\\d{2}-\\d{2}$",
          description: "The user's current calendar day, YYYY-MM-DD.",
        }),
        tzOffsetMinutes: t.Integer({
          minimum: -840,
          maximum: 840,
          description:
            "Minutes the user's clock is behind UTC, as Date.prototype.getTimezoneOffset returns it: UTC+2 is -120, UTC-5 is 300.",
        }),
      }),
      response: ExpenditureResponseSchema,
      detail: {
        summary:
          "Measured expenditure from logged intake and the weight trend over the last 3 weeks",
        tags: ["Reporting"],
      },
    }
  );
